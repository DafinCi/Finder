import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_GROQ_MODEL,
  FALLBACK_GROQ_MODEL,
} from "@/lib/groq/client";
import { WALRUS_CONFIG } from "@/lib/walrus/walrus-config";

export const dynamic = "force-dynamic";

/**
 * GET /api/agent/status
 * Reports which models and memory network the agent actually uses.
 * Model names are not secrets; API keys are never returned.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const agentModel = process.env.GROQ_AGENT_MODEL || DEFAULT_GROQ_MODEL;

    return NextResponse.json(
      {
        provider: "Groq",
        primaryModel: DEFAULT_GROQ_MODEL,
        agentModel,
        fallbackModel: FALLBACK_GROQ_MODEL,
        memoryNetwork: WALRUS_CONFIG.network,
        memwalConfigured: Boolean(
          process.env.MEMWAL_ACCOUNT_ID &&
            process.env.MEMWAL_DELEGATE_PRIVATE_KEY,
        ),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API:AgentStatus:GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to load agent status." },
      { status: 500 },
    );
  }
}
