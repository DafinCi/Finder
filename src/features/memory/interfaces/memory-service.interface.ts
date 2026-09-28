// ==============================================================================
// INTERFACE: Memory Service (Future Walrus / MemWal Integration Boundary)
// Module: @/features/memory/interfaces/memory-service.interface
//
// PHASE 1 INVARIANT:
// This interface defines the contract that Phase 2 will implement.
// In Phase 1, there is ZERO concrete implementation, ZERO memory reads,
// ZERO memory writes, and ZERO preference mutations triggered by memory.
// ==============================================================================

export interface MemoryObservation {
  id: string;
  profileId: string;
  category: "tech_avoidance" | "role_affinity" | "work_preference";
  subject: string;
  confidence: number;
  evidenceEventIds: string[];
  createdAt: string;
}

export interface ProposedPreferenceDelta {
  observationId: string;
  domain: "preferences" | "constraints";
  field: string;
  proposedValue: unknown;
  humanExplanation: string;
}

export interface IMemoryService {
  /**
   * Records a synthesized behavioral observation from aggregated feedback telemetry.
   * PHASE 1: Not implemented.
   */
  recordObservation(
    observation: Omit<MemoryObservation, "id" | "createdAt">,
  ): Promise<MemoryObservation>;

  /**
   * Retrieves durable contextual memories relevant to the current matching or chat context.
   * PHASE 1: Not implemented.
   */
  getRelevantMemories(
    profileId: string,
    contextTag: string,
  ): Promise<MemoryObservation[]>;

  /**
   * Generates explainable preference update proposals for human review.
   * PHASE 1: Not implemented.
   */
  generatePreferenceProposals(
    profileId: string,
  ): Promise<ProposedPreferenceDelta[]>;
}
