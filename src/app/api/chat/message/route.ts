import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { groq, DEFAULT_GROQ_MODEL } from "@/lib/groq/client";

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

    // Load candidate profile context if available
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
        candidateContext = `\n\n[DATA PROFIL KANDIDAT YANG SEDANG DIANALISIS]:\n${JSON.stringify(
          analysis.candidate_data,
          null,
          2,
        )}`;
      }
    }

    // Load recent message history for context (up to 8 messages)
    const { data: history } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(10);

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

    if (history && history.length > 0) {
      history.forEach((msg) => {
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

    const completion = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: messagesForGroq,
      temperature: 0.6,
      max_tokens: 1500,
    });

    const assistantContent =
      completion.choices[0]?.message?.content ||
      "Maaf, saya tidak dapat memproses jawaban saat ini. Silakan coba kembali.";

    // Save assistant response
    const { data: assistantMsg, error: assistantMsgError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        session_id,
        role: "assistant",
        content: assistantContent,
      })
      .select()
      .single();

    if (assistantMsgError) throw assistantMsgError;

    // Update session timestamp
    await supabaseAdmin
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", session_id);

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (error) {
    console.error("POST /api/chat/message error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
