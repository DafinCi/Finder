import { CandidateAnalysis } from "./candidate";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  resume_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchedJobItem {
  id: string;
  job_id: string;
  title: string;
  company: string;
  logo_url?: string | null;
  location: string;
  job_type?: string;
  salary_range?: string | null;
  match_score: number;
  reason?: string | null;
  missing_skills?: string[];
}

export interface ActionProposalData {
  type: "preference_update";
  proposedChanges: {
    workMode?: ("remote" | "hybrid" | "onsite")[];
    targetRoles?: string[];
    targetLevel?: string;
  };
  summary: string;
  status?: "proposed" | "applied" | "rejected";
}

export interface MemoryRecallItem {
  id?: string | null;
  content: string;
  category?: string | null;
  blobId?: string | null;
}

export interface MemoryRecallMetadata {
  source: "walrus" | "cache" | "none";
  count: number;
  stateless?: boolean;
  memories: MemoryRecallItem[];
}

export interface ChatCommandResult {
  name: string;
  category?: string;
  categorySource?: "explicit" | "inferred";
  content?: string;
  memoryId?: string;
  walrusStatus?: string | null;
  supersededId?: string | null;
  error?: string;
  message?: string;
}

export interface ChatMessageMetadata {
  attachment?: {
    name: string;
    size?: number;
    type?: string;
    resume_id?: string;
    url?: string;
  };
  analysis?: CandidateAnalysis | null;
  job_matches?: MatchedJobItem[];
  is_analysis_loading?: boolean;
  tool_calls?: Array<{ name: string; args: unknown; success: boolean }>;
  action_proposal?: ActionProposalData | null;
  chat_command?: ChatCommandResult | null;
  memory_updated?: boolean;
  memory_status?: "pending" | "stored" | "failed" | null;
  memory_recall?: MemoryRecallMetadata | null;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: ChatMessageMetadata;
  created_at: string;
}

export interface CreateSessionPayload {
  title?: string;
  resume_id?: string;
  initial_message?: string;
}

export interface SendMessagePayload {
  session_id: string;
  content: string;
  resume_id?: string;
  simulate_stateless?: boolean;
}

