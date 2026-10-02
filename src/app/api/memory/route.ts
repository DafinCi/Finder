import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { careerMemoryService } from "@/features/memory/services/career-memory.service";
import { CreateMemorySchema } from "@/features/memory/types/memory.types";
import { WALRUS_CONFIG } from "@/lib/walrus/walrus-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view career memories." },
        { status: 401 },
      );
    }

    const memories = await careerMemoryService.getAllMemories(user.id);
    return NextResponse.json(
      {
        memories,
        walrus: {
          network: WALRUS_CONFIG.network,
          explorerUrl: WALRUS_CONFIG.explorerUrl,
          agentId:
            process.env.MEMWAL_ACCOUNT_ID ||
            "0x14feb3ca03e713d91a3a3a0810d650fb25e19189fe50871ced0b1d56b1a87cdc",
          namespace: `finder:user:${user.id}`,
          relayerUrl: WALRUS_CONFIG.relayerUrl,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API:Memory:GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sovereign career memories." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to save career memories." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validated = CreateMemorySchema.parse(body);

    const memory = await careerMemoryService.rememberFact(user.id, validated);
    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error("[API:Memory:POST] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create career memory." },
      { status: 400 },
    );
  }
}
