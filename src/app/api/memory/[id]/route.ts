import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { careerMemoryService } from "@/features/memory/services/career-memory.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to manage career memories." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 },
      );
    }

    const updated = await careerMemoryService.forgetMemory(user.id, id);
    return NextResponse.json({ memory: updated }, { status: 200 });
  } catch (error) {
    console.error("[API:Memory:DELETE] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to forget career memory." },
      { status: 500 },
    );
  }
}
