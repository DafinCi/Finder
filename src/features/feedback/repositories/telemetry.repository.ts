// ==============================================================================
// REPOSITORY: Job Interaction Telemetry (Quarantined Operational Logs)
// Module: @/features/feedback/repositories/telemetry.repository
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  JobInteractionTelemetry,
  InteractionType,
} from "../types/feedback.types";

export function mapDbRowToTelemetry(row: {
  id: string;
  profile_id: string;
  job_id: string;
  interaction_type: InteractionType;
  duration_ms?: number | null;
  created_at: string;
}): JobInteractionTelemetry {
  return {
    id: row.id,
    profileId: row.profile_id,
    jobId: row.job_id,
    interactionType: row.interaction_type,
    durationMs: row.duration_ms ?? null,
    createdAt: row.created_at,
  };
}

export class TelemetryRepository {
  constructor(private readonly client: any = supabaseAdmin) {}

  /**
   * Records a passive interaction event (impression, card_click, drawer_view).
   * QUARANTINED: Never affects canonical profile intent or matching calculations.
   */
  async recordInteraction(
    profileId: string,
    jobId: string,
    interactionType: InteractionType,
    durationMs?: number | null,
  ): Promise<JobInteractionTelemetry> {
    const { data, error } = await this.client
      .from("job_interaction_telemetry")
      .insert({
        profile_id: profileId,
        job_id: jobId,
        interaction_type: interactionType,
        duration_ms: durationMs ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapDbRowToTelemetry(data);
  }

  /**
   * Records a batch of passive interaction events.
   */
  async recordBatch(
    profileId: string,
    items: Array<{
      jobId: string;
      interactionType: InteractionType;
      durationMs?: number | null;
    }>,
  ): Promise<number> {
    if (items.length === 0) return 0;

    const rows = items.map((item) => ({
      profile_id: profileId,
      job_id: item.jobId,
      interaction_type: item.interactionType,
      duration_ms: item.durationMs ?? null,
    }));

    const { data, error } = await this.client
      .from("job_interaction_telemetry")
      .insert(rows)
      .select("id");

    if (error) {
      throw error;
    }

    return (data || []).length;
  }

  /**
   * Retrieves recent interaction telemetry for operational analysis.
   */
  async getRecentInteractions(
    profileId: string,
    limit: number = 50,
  ): Promise<JobInteractionTelemetry[]> {
    const { data, error } = await this.client
      .from("job_interaction_telemetry")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map(mapDbRowToTelemetry);
  }
}

export const telemetryRepository = new TelemetryRepository();
