import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { data: sessions, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      const adminRes = await supabaseAdmin
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      sessions = adminRes.data;
      error = adminRes.error;
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("GET /api/chat/session error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
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

    const body = await req.json();
    const { title, resume_id, initial_message, attachment } = body;

    // Security P0: Verify resume ownership if resume_id is provided
    let verifiedResumeId: string | null = null;
    if (resume_id) {
      const { data: resumeRecord, error: resumeErr } = await supabaseAdmin
        .from("resumes")
        .select("id, profile_id")
        .eq("id", resume_id)
        .maybeSingle();

      if (resumeErr || !resumeRecord) {
        return NextResponse.json(
          { error: "Dokumen resume tidak ditemukan." },
          { status: 404 },
        );
      }

      if (resumeRecord.profile_id !== user.id) {
        console.warn(
          `[SECURITY AUDIT] User ${user.id} attempted to bind unauthorized resume ${resume_id} (owned by ${resumeRecord.profile_id})`,
        );
        return NextResponse.json(
          {
            error:
              "Forbidden! Anda tidak memiliki izin untuk mengaitkan resume ini.",
          },
          { status: 403 },
        );
      }

      verifiedResumeId = resumeRecord.id;
    }

    const sessionTitle =
      title ||
      (attachment?.name
        ? `Analisis CV: ${attachment.name}`
        : "Obrolan Karir Baru");

    let { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: sessionTitle,
        resume_id: verifiedResumeId,
      })
      .select()
      .single();

    if (sessionError) {
      const adminRes = await supabaseAdmin
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: sessionTitle,
          resume_id: verifiedResumeId,
        })
        .select()
        .single();
      session = adminRes.data;
      sessionError = adminRes.error;
    }

    if (sessionError || !session) {
      throw sessionError || new Error("Failed to create chat session.");
    }

    if (initial_message || attachment) {
      const messagePayload = {
        session_id: session.id,
        role: "user",
        content:
          initial_message ||
          "Please analyze my resume and find matching career opportunities.",
        metadata: attachment ? { attachment } : {},
      };

      const { error: msgErr } = await supabase
        .from("chat_messages")
        .insert(messagePayload);

      if (msgErr) {
        await supabaseAdmin.from("chat_messages").insert(messagePayload);
      }
    }

    return NextResponse.json({ session, success: true });
  } catch (error) {
    console.error("POST /api/chat/session error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
