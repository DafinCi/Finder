import { describe, it, expect, vi, beforeEach } from "vitest";
import { runResumeAnalysisWorkflow } from "@/features/ai-analysis/services/analysis-orchestrator.service";
import { extractCandidateProfile } from "@/lib/groq/profile-extractor";
import { analyzeJobMatches } from "@/lib/groq/job-matcher";

vi.mock("@/lib/groq/profile-extractor", () => ({
  extractCandidateProfile: vi.fn(),
}));

vi.mock("@/lib/groq/job-matcher", () => ({
  analyzeJobMatches: vi.fn(),
}));

// Build stateful Supabase mock for orchestrator testing
const mockResumes = new Map<string, any>();
const mockResumeAnalysis = new Map<string, any>();
const mockJobMatches = new Map<string, any[]>();
const mockJobs = [
  {
    id: "job-101",
    title: "Senior React Engineer",
    description: "Build modern web apps",
    requirements: ["react", "typescript", "tailwind"],
    is_active: true,
    company_id: "comp-1",
  },
  {
    id: "job-102",
    title: "Backend Go Developer",
    description: "Microservices",
    requirements: ["golang", "postgresql", "docker"],
    is_active: true,
    company_id: "comp-2",
  },
];

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === "resumes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: any) => ({
              single: vi.fn(async () => {
                const res = mockResumes.get(val);
                return res
                  ? { data: res, error: null }
                  : { data: null, error: { message: "Not found" } };
              }),
              maybeSingle: vi.fn(async () => {
                const res = mockResumes.get(val);
                return { data: res || null, error: null };
              }),
            })),
          })),
          update: vi.fn((updateData: any) => ({
            eq: vi.fn((col: string, val: any) => ({
              neq: vi.fn((neqCol: string, neqVal: any) => ({
                select: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => {
                    const current = mockResumes.get(val);
                    if (!current || current[neqCol] === neqVal) {
                      return { data: null, error: null };
                    }
                    Object.assign(current, updateData);
                    return { data: { id: val, ...current }, error: null };
                  }),
                })),
              })),
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  const current = mockResumes.get(val) || {};
                  Object.assign(current, updateData);
                  return { data: current, error: null };
                }),
              })),
              then: (resolve: any) => {
                const current = mockResumes.get(val) || {};
                Object.assign(current, updateData);
                return resolve({ data: current, error: null });
              },
            })),
          })),
        };
      }

      if (table === "resume_analysis") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: any) => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => {
                    const analysis = mockResumeAnalysis.get(val);
                    return { data: analysis || null, error: null };
                  }),
                })),
              })),
            })),
          })),
          insert: vi.fn((data: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const id = "analysis-id-123";
                const record = { id, ...data };
                mockResumeAnalysis.set(data.resume_id, record);
                return { data: record, error: null };
              }),
            })),
          })),
        };
      }

      if (table === "job_matches") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: any) => ({
              order: vi.fn(async () => {
                const matches = mockJobMatches.get(val) || [];
                return {
                  data: matches.map((m) => ({
                    ...m,
                    jobs: {
                      id: m.job_id,
                      title: "Senior React Engineer",
                      location: "Remote",
                      job_type: "Full-time",
                      salary_range: "Rp 25.000.000",
                      companies: { name: "TechCorp", logo_url: null },
                    },
                  })),
                  error: null,
                };
              }),
            })),
          })),
          insert: vi.fn(async (items: any[]) => {
            if (items.length > 0) {
              const analysisId = items[0].analysis_id;
              mockJobMatches.set(analysisId, items);
            }
            return { error: null };
          }),
        };
      }

      if (table === "jobs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              filter: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: mockJobs, error: null })),
              })),
              limit: vi.fn(async () => ({ data: mockJobs, error: null })),
            })),
          })),
        };
      }

      if (table === "chat_messages" || table === "chat_sessions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { title: "Obrolan Karir Baru" },
                error: null,
              })),
            })),
          })),
          insert: vi.fn(async () => ({ error: null })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      return {};
    }),
  },
}));

