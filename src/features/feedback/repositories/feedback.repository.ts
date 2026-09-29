// ==============================================================================
// REPOSITORY: Feedback & Materialized Bookmarks
// Module: @/features/feedback/repositories/feedback.repository
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  SavedJob,
  JobFeedbackEvent,
  FeedbackEventType,
  FeedbackReason,
} from "../types/feedback.types";

export function mapDbRowToSavedJob(row: {
  id: string;
  profile_id: string;
  job_id: string;
  notes?: string | null;
  created_at: string;
}): SavedJob {
  return {
    id: row.id,
    profileId: row.profile_id,
    jobId: row.job_id,
    notes: row.notes || null,
    createdAt: row.created_at,
  };
}

export function mapDbRowToFeedbackEvent(row: {
  id: string;
  profile_id: string;
  job_id: string;
  event_type: FeedbackEventType;
  reason?: FeedbackReason | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}): JobFeedbackEvent {
  return {
    id: row.id,
    profileId: row.profile_id,
    jobId: row.job_id,
    eventType: row.event_type,
    reason: row.reason || null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

export class FeedbackRepository {
  constructor(private readonly client: any = supabaseAdmin) {}

  /**
   * Saves/bookmarks a job for a user (materialized bookmark).
   * Automatically appends a 'save' event to the audit feedback events log.
   */
  async saveJob(
    profileId: string,
    jobId: string,
    notes?: string | null,
  ): Promise<SavedJob> {
    const { data, error } = await this.client
      .from("saved_jobs")
      .upsert(
        {
          profile_id: profileId,
          job_id: jobId,
          notes: notes || null,
        },
        { onConflict: "profile_id,job_id" },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Append to audit event log
    await this.recordFeedback(profileId, jobId, "save", null, notes ? { notes } : {});

    return mapDbRowToSavedJob(data);
  }

  /**
   * Un-saves/removes a job bookmark for a user.
   * Appends an 'unsave' event to the audit feedback events log.
   */
  async unsaveJob(profileId: string, jobId: string): Promise<void> {
    const { error } = await this.client
      .from("saved_jobs")
      .delete()
      .eq("profile_id", profileId)
      .eq("job_id", jobId);

    if (error) {
      throw error;
    }

    // Append to audit event log
    await this.recordFeedback(profileId, jobId, "unsave");
  }

  /**
   * Checks whether a specific job is currently saved by the user.
   */
  async isJobSaved(profileId: string, jobId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("saved_jobs")
      .select("id")
      .eq("profile_id", profileId)
      .eq("job_id", jobId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  }

  /**
   * Retrieves all saved jobs for a user ordered by bookmark date descending.
   */
  async getSavedJobs(
    profileId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<SavedJob[]> {
    let query = this.client
      .from("saved_jobs")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (options?.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data || []).map(mapDbRowToSavedJob);
  }

  /**
   * Returns a Set of all saved job IDs for O(1) membership checks.
   */
  async getSavedJobIds(profileId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from("saved_jobs")
      .select("job_id")
      .eq("profile_id", profileId);

    if (error) {
      throw error;
    }

    return new Set((data || []).map((row: { job_id: string }) => row.job_id));
  }

  /**
   * Records a user feedback event (save, reject, apply_click, interview, etc.).
   */
  async recordFeedback(
    profileId: string,
    jobId: string,
    eventType: FeedbackEventType,
    reason?: FeedbackReason | null,
    metadata?: Record<string, unknown>,
  ): Promise<JobFeedbackEvent> {
    const { data, error } = await this.client
      .from("job_feedback_events")
      .insert({
        profile_id: profileId,
        job_id: jobId,
        event_type: eventType,
        reason: reason || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapDbRowToFeedbackEvent(data);
  }

  /**
   * Fetches historical feedback events for candidate analysis.
   */
  async getFeedbackHistory(
    profileId: string,
    options?: { eventTypes?: FeedbackEventType[]; limit?: number },
  ): Promise<JobFeedbackEvent[]> {
    let query = this.client
      .from("job_feedback_events")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (options?.eventTypes && options.eventTypes.length > 0) {
      query = query.in("event_type", options.eventTypes);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data || []).map(mapDbRowToFeedbackEvent);
  }

  /**
   * Retrieves Set of job IDs explicitly rejected by the candidate.
   * INVARIANT: Used by Stage 1 matching to strictly exclude rejected jobs from recommendation pools.
   */
  async getExcludedJobIds(profileId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from("job_feedback_events")
      .select("job_id")
      .eq("profile_id", profileId)
      .eq("event_type", "reject");

    if (error) {
      throw error;
    }

    return new Set((data || []).map((row: { job_id: string }) => row.job_id));
  }
}

export const feedbackRepository = new FeedbackRepository();
