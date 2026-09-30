import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { action_proposal_status } = body;

    if (
      !action_proposal_status ||
      !["proposed", "applied", "rejected"].includes(action_proposal_status)
    ) {
      return NextResponse.json(
        { error: "Invalid action_proposal_status value." },
        { status: 400 },
      );
    }

    const { data: msg, error: msgError } = await supabaseAdmin
      .from("chat_messages")
      .select("id, metadata, session_id")
      .eq("id", messageId)
      .maybeSingle();

    if (msgError || !msg) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 },
      );
    }

    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, user_id")
      .eq("id", msg.session_id)
      .maybeSingle();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden! You do not have permission to modify this message." },
        { status: 403 },
      );
    }

    const updatedMetadata = {
      ...(msg.metadata || {}),
      action_proposal: {
        ...(msg.metadata?.action_proposal || {}),
        status: action_proposal_status,
      },
    };

    const { error: updateError } = await supabaseAdmin
      .from("chat_messages")
      .update({ metadata: updatedMetadata })
      .eq("id", messageId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, metadata: updatedMetadata });
  } catch (error) {
    console.error("[API:ChatMessage:PATCH] Error updating message metadata:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the proposal status." },
      { status: 500 },
    );
  }
}
