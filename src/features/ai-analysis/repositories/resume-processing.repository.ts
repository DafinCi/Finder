import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ResumeProcessing,
  ResumeProcessingDecision,
  ResumeProcessingPatch,
  ResumeProcessingStage,
} from "../types/resume-processing.types";

export type { ResumeProcessingPatch };

export interface ResumeProcessingDbRow {
  resume_id: string;
  profile_id: string;
  stage: string;
  document_type: string | null;
  is_resume: boolean | null;
  classification_confidence: number | string | null;
  classification_reason: string | null;
  heuristic_score: number | string | null;
  decision: string | null;
  overridden_by_user: boolean;
  error_code: string | null;
  error_message: string | null;
  raw_content_deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

function toNullableNumber(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

export function mapDbRowToResumeProcessing(
  row: ResumeProcessingDbRow,
): ResumeProcessing {
  return {
    resumeId: row.resume_id,
    profileId: row.profile_id,
    stage: row.stage as ResumeProcessingStage,
    documentType: row.document_type,
    isResume: row.is_resume,
    classificationConfidence: toNullableNumber(row.classification_confidence),
    classificationReason: row.classification_reason,
    heuristicScore: toNullableNumber(row.heuristic_score),
    decision: (row.decision as ResumeProcessingDecision | null) ?? null,
    overriddenByUser: Boolean(row.overridden_by_user),
    errorCode: row.error_code,
    errorMessage: row.error_message,
    rawContentDeletedAt: row.raw_content_deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbPatch(patch?: ResumeProcessingPatch): Record<string, unknown> {
  if (!patch) return {};
  const db: Record<string, unknown> = {};

  if (patch.documentType !== undefined) db.document_type = patch.documentType;
  if (patch.isResume !== undefined) db.is_resume = patch.isResume;
  if (patch.classificationConfidence !== undefined) {
    db.classification_confidence = patch.classificationConfidence;
  }
  if (patch.classificationReason !== undefined) {
    db.classification_reason = patch.classificationReason;
  }
  if (patch.heuristicScore !== undefined) {
    db.heuristic_score = patch.heuristicScore;
  }
  if (patch.decision !== undefined) db.decision = patch.decision;
  if (patch.overriddenByUser !== undefined) {
    db.overridden_by_user = patch.overriddenByUser;
  }
  if (patch.errorCode !== undefined) db.error_code = patch.errorCode;
  if (patch.errorMessage !== undefined) db.error_message = patch.errorMessage;
  if (patch.rawContentDeletedAt !== undefined) {
    db.raw_content_deleted_at = patch.rawContentDeletedAt;
  }

  return db;
}

export class ResumeProcessingRepository {
  constructor(private readonly client: any = supabaseAdmin) {}

  async getByResumeId(
    resumeId: string,
    profileId: string,
  ): Promise<ResumeProcessing | null> {
    const { data, error } = await this.client
      .from("resume_processing")
      .select("*")
      .eq("resume_id", resumeId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapDbRowToResumeProcessing(data) : null;
  }

  async ensureState(
    resumeId: string,
    profileId: string,
  ): Promise<ResumeProcessing> {
    const existing = await this.getByResumeId(resumeId, profileId);
    if (existing) return existing;
    return this.updateStage(resumeId, profileId, "received");
  }

  async updateStage(
    resumeId: string,
    profileId: string,
    stage: ResumeProcessingStage,
    patch?: ResumeProcessingPatch,
  ): Promise<ResumeProcessing> {
    const { data, error } = await this.client
      .from("resume_processing")
      .upsert(
        {
          resume_id: resumeId,
          profile_id: profileId,
          stage,
          ...toDbPatch(patch),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "resume_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return mapDbRowToResumeProcessing(data);
  }
}

export const resumeProcessingRepository = new ResumeProcessingRepository();
