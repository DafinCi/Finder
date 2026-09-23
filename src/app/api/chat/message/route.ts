import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { groq, DEFAULT_GROQ_MODEL } from "@/lib/groq/client";

export const dynamic = "force-dynamic";

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

    const body = await req.json();
    const { session_id, content } = body;

    if (!session_id || !content?.trim()) {
      return NextResponse.json(
        { error: "session_id dan content wajib diisi" },
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
        content: content.trim(),
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Load candidate profile context in compressed format to preserve Groq TPM budget
    let candidateContext = "";
    if (session.resume_id) {
      const { data: analysis } = await supabaseAdmin
        .from("resume_analysis")
        .select("candidate_data, extracted_skills")
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

        candidateContext = `\n\n[RINGKASAN PROFIL KANDIDAT AKTIF]:
- Nama & Title: ${c?.name || "Kandidat"} | ${c?.title || "Professional"}
- Pengalaman: ${c?.years_of_experience ?? 0} tahun
- Keahlian Utama: ${coreSkills || "General"}
- Kekuatan: ${strengths || "Teknis & Adaptif"}
- Level Karir: ${career?.career_level || "Mid-Level"}`;
      }
    }

    // Load recent message history for context (up to 10 most recent messages, ordered chronologically)
    const { data: recentHistory } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const chronologicalHistory = (recentHistory || []).reverse();

    const messagesForGroq: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: `Kamu adalah Personal AI Career Copilot & Senior Tech Recruiter.
Tugasmu adalah membantu kandidat dalam perencanaan karir, peningkatan skill, pembuatan cover letter/pitch, strategi interview, serta mencocokkan karirnya dengan pasar kerja terkini (terutama ekosistem modern seperti Fullstack, AI, dan Web3).
Jawablah dengan gaya bahasa yang profesional, suportif, ramah, to-the-point, dan berbobot dalam Bahasa Indonesia.
Gunakan format Markdown bersih (bullet points dengan '-' atau '*', teks tebal untuk penekanan, dan tabel ringkas jika diperlukan). JANGAN mencampur tag HTML mentah seperti <ul>, <li>, atau <br> di dalam teks maupun tabel; gunakan sintaks Markdown murni.${candidateContext}`,
      },
    ];

    if (chronologicalHistory && chronologicalHistory.length > 0) {
      chronologicalHistory.forEach((msg) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messagesForGroq.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    } else {
      messagesForGroq.push({
        role: "user",
        content: content.trim(),
      });
    }

    const maxTokensLimit = Number(process.env.GROQ_MAX_TOKENS) || 2500;

    const stream = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: messagesForGroq,
      temperature: 0.6,
      max_tokens: maxTokensLimit,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        let fullAssistantContent = "";

        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
              fullAssistantContent += token;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token })}\n\n`),
              );
            }
          }

          const finalContent =
            fullAssistantContent.trim() ||
            "Maaf, saya tidak dapat memproses jawaban saat ini. Silakan coba kembali.";

          // Save assistant response to database
          const { data: assistantMsg } = await supabaseAdmin
            .from("chat_messages")
            .insert({
              session_id,
              role: "assistant",
              content: finalContent,
            })
            .select()
            .single();

          // Update session timestamp
          await supabaseAdmin
            .from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", session_id);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                userMessage: userMsg,
                assistantMessage: assistantMsg || {
                  id: `asst-${Date.now()}`,
                  session_id,
                  role: "assistant",
                  content: finalContent,
                  created_at: new Date().toISOString(),
                },
              })}\n\n`,
            ),
          );
        } catch (streamError) {
          console.error("Groq Stream Error:", streamError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: (streamError as Error).message,
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
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
