import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { careerMemoryService } from "@/features/memory/services/career-memory.service";

export const dynamic = "force-dynamic";

const ReinforceMemoriesSchema = z.object({
  memories: z
    .array(
      z.object({
        id: z.string().uuid().optional().nullable(),
        content: z.string().trim().min(3).max(500).optional().nullable(),
      }),
    )
    .min(1)
    .max(20),
});

/**
 * POST /api/memory/reinforce
 * Raises the confidence of memories that produced a response the user marked helpful.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validated = ReinforceMemoriesSchema.parse(body);

    const reinforced = await careerMemoryService.reinforceMemories(
      user.id,
      validated.memories,
    );

    return NextResponse.json({ success: true, reinforced }, { status: 200 });
  } catch (error) {
    console.error("[API:Memory:Reinforce] Error:", error);
    return NextResponse.json(
      { error: "Failed to reinforce memories." },
      { status: 400 },
    );
  }
}
