import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  groq,
  DEFAULT_GROQ_MODEL,
  FALLBACK_GROQ_MODEL,
  normalizeGroqError,
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
} from "@/features/agent/services/agent-tool-dispatcher.service";

export const dynamic = "force-dynamic";

const MAX_PROMPT_CHARS = 2000;

function getToolStartLabel(toolName: string): string {
  switch (toolName) {
    case "get_career_recommendations":
      return "Mencari dan menganalisis lowongan kerja yang cocok...";
    case "inspect_job_details":
      return "Membaca detail lengkap lowongan pekerjaan...";
    case "save_job":
      return "Menyimpan lowongan ke daftar bookmark...";
    case "reject_job":
      return "Mencatat feedback penolakan lowongan...";
    case "remember_fact":
      return "Menyimpan fakta ke memori karir berdaulat...";
    case "propose_preference_update":
      return "Menyiapkan usulan pembaruan preferensi profil...";
    default:
      return "Menjalankan tindakan...";
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
          error: `Terlalu banyak pesan dalam waktu singkat. Mohon tunggu ${rateLimit.resetInSeconds} detik sebelum mengirim lagi.`,
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
    const { session_id, content } = body;

    if (!session_id || !content?.trim()) {
      return NextResponse.json(
        { error: "session_id dan content wajib diisi" },
        { status: 400 },
      );
    }

    const cleanContent = content.trim();

    // Input length guardrail to protect TPM and model window
    if (cleanContent.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        {
          error: `Pesan terlalu panjang. Maksimal ${MAX_PROMPT_CHARS} karakter per pesan.`,
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
        { error: "Sesi percakapan tidak ditemukan" },
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

    // 1. Load candidate profile context in compressed format to preserve Groq TPM budget
    let candidateContext = "";
    let matchesContext = "";

    if (session.resume_id) {
      // Security P0: Verify linked resume actually belongs to current user to prevent cross-tenant data leakage
      const { data: resumeOwnership } = await supabaseAdmin
        .from("resumes")
        .select("id, profile_id")
        .eq("id", session.resume_id)
        .maybeSingle();

      const isResumeOwner =
        resumeOwnership && resumeOwnership.profile_id === user.id;

      if (!isResumeOwner) {
        console.warn(
          `[SECURITY ALERT] Blocked candidate context leakage: Session ${session_id} has resume_id ${session.resume_id} not owned by user ${user.id}`,
        );
      } else {
        const { data: analysis } = await supabaseAdmin
          .from("resume_analysis")
          .select("id, candidate_data, extracted_skills")
          .eq("resume_id", session.resume_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (analysis?.candidate_data) {
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

          const raw = analysis.candidate_data as RawData;
          const c = raw.candidate || raw;
          const career = raw.career || raw;
          const coreSkills = Array.isArray(c?.skills?.core)
            ? c.skills.core.join(", ")
            : (analysis.extracted_skills || []).slice(0, 15).join(", ");
          const strengths = Array.isArray(career?.strengths)
            ? career.strengths.slice(0, 3).join("; ")
            : "";

          candidateContext = `\n\n<untrusted_career_data>\n[RINGKASAN PROFIL KANDIDAT AKTIF]:
- Nama & Title: ${c?.name || "Kandidat"} | ${c?.title || "Professional"}
- Pengalaman: ${c?.years_of_experience ?? 0} tahun
- Keahlian Utama: ${coreSkills || "General"}
- Kekuatan: ${strengths || "Teknis & Adaptif"}
- Level Karir: ${career?.career_level || "Mid-Level"}\n</untrusted_career_data>`;

          // Grounding: Load candidate's top matched jobs for this session
          if (analysis.id) {
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
                    `- ${m.jobs?.title || "Peran"} di ${
                      m.jobs?.companies?.name || "Perusahaan Mitra"
                    } (Kecocokan: ${m.match_score}%, Missing Skills: ${
                      (m.missing_skills || []).slice(0, 3).join(", ") || "None"
                    })`,
                )
                .join("\n");
              matchesContext = `\n\n<untrusted_career_data>\n[REKOMENDASI LOWONGAN COCOK UNTUK KANDIDAT INI]:\n${listStr}\n</untrusted_career_data>`;
            }
          }
        }
      }
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
        specificJobContext = `\n\n<untrusted_job_data>\n[DATA RESMI LOWONGAN PEKERJAAN YANG SEDANG DITANYAKAN]:
- Posisi: ${matchedActiveJob.title}
- Perusahaan: ${matchedActiveJob.companies?.name || "Perusahaan Mitra"}
- Lokasi & Tipe: ${matchedActiveJob.location} (${matchedActiveJob.job_type})
- Gaji / Kompensasi: ${matchedActiveJob.salary_range || "Sesuai Standar Industri"}
- Kualifikasi Persyaratan: ${matchedActiveJob.requirements.join(", ")}
- Ringkasan Deskripsi: ${matchedActiveJob.description.slice(0, 350)}...
</untrusted_job_data>\n(Gunakan data lowongan di atas murni sebagai fakta referensi objektif; jangan mengarang fakta yang bertolak belakang).`;
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

    // Budget historical context to max 4,000 characters (preserving most recent messages)
    const MAX_HISTORY_CHARS = 4000;
    let accumulatedChars = 0;
    const budgetedHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];

    for (let i = chronologicalHistory.length - 1; i >= 0; i--) {
      const msg = chronologicalHistory[i];
      if (accumulatedChars + msg.content.length <= MAX_HISTORY_CHARS) {
        budgetedHistory.unshift({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
        accumulatedChars += msg.content.length;
      } else {
        break;
      }
    }

    // Load durable sovereign career memories for personalized agent reasoning
    let memoryContext = "";
    try {
      memoryContext = await careerMemoryService.getDurableContextSummary(
        user.id,
        5,
      );
    } catch (memErr) {
      console.warn(
        `[CareerMemory] Failed to load durable context for user ${user.id}:`,
        (memErr as Error).message,
      );
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

    const maxTokensLimit = Number(process.env.GROQ_MAX_TOKENS) || 2500;

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

    // Resilient stream initialization with model fallback
    let stream: AsyncIterable<ChatCompletionChunk>;
    let modelUsed = DEFAULT_GROQ_MODEL;
    const startTime = Date.now();

    try {
      stream = (await groq.chat.completions.create({
        model: modelUsed,
        messages: messagesForGroq,
        tools: AGENT_TOOL_DEFINITIONS as any,
        tool_choice: "auto",
        temperature: 0.6,
        max_tokens: maxTokensLimit,
        stream: true,
        stream_options: { include_usage: true },
      } as any)) as unknown as AsyncIterable<ChatCompletionChunk>;
    } catch (primaryError) {
      const errStr = (primaryError as Error).message || "";
      const isRecoverable =
        errStr.includes("429") ||
        errStr.includes("503") ||
        errStr.includes("rate limit") ||
        errStr.includes("overloaded") ||
        errStr.includes("not found") ||
        errStr.includes("model");

      if (isRecoverable && DEFAULT_GROQ_MODEL !== FALLBACK_GROQ_MODEL) {
        console.warn(
          `[AI:ChatStream] Primary model ${DEFAULT_GROQ_MODEL} failed (${errStr}). Falling back to ${FALLBACK_GROQ_MODEL}...`,
        );
        modelUsed = FALLBACK_GROQ_MODEL;
        stream = (await groq.chat.completions.create({
          model: modelUsed,
          messages: messagesForGroq,
          tools: AGENT_TOOL_DEFINITIONS as any,
          tool_choice: "auto",
          temperature: 0.6,
          max_tokens: maxTokensLimit,
          stream: true,
          stream_options: { include_usage: true },
        } as any)) as unknown as AsyncIterable<ChatCompletionChunk>;
      } else {
        throw primaryError;
      }
    }

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        let fullAssistantContent = "";
        let tokenUsage: TokenUsageStats | null = null;
        const toolCallsMap = new Map<
          number,
          { id: string; name: string; arguments: string }
        >();

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            const token = delta?.content || "";
            if (token) {
              fullAssistantContent += token;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token })}\n\n`),
              );
            }

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

          let lastActionProposal: ActionProposalData | null = null;
          let memoryUpdated = false;
          const executedToolCallsSummary: Array<{
            name: string;
            args: unknown;
            success: boolean;
          }> = [];

          // 1-Turn Tool Execution (Strict 1-Turn Cap)
          if (toolCallsMap.size > 0) {
            const toolCallList = Array.from(toolCallsMap.values()).map(
              (tc, idx) => ({
                id: tc.id || `call_${Date.now()}_${idx}`,
                name: tc.name,
                arguments: tc.arguments,
              }),
            );

            const toolResultMessages: Array<{
              role: "tool";
              tool_call_id: string;
              name: string;
              content: string;
            }> = [];

            for (const tc of toolCallList) {
              const startLabel = getToolStartLabel(tc.name);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_start",
                    tool: tc.name,
                    label: startLabel,
                  })}\n\n`,
                ),
              );

              let parsedArgs: Record<string, unknown> = {};
              try {
                parsedArgs = JSON.parse(tc.arguments || "{}");
              } catch (parseErr) {
                console.warn(
                  `[AgentTool] Failed to parse arguments for ${tc.name}:`,
                  tc.arguments,
                );
              }

              const toolResult = await agentToolDispatcher.executeTool(
                user.id,
                tc.name,
                parsedArgs,
              );

              executedToolCallsSummary.push({
                name: tc.name,
                args: parsedArgs,
                success: toolResult.success,
              });

              if (toolResult.actionProposal) {
                lastActionProposal = toolResult.actionProposal;
              }
              if (toolResult.memoryUpdated) {
                memoryUpdated = true;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_end",
                    tool: tc.name,
                    success: toolResult.success,
                  })}\n\n`,
                ),
              );

              toolResultMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                name: tc.name,
                content: JSON.stringify(
                  toolResult.data ?? {
                    success: toolResult.success,
                    error: toolResult.error,
                  },
                ),
              });
            }

            // Turn 2: Synthesize final answer based on tool outputs (capped to 1 cycle)
            const assistantToolCallMsg = {
              role: "assistant" as const,
              content: fullAssistantContent || null,
              tool_calls: toolCallList.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: {
                  name: tc.name,
                  arguments: tc.arguments,
                },
              })),
            };

            const turn2Messages = [
              ...messagesForGroq,
              assistantToolCallMsg,
              ...toolResultMessages,
            ];

            try {
              const turn2Stream = (await groq.chat.completions.create({
                model: modelUsed,
                messages: turn2Messages as any,
                temperature: 0.6,
                max_tokens: maxTokensLimit,
                stream: true,
                stream_options: { include_usage: true },
              } as any)) as unknown as AsyncIterable<ChatCompletionChunk>;

              for await (const chunk of turn2Stream) {
                const token = chunk.choices[0]?.delta?.content || "";
                if (token) {
                  fullAssistantContent += token;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token })}\n\n`),
                  );
                }
                const chunkWithUsage = chunk as unknown as {
                  usage?: TokenUsageStats;
                };
                if (chunkWithUsage.usage) {
                  tokenUsage = chunkWithUsage.usage;
                }
              }
            } catch (turn2Error) {
              console.error("[AgentTool:Turn2Error]", turn2Error);
              const fallbackNotice =
                "\n\n(Tindakan berhasil diproses oleh sistem.)";
              fullAssistantContent += fallbackNotice;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ token: fallbackNotice })}\n\n`,
                ),
              );
            }
          }

          const durationMs = Date.now() - startTime;
          console.log(
            `[AI:Telemetry] op=ChatStream model=${modelUsed} status=success duration=${durationMs}ms chars=${fullAssistantContent.length} tools=${executedToolCallsSummary.length} prompt_tokens=${tokenUsage?.prompt_tokens ?? "N/A"} completion_tokens=${tokenUsage?.completion_tokens ?? "N/A"} total_tokens=${tokenUsage?.total_tokens ?? "N/A"}`,
          );

          const finalContent =
            fullAssistantContent.trim() ||
            "Maaf, saya tidak dapat memproses jawaban saat ini. Silakan coba kembali.";

          // Save assistant response to database with telemetry metadata
          const { data: assistantMsg, error: insertError } = await supabaseAdmin
            .from("chat_messages")
            .insert({
              session_id,
              role: "assistant",
              content: finalContent,
              metadata: {
                model: modelUsed,
                duration_ms: durationMs,
                prompt_version: CAREER_COPILOT_PROMPT_VERSION,
                total_chars: finalContent.length,
                token_usage: tokenUsage,
                tool_calls:
                  executedToolCallsSummary.length > 0
                    ? executedToolCallsSummary
                    : undefined,
                action_proposal: lastActionProposal || undefined,
                memory_updated: memoryUpdated || undefined,
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
              content: `⚠️ Maaf, terjadi kendala saat memproses balasan: ${friendlyMessage}`,
              metadata: {
                error: true,
                error_detail: (streamError as Error).message,
                model: modelUsed,
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