describe("Integration (Mock-Based): Analysis Orchestrator Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResumes.clear();
    mockResumeAnalysis.clear();
    mockJobMatches.clear();
  });

  it("should be idempotent: return cached analysis if resume is already completed", async () => {
    mockResumes.set("res-completed-1", {
      id: "res-completed-1",
      status: "completed",
    });
    mockResumeAnalysis.set("res-completed-1", {
      id: "analysis-cached-1",
      candidate_data: {
        candidate: { name: "John Doe", title: "Frontend Specialist" },
      },
      extracted_skills: ["React", "TypeScript"],
    });
    mockJobMatches.set("analysis-cached-1", [
      {
        id: "m-1",
        job_id: "job-101",
        match_score: 90,
        reason: "Great fit",
        missing_skills: [],
      },
    ]);

    const result = await runResumeAnalysisWorkflow({
      userId: "user-1",
      resumeId: "res-completed-1",
      rawText: "Sample resume text",
    });

    expect(result.analysisId).toBe("analysis-cached-1");
    expect(result.analysis.candidate.name).toBe("John Doe");
    // Ensure AI models were NOT called since cache was used
    expect(extractCandidateProfile).not.toHaveBeenCalled();
    expect(analyzeJobMatches).not.toHaveBeenCalled();
  });

  it("should execute full analysis workflow and persist records on happy path", async () => {
    mockResumes.set("res-pending-1", {
      id: "res-pending-1",
      status: "pending",
    });

    vi.mocked(extractCandidateProfile).mockResolvedValueOnce({
      json_profile: {
        candidate: {
          name: "Budi Santoso",
          title: "Frontend Engineer",
          years_of_experience: 4,
          summary: "Experienced frontend dev",
          skills: { core: ["React", "TypeScript"], supporting: ["Tailwind"] },
          experience: [],
          education: [],
        },
        career: {
          recommended_roles: ["Frontend Lead"],
          career_level: "Senior",
          strengths: ["Clean code"],
          weaknesses: [],
        },
      },
      extracted_skills: ["React", "TypeScript", "Tailwind"],
      _modelUsed: "openai/gpt-oss-120b",
    });

    vi.mocked(analyzeJobMatches).mockResolvedValueOnce([
      {
        job_id: "job-101",
        score: 92,
        reason: "Strong React & TypeScript skills match perfectly.",
        missing_skills: [],
      },
    ]);

    const result = await runResumeAnalysisWorkflow({
      userId: "user-1",
      resumeId: "res-pending-1",
      rawText:
        "Budi Santoso - Senior Frontend Developer with 4 years experience in React.",
      sessionId: "session-1",
    });

    expect(result.analysis.candidate.name).toBe("Budi Santoso");
    expect(result.jobMatches).toHaveLength(1);
    expect(result.jobMatches[0].job_id).toBe("job-101");
    expect(result.jobMatches[0].match_score).toBe(92);

    // Verify resume status transitioned to completed
    const updatedResume = mockResumes.get("res-pending-1");
    expect(updatedResume.status).toBe("completed");
  });

  it("should apply graceful degradation if AI job matching throws an error", async () => {
    mockResumes.set("res-degraded-1", {
      id: "res-degraded-1",
      status: "pending",
    });

    vi.mocked(extractCandidateProfile).mockResolvedValueOnce({
      json_profile: {
        candidate: {
          name: "Citra Dewi",
          title: "Fullstack Developer",
          years_of_experience: 2,
          summary: "Passionate developer",
          skills: { core: ["React", "TypeScript"], supporting: [] },
          experience: [],
          education: [],
        },
        career: {
          recommended_roles: ["Frontend"],
          career_level: "Mid",
          strengths: [],
          weaknesses: [],
        },
      },
      extracted_skills: ["React", "TypeScript"],
      _modelUsed: "openai/gpt-oss-120b",
    });

    // Simulate AI job matching failure (e.g. rate limit / timeout / invalid json)
    vi.mocked(analyzeJobMatches).mockRejectedValueOnce(
      new Error("AI Model Service 503 Overloaded"),
    );

    const result = await runResumeAnalysisWorkflow({
      userId: "user-1",
      resumeId: "res-degraded-1",
      rawText: "Citra Dewi Resume details",
    });

    // Workflow must not throw; it must degrade gracefully and compute deterministic score
    expect(result.jobMatches.length).toBeGreaterThan(0);
    expect(result.jobMatches[0].reason).toContain(
      "Kecocokan dihitung berdasarkan keselarasan keahlian",
    );

    const updatedResume = mockResumes.get("res-degraded-1");
    expect(updatedResume.status).toBe("completed");
  });

  it("should rollback resume status to failed when unrecoverable error occurs", async () => {
    mockResumes.set("res-fail-1", {
      id: "res-fail-1",
      status: "pending",
    });

    // Unrecoverable error in candidate profile extraction
    vi.mocked(extractCandidateProfile).mockRejectedValueOnce(
      new Error("Fatal Groq API Key Rejected"),
    );

    await expect(
      runResumeAnalysisWorkflow({
        userId: "user-1",
        resumeId: "res-fail-1",
        rawText: "Sample text",
      }),
    ).rejects.toThrow("Fatal Groq API Key Rejected");

    // Status in DB must be updated to 'failed'
    const updatedResume = mockResumes.get("res-fail-1");
    expect(updatedResume.status).toBe("failed");
  });
});
