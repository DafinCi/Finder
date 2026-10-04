import {
  ResumeProcessingRepository,
  ResumeProcessingPatch,
  resumeProcessingRepository,
} from "../repositories/resume-processing.repository";
import {
  ResumeProcessing,
  ResumeProcessingStage,
} from "../types/resume-processing.types";

/**
 * Owns the persisted resume-processing pipeline state. Stage transitions are
 * written as the real backend work happens so the UI can poll truthful progress.
 */
export class ResumeProcessingService {
  constructor(
    private readonly repository: ResumeProcessingRepository = resumeProcessingRepository,
  ) {}

  async getStatus(
    resumeId: string,
    profileId: string,
  ): Promise<ResumeProcessing | null> {
    return this.repository.getByResumeId(resumeId, profileId);
  }

  async ensureState(
    resumeId: string,
    profileId: string,
  ): Promise<ResumeProcessing> {
    return this.repository.ensureState(resumeId, profileId);
  }

  async advance(
    resumeId: string,
    profileId: string,
    stage: ResumeProcessingStage,
    patch?: ResumeProcessingPatch,
  ): Promise<ResumeProcessing> {
    return this.repository.updateStage(resumeId, profileId, stage, patch);
  }

  async markFailed(
    resumeId: string,
    profileId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<ResumeProcessing> {
    return this.repository.updateStage(resumeId, profileId, "failed", {
      errorCode,
      errorMessage,
    });
  }
}

export const resumeProcessingService = new ResumeProcessingService();
