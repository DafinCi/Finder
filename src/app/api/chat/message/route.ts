import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  groq,
  DEFAULT_GROQ_MODEL,
  normalizeGroqError,
  executeStreamWithResilience,
  estimateTokens,
} from "@/lib/groq/client";
import {
  buildCareerCopilotSystemPrompt,
  CAREER_COPILOT_PROMPT_VERSION,
} from "@/lib/groq/prompts/career-copilot.prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { careerMemoryService } from "@/features/memory/services/career-memory.service";
import { AGENT_TOOL_DEFINITIONS } from "@/features/agent/tools/agent-tool.definitions";
import {
  agentToolDispatcher,
  ActionProposalData,
  AgentToolResult,
} from "@/features/agent/services/agent-tool-dispatcher.service";
import { emitAiEvent, obfuscateId } from "@/lib/observability/ai-events";

export const dynamic = "force-dynamic";

const MAX_PROMPT_CHARS = 2000;

interface MemoryRecallPayload {
  source: "walrus" | "cache" | "none";
  count: number;
  stateless: boolean;
  memories: Array<{
    content: string;
    category: string | null;
    blobId: string | null;
  }>;
}

function getToolStartLabel(toolName: string): string {
  switch (toolName) {
    case "get_career_recommendations":
      return "Searching and analyzing matching career opportunities...";
    case "inspect_job_details":
      return "Retrieving detailed job opportunity specifications...";
    case "save_job":
      return "Saving opportunity to bookmarks...";
    case "reject_job":
      return "Recording rejection feedback...";
    case "remember_fact":
      return "Saving fact to sovereign career memory...";
    case "propose_preference_update":
      return "Preparing profile preference update proposal...";
    case "read_candidate_cv":
      return "Reading and analyzing resume document...";
    default:
      return "Executing agent action...";
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit Guard: max 12 messages per minute per user to protect Groq TPM/RPM
    const rateLimit = checkRateLimit({
      key: `chat:${user.id}`,
      limit: 12,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many requests. Please wait ${rateLimit.resetInSeconds} seconds before sending another message.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetInSeconds),
          },
        },
      );
    }

    const body = await req.json();
    const { session_id, content, simulate_stateless } = body;
    const isStatelessSimulation =
      simulate_stateless === true ||
      req.headers.get("x-simulate-stateless") === "true" ||
      req.nextUrl.searchParams.get("demo") === "stateless" ||
      req.nextUrl.searchParams.get("mode") === "amnesia";

    if (!session_id || !content?.trim()) {
      return NextResponse.json(
        { error: "session_id and content are required." },
        { status: 400 },
      );
    }

    const cleanContent = content.trim();

    // Input length guardrail to protect TPM and model window
    if (cleanContent.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        {
          error: `Message too long. Maximum ${MAX_PROMPT_CHARS} characters per message.`,
        },
        { status: 400 },
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("chat_sessions")
      .select("*, resumes(id, file_name)")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Conversation session not found." },
        { status: 404 },
      );
    }

    // Save user message
    const { data: userMsg, error: userMsgError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        session_id,
        role: "user",
        content: cleanContent,
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // 1. Resolve candidate profile & active resume with dual-source fallback
    let candidateContext = "";
    let matchesContext = "";
    let activeResumeId = session.resume_id;
    let candidateProfile: any = null;
    let activeResumeRecord: any = null;

    if (!activeResumeId) {
      const [cpRes, latestResumeRes] = await Promise.all([
        supabaseAdmin
          .from("career_profiles")
          .select("resume_id, background, capabilities, career_intent, preferences")
          .eq("profile_id", user.id)
          .maybeSingle(),
        supabaseAdmin
          .from("resumes")
          .select("id, file_name, raw_text")
          .eq("profile_id", user.id)
          .neq("status", "failed")
          .order("uploaded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      candidateProfile = cpRes.data;
      activeResumeRecord = latestResumeRes.data;
      activeResumeId =
        candidateProfile?.resume_id || activeResumeRecord?.id || null;

      if (activeResumeId) {
        // Non-blocking auto-link to session
        (async () => {
          try {
            await supabaseAdmin
              .from("chat_sessions")
              .update({ resume_id: activeResumeId })
              .eq("id", session_id);
          } catch (e) {
            console.warn("Failed to auto-link resume to session:", e);
          }
        })().catch(() => {});
      }
    } else {
      // Security P0: Verify linked resume belongs to current user
      const [ownershipRes, cpRes] = await Promise.all([
        supabaseAdmin
          .from("resumes")
          .select("id, profile_id, file_name")
          .eq("id", activeResumeId)
          .maybeSingle(),
        supabaseAdmin
          .from("career_profiles")
          .select("resume_id, background, capabilities, career_intent, preferences")
          .eq("profile_id", user.id)
          .maybeSingle(),
      ]);

      const isOwner =
        ownershipRes.data && ownershipRes.data.profile_id === user.id;
      if (!isOwner) {
        console.warn(
          `[SECURITY ALERT] Blocked candidate context leakage: Session ${session_id} has resume_id ${activeResumeId} not owned by user ${user.id}`,
        );
        activeResumeId = null;
      } else {
        activeResumeRecord = ownershipRes.data;
      }
      candidateProfile = cpRes.data;
    }

    let analysis: any = null;
    if (activeResumeId) {
      const analysisRes = await supabaseAdmin
        .from("resume_analysis")
        .select("id, candidate_data, extracted_skills")
        .eq("resume_id", activeResumeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      analysis = analysisRes.data;
    }

    if (activeResumeId || candidateProfile) {
      interface CompressedCandidate {
        name?: string;
        title?: string;
        years_of_experience?: number;
        skills?: { core?: string[] };
      }
      interface CompressedCareer {
        career_level?: string;
        strengths?: string[];
      }
      interface RawData {
        candidate?: CompressedCandidate;
        career?: CompressedCareer;
        name?: string;
        title?: string;
        years_of_experience?: number;
        skills?: { core?: string[] };
        career_level?: string;
        strengths?: string[];
      }

      const raw = (analysis?.candidate_data as RawData) || {};
      const c = raw.candidate || raw;
      const career = raw.career || raw;

      const resumeFileName = activeResumeRecord?.file_name || "Resume Document";
      const candidateName = c?.name || "Candidate";
      const candidateTitle =
        c?.title ||
        candidateProfile?.career_intent?.target_roles?.[0]?.role ||
        "Professional";
      const yearsExp = c?.years_of_experience ?? 0;
      const careerLevel =
        career?.career_level ||
        candidateProfile?.career_intent?.target_level ||
        "Mid-Level";

      const coreSkills = Array.isArray(c?.skills?.core)
        ? c.skills.core.join(", ")
        : (analysis?.extracted_skills || []).slice(0, 10).join(", ") ||
          (candidateProfile?.capabilities?.skills || [])
            .slice(0, 10)
            .map((s: any) => s.skill)
            .join(", ") ||
          "General";

      const experiences = (candidateProfile?.background?.experience || [])
        .slice(0, 2)
        .map((exp: any) => `${exp.role_title} at ${exp.company_name}`)
        .join("; ");

      const education = (candidateProfile?.background?.education || [])
        .slice(0, 1)
        .map((edu: any) => `${edu.degree} at ${edu.institution}`)
        .join("; ");

      const targetRoles = (
        candidateProfile?.career_intent?.target_roles || []
      )
        .map((r: any) => r.role)
        .join(", ");

      const workModes = (candidateProfile?.preferences?.work_modes || []).join(
        ", ",
      );

      const expStr = experiences
        ? `\n- Recent Experience: ${experiences}`
        : "";
      const eduStr = education ? `\n- Education: ${education}` : "";
      const targetRolesStr = targetRoles
        ? `\n- Target Roles: ${targetRoles}`
        : "";
      const workModesStr = workModes
        ? `\n- Work Mode Preferences: ${workModes}`
        : "";

      candidateContext = `\n\n<untrusted_career_data>\n[ACTIVE CANDIDATE PROFILE & RESUME DATA]:
- Document Status: Available (${resumeFileName})
- Name & Title: ${candidateName} | ${candidateTitle}
- Experience & Level: ${yearsExp > 0 ? `${yearsExp} years | ` : ""}${careerLevel}
- Key Skills: ${coreSkills}${expStr}${eduStr}${targetRolesStr}${workModesStr}\n</untrusted_career_data>`;

      // Grounding: Load candidate's top matched jobs for this session
      if (analysis?.id) {
        const { data: topMatches } = await supabaseAdmin
          .from("job_matches")
          .select(
            `
          match_score,
          missing_skills,
          jobs:job_id (
            id,
            title,
            location,
            experience_level,
            companies:company_id (
              name
            )
          )
        `,
          )
          .eq("analysis_id", analysis.id)
          .order("match_score", { ascending: false })
          .limit(3);

        interface MatchJoinRow {
          match_score: number;
          missing_skills: string[];
          jobs: {
            id: string;
            title: string;
            location: string;
            experience_level: string;
            companies: { name: string } | null;
          } | null;
        }

        if (topMatches && topMatches.length > 0) {
          const typedMatches = topMatches as unknown as MatchJoinRow[];
          const listStr = typedMatches
            .map(
              (m) =>
                `- ${m.jobs?.title || "Role"} at ${
                  m.jobs?.companies?.name || "Partner Company"
                } (Match Score: ${m.match_score}%, Missing Skills: ${
                  (m.missing_skills || []).slice(0, 3).join(", ") || "None"
                })`,
            )
            .join("\n");
          matchesContext = `\n\n<untrusted_career_data>\n[RECOMMENDED MATCHES FOR CANDIDATE]:\n${listStr}\n</untrusted_career_data>`;
        }
      }
    } else {
      candidateContext = `\n\n<untrusted_career_data>\n[CANDIDATE STATUS]: No resume uploaded or profile registered in the system yet.\n</untrusted_career_data>`;
    }

    // 2. Specific Job Grounding: check if user query mentions a specific active job title or company
    let specificJobContext = "";
    const { data: allActiveJobs } = await supabaseAdmin
      .from("jobs")
      .select(
        "id, title, description, requirements, location, job_type, salary_range, companies:company_id ( name )",
      )
      .eq("is_active", true)
      .limit(20);

    if (allActiveJobs && allActiveJobs.length > 0) {
      interface ActiveJobRow {
        id: string;
        title: string;
        description: string;
        requirements: string[];
        location: string;
        job_type: string;
        salary_range: string | null;
        companies: { name: string } | null;
      }
      const lowerContent = cleanContent.toLowerCase();
      const matchedActiveJob = (
        allActiveJobs as unknown as ActiveJobRow[]
      ).find(
        (j) =>
          lowerContent.includes(j.title.toLowerCase()) ||
          (j.companies?.name &&
            lowerContent.includes(j.companies.name.toLowerCase())),
      );

      if (matchedActiveJob) {
        specificJobContext = `\n\n<untrusted_job_data>\n[OFFICIAL JOB POSTING DATA UNDER DISCUSSION]:
- Position: ${matchedActiveJob.title}
- Company: ${matchedActiveJob.companies?.name || "Partner Company"}
- Location & Type: ${matchedActiveJob.location} (${matchedActiveJob.job_type})
- Salary / Compensation: ${matchedActiveJob.salary_range || "Competitive / Industry Standard"}
- Qualifications & Requirements: ${matchedActiveJob.requirements.join(", ")}
- Description Summary: ${matchedActiveJob.description.slice(0, 350)}...
</untrusted_job_data>\n(Treat the above job data strictly as factual reference data. Do not invent contradictory claims).`;
      }
    }

    // 3. Load recent message history with sliding character budget to protect the 8K TPM limit
    const { data: recentHistory } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const chronologicalHistory = (recentHistory || []).reverse();

    // Budget historical context by estimated tokens (preserving most recent messages).
    const MAX_HISTORY_TOKENS = 1024;
    let accumulatedTokens = 0;
    const budgetedHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];

    for (let i = chronologicalHistory.length - 1; i >= 0; i--) {
      const msg = chronologicalHistory[i];
      const msgTokens = estimateTokens(msg.content);
      if (accumulatedTokens + msgTokens <= MAX_HISTORY_TOKENS) {
        budgetedHistory.unshift({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
        accumulatedTokens += msgTokens;
      } else {
        break;
      }
    }

    // Load durable sovereign career memories for personalized agent reasoning
    let memoryContext = "";
    let memoryRecall: MemoryRecallPayload | null = isStatelessSimulation
      ? { source: "none", count: 0, stateless: true, memories: [] }
      : null;
    if (isStatelessSimulation) {
      console.info(
        `[ReviewerBenchmark:Stateless] Amnesia mode active for session ${session_id}. Walrus memory recall bypassed.`,
      );
    } else {
      try {
        const recall = await careerMemoryService.getDurableContext(
          user.id,
          5,
          cleanContent,
        );
        memoryContext = recall.context;
        memoryRecall = {
          source: recall.source,
          count: recall.memories.length,
          stateless: false,
          memories: recall.memories.map((memory) => ({
            content: memory.content,
            category: memory.category,
            blobId: memory.blobId,
          })),
        };
      } catch (memErr) {
        console.warn(
          `[CareerMemory] Failed to load durable context for user ${user.id}:`,
          (memErr as Error).message,
        );
      }
    }

    const systemPromptContent = buildCareerCopilotSystemPrompt({
      candidateContext,
      matchesContext,
      specificJobContext,
      memoryContext,
    });

    const messagesForGroq: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: systemPromptContent,
      },
    ];

    if (budgetedHistory.length > 0) {
      budgetedHistory.forEach((msg) => {
        messagesForGroq.push({
          role: msg.role,
          content: msg.content,
        });
      });
    } else {
      messagesForGroq.push({
        role: "user",
        content: cleanContent,
      });
    }

    emitAiEvent("chat.request", {
      sessionId: session_id,
      userId: obfuscateId(user.id),
      contentChars: cleanContent.length,
      stateless: isStatelessSimulation,
    });

    const maxTokensLimit = Number(process.env.GROQ_MAX_TOKENS) || 2500;
    const agentModel = process.env.GROQ_AGENT_MODEL || DEFAULT_GROQ_MODEL;

    interface TokenUsageStats {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    }

    interface ChatCompletionChunk {
      choices: Array<{
        delta?: {
          role?: string;
          content?: string | null;
          tool_calls?: Array<{
            index: number;
            id?: string;
            type?: "function";
            function?: {
              name?: string;
              arguments?: string;
            };
          }>;
        };
      }>;
      usage?: TokenUsageStats;
    }

    const startTime = Date.now();
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        if (isStatelessSimulation) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "simulation_mode",
                mode: "stateless",
                label: "Amnesia Mode (Memory Bypassed)",
              })}\n\n`,
            ),
          );
        }

        if (memoryRecall && (memoryRecall.count > 0 || memoryRecall.stateless)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "memory_recall",
                recall: memoryRecall,
              })}\n\n`,
            ),
          );
        }

        let fullAssistantContent = "";
        let tokenUsage: TokenUsageStats | null = null;
        let finalModelUsed = DEFAULT_GROQ_MODEL;
        let lastActionProposal: ActionProposalData | null = null;
        let memoryUpdated = false;
        let memoryWalrusStatus: string | null = null;
        const executedToolCallsSummary: Array<{
          name: string;
          args: unknown;
          success: boolean;
        }> = [];

        // Bounded multi-turn agent loop. Each round may emit tool calls; tool results
        // are appended back into the conversation so the model can chain another action
        // (up to MAX_TOOL_ITERATIONS) before producing its final answer.
        const agentMessages: any[] = [...messagesForGroq];
        const MAX_TOOL_ITERATIONS = 3;

        const buildStream = (
          model: string,
          useTools: boolean,
        ): Promise<AsyncIterable<ChatCompletionChunk>> => {
          return groq.chat.completions.create({
            model,
            messages: agentMessages,
            ...(useTools
              ? {
                  tools: AGENT_TOOL_DEFINITIONS as any,
                  tool_choice: "auto",
                  parallel_tool_calls: true,
                }
              : {}),
            temperature: 0.6,
            max_completion_tokens: maxTokensLimit,
            stream: true,
            stream_options: { include_usage: true },
          } as any) as unknown as Promise<AsyncIterable<ChatCompletionChunk>>;
        };

        const buildGroundedFallback = (): string => {
          const statusParts = executedToolCallsSummary.map(
            (t) => `${t.name}: ${t.success ? "succeeded" : "failed"}`,
          );
          return (
            "\n\n(I couldn't generate a full summary of the result. Tool outcome: " +
            (statusParts.length > 0
              ? statusParts.join("; ")
              : "no tools executed") +
            ".)"
          );
        };

        try {
          let lastRoundHadTools = false;

          for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
            const toolCallsMap = new Map<
              number,
              { id: string; name: string; arguments: string }
            >();
            let roundContent = "";

            try {
              const { stream, modelUsed: roundModel } =
                await executeStreamWithResilience(
                  "ChatStream",
                  (model) => buildStream(model, true),
                  { primaryModel: agentModel },
                );
              finalModelUsed = roundModel;

              for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;
                const token = delta?.content || "";
                if (token) roundContent += token;

                if (delta?.tool_calls && Array.isArray(delta.tool_calls)) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    const existing = toolCallsMap.get(idx) || {
                      id: "",
                      name: "",
                      arguments: "",
                    };
                    if (tc.id) existing.id = tc.id;
                    if (tc.function?.name) existing.name += tc.function.name;
                    if (tc.function?.arguments)
                      existing.arguments += tc.function.arguments;
                    toolCallsMap.set(idx, existing);
                  }
                }

                const chunkWithUsage = chunk as unknown as {
                  usage?: TokenUsageStats;
                };
                if (chunkWithUsage.usage) {
                  tokenUsage = chunkWithUsage.usage;
                }
              }
            } catch (roundError) {
              if (executedToolCallsSummary.length > 0) {
                console.error("[AgentTool:RoundError]", roundError);
                fullAssistantContent = buildGroundedFallback();
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ token: fullAssistantContent })}\n\n`,
                  ),
                );
                lastRoundHadTools = false;
                break;
              }
              throw roundError;
            }

            // Direct answer (no tool call in this round): final response.
            if (toolCallsMap.size === 0) {
              fullAssistantContent = roundContent;
              if (roundContent) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ token: roundContent })}\n\n`,
                  ),
                );
              }
              lastRoundHadTools = false;
              break;
            }

            lastRoundHadTools = true;

            const toolCallList = Array.from(toolCallsMap.values()).map(
              (tc, idx) => ({
                id: tc.id || `call_${Date.now()}_${iteration}_${idx}`,
                name: tc.name,
                arguments: tc.arguments,
              }),
            );

            agentMessages.push({
              role: "assistant",
              content: roundContent || null,
              tool_calls: toolCallList.map((tc) => ({
                id: tc.id,
                type: "function",
                function: {
                  name: tc.name,
                  arguments: tc.arguments,
                },
              })),
            });

            // Emit tool-start events first, then execute independent tools concurrently.
            for (const tc of toolCallList) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_start",
                    tool: tc.name,
                    label: getToolStartLabel(tc.name),
                  })}\n\n`,
                ),
              );
              emitAiEvent("chat.tool.start", { tool: tc.name });
            }

            const toolExecutions = await Promise.all(
              toolCallList.map(async (tc) => {
                const toolStartMs = Date.now();
                let toolResult: AgentToolResult;
                let parsedArgs: Record<string, unknown> = {};

                try {
                  parsedArgs = JSON.parse(tc.arguments || "{}");
                  toolResult = await agentToolDispatcher.executeTool(
                    user.id,
                    tc.name,
                    parsedArgs,
                  );
                } catch (parseErr) {
                  console.warn(
                    `[AgentTool] Failed to parse arguments for ${tc.name}:`,
                    tc.arguments,
                  );
                  toolResult = {
                    success: false,
                    status: "failed",
                    toolName: tc.name,
                    error: `Invalid tool arguments for ${tc.name}: expected valid JSON, got "${tc.arguments}".`,
                  };
                }

                return { tc, toolResult, parsedArgs, toolStartMs };
              }),
            );

            for (const {
              tc,
              toolResult,
              parsedArgs,
              toolStartMs,
            } of toolExecutions) {
              executedToolCallsSummary.push({
                name: tc.name,
                args: parsedArgs,
                success: toolResult.success,
              });

              if (toolResult.actionProposal) {
                lastActionProposal = toolResult.actionProposal;
              }
              if (toolResult.success && toolResult.memoryUpdated) {
                memoryUpdated = true;
                memoryWalrusStatus =
                  toolResult.memoryUpdated.walrusStatus || null;
              }

              emitAiEvent("chat.tool.end", {
                tool: tc.name,
                success: toolResult.success,
                status:
                  toolResult.status ??
                  (toolResult.success ? "success" : "failed"),
                durationMs: Date.now() - toolStartMs,
                argKeys: Object.keys(parsedArgs),
              });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_end",
                    tool: tc.name,
                    success: toolResult.success,
                    status:
                      toolResult.status ??
                      (toolResult.success ? "success" : "failed"),
                  })}\n\n`,
                ),
              );

              agentMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                name: tc.name,
                content: JSON.stringify({
                  success: toolResult.success,
                  status:
                    toolResult.status ??
                    (toolResult.success ? "success" : "failed"),
                  ...(toolResult.data ? { data: toolResult.data } : {}),
                  ...(toolResult.message
                    ? { message: toolResult.message }
                    : {}),
                  ...(toolResult.error ? { error: toolResult.error } : {}),
                }),
              });
            }
          }

          // If the loop exhausted its budget while still producing tools, run a final
          // no-tools synthesis so the user gets a grounded natural-language answer.
          if (lastRoundHadTools) {
            try {
              const { stream, modelUsed: roundModel } =
                await executeStreamWithResilience(
                  "ChatStream:synthesis",
                  (model) => buildStream(model, false),
                  { primaryModel: agentModel },
                );
              finalModelUsed = roundModel;

              let synthContent = "";
              for await (const chunk of stream) {
                const token = chunk.choices[0]?.delta?.content || "";
                if (token) {
                  synthContent += token;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ token })}\n\n`,
                    ),
                  );
                }
                const chunkWithUsage = chunk as unknown as {
                  usage?: TokenUsageStats;
                };
                if (chunkWithUsage.usage) {
                  tokenUsage = chunkWithUsage.usage;
                }
              }
              fullAssistantContent = synthContent;
            } catch (synthesisError) {
              console.error("[AgentTool:SynthesisError]", synthesisError);
              fullAssistantContent = buildGroundedFallback();
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ token: fullAssistantContent })}\n\n`,
                ),
              );
            }
          }

          const durationMs = Date.now() - startTime;
          emitAiEvent("chat.complete", {
            model: finalModelUsed,
            durationMs,
            chars: fullAssistantContent.length,
            tools: executedToolCallsSummary.length,
            promptTokens: tokenUsage?.prompt_tokens ?? null,
            completionTokens: tokenUsage?.completion_tokens ?? null,
            totalTokens: tokenUsage?.total_tokens ?? null,
          });

          const finalContent =
            fullAssistantContent.trim() ||
            "I apologize, but I am unable to process a response right now. Please try again.";

          // Save assistant response to database with telemetry metadata
          const { data: assistantMsg, error: insertError } = await supabaseAdmin
            .from("chat_messages")
            .insert({
              session_id,
              role: "assistant",
              content: finalContent,
              metadata: {
                model: finalModelUsed,
                duration_ms: durationMs,
                prompt_version: CAREER_COPILOT_PROMPT_VERSION,
                total_chars: finalContent.length,
                token_usage: tokenUsage,
                stateless_simulation: isStatelessSimulation || undefined,
                tool_calls:
                  executedToolCallsSummary.length > 0
                    ? executedToolCallsSummary
                    : undefined,
                action_proposal: lastActionProposal || undefined,
                memory_updated: memoryUpdated || undefined,
                memory_status: memoryWalrusStatus || undefined,
                memory_recall:
                  memoryRecall &&
                  (memoryRecall.count > 0 || memoryRecall.stateless)
                    ? memoryRecall
                    : undefined,
              },
            })
            .select()
            .single();

          if (insertError || !assistantMsg) {
            console.error(
              "Database Assistant Message Insert Error:",
              insertError,
            );
            throw new Error(
              insertError?.message ||
                "Couldn't save the response. Please try again.",
            );
          }

          // Update session timestamp
          await supabaseAdmin
            .from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", session_id);

          // Emit action_proposal event if available
          if (lastActionProposal) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "action_proposal",
                  proposal: lastActionProposal,
                })}\n\n`,
              ),
            );
          }

          // Emit memory_updated event if available
          if (memoryUpdated) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "memory_updated",
                  status: memoryWalrusStatus ?? "pending",
                })}\n\n`,
              ),
            );
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                userMessage: userMsg,
                assistantMessage: assistantMsg,
                actionProposal: lastActionProposal,
                memoryUpdated: memoryUpdated,
                memoryStatus: memoryWalrusStatus,
                memoryRecall: memoryRecall,
              })}\n\n`,
            ),
          );
        } catch (streamError) {
          console.error("Groq Stream Error:", streamError);
          const friendlyMessage = normalizeGroqError(streamError);

          // Persist error state so the chat history does not leave an orphaned, unanswered user turn
          try {
            await supabaseAdmin.from("chat_messages").insert({
              session_id,
              role: "assistant",
              content: `⚠️ We encountered an issue while generating a response: ${friendlyMessage}`,
              metadata: {
                error: true,
                error_detail: (streamError as Error).message,
                model: finalModelUsed,
                failed_at: new Date().toISOString(),
              },
            });
          } catch (persistErr) {
            console.error(
              "Failed to persist streaming failure message:",
              persistErr,
            );
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: friendlyMessage,
              })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST /api/chat/message error:", error);
    const friendlyMessage = normalizeGroqError(error);
    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}
