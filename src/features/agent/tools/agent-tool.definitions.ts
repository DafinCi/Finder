// Agent tool definitions for Groq and OpenAI function calling

export interface ChatToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const AGENT_TOOL_DEFINITIONS: ChatToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_career_recommendations",
      description:
        "Fetches personalized, deterministically scored career opportunities for the candidate. Supports optional filter overrides such as specific roles, remote/hybrid mode, minimum salary, or technologies to exclude.",
      parameters: {
        type: "object",
        properties: {
          targetRoles: {
            type: "array",
            items: { type: "string" },
            description:
              "Specific roles to target in this search (e.g. ['Frontend Engineer', 'React Developer']).",
          },
          workMode: {
            type: "array",
            items: {
              type: "string",
              enum: ["remote", "hybrid", "onsite"],
            },
            description: "Desired work mode filters (e.g. ['remote']).",
          },
          minSalary: {
            type: "number",
            description: "Minimum acceptable monthly/annual salary.",
          },
          excludeTechnologies: {
            type: "array",
            items: { type: "string" },
            description:
              "Technologies or frameworks to strictly exclude from results (e.g. ['Angular', 'PHP']).",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of top matches to return (default 3, max 5).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_job_details",
      description:
        "Retrieves detailed information (full description, complete requirements, company info, and application link) for a single specific job. Use this ONLY when the user asks deep questions about a specific job posting.",
      parameters: {
        type: "object",
        properties: {
          jobId: {
            type: "string",
            description:
              "The unique UUID of the job opportunity to inspect.",
          },
        },
        required: ["jobId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_job",
      description:
        "Bookmarks/saves a specific job for the candidate. Use this when the candidate explicitly says to save or bookmark a job.",
      parameters: {
        type: "object",
        properties: {
          jobId: {
            type: "string",
            description: "The unique UUID of the job to bookmark.",
          },
          notes: {
            type: "string",
            description:
              "Optional note from candidate about why they saved this job.",
          },
        },
        required: ["jobId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reject_job",
      description:
        "Records negative feedback when a candidate rejects or is not interested in a job. Automatically excludes this job from future recommendations.",
      parameters: {
        type: "object",
        properties: {
          jobId: {
            type: "string",
            description: "The unique UUID of the rejected job.",
          },
          reason: {
            type: "string",
            enum: [
              "too_senior",
              "too_junior",
              "tech_mismatch",
              "location_work_mode",
              "salary",
              "company",
              "role_mismatch",
              "employment_type",
              "not_interested",
              "other",
            ],
            description:
              "Standard category describing why the user is not interested.",
          },
          notes: {
            type: "string",
            description: "Optional notes explaining the rejection.",
          },
        },
        required: ["jobId", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remember_fact",
      description:
        "Persists a long-term, durable career fact about the candidate (e.g. career goals, salary expectations, remote requirements, tech preferences, constraints/exclusions) into sovereign memory and synchronizes it with Walrus Mainnet and MemWal.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "career_goal",
              "role_transition",
              "work_preference",
              "tech_focus",
              "constraint_avoid",
              "user_correction",
            ],
            description: "Category of the durable career memory.",
          },
          content: {
            type: "string",
            description:
              "The durable fact or goal to remember (e.g. 'Transisi dari Frontend ke AI Engineer').",
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence level of this memory.",
          },
        },
        required: ["category", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_preference_update",
      description:
        "Proposes a career preference modification to the user via an interactive Action Proposal Card in chat (e.g. updating work mode to hybrid, changing target role). Never mutates database directly without user confirmation.",
      parameters: {
        type: "object",
        properties: {
          workMode: {
            type: "array",
            items: {
              type: "string",
              enum: ["remote", "hybrid", "onsite"],
            },
            description: "Proposed work mode preference.",
          },
          targetRoles: {
            type: "array",
            items: { type: "string" },
            description: "Proposed target roles.",
          },
          targetLevel: {
            type: "string",
            enum: [
              "internship",
              "entry_level",
              "junior",
              "mid_level",
              "senior",
              "lead",
            ],
            description: "Proposed career level.",
          },
          summary: {
            type: "string",
            description:
              "User-facing summary of the change (e.g. 'Buka kesempatan kerja Hybrid').",
          },
        },
        required: ["summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_candidate_cv",
      description:
        "Reads the full raw text or specific detailed sections of the candidate's stored resume document. Call this ONLY when the candidate requests in-depth textual analysis, review of exact phrasing, or inspection of specific sections requiring raw text. Do NOT call this tool for general questions about resume availability or profile summaries.",
      parameters: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: [
              "full",
              "summary",
              "experience",
              "education",
              "skills",
              "projects",
            ],
            description:
              "Specific section of the resume document to inspect (defaults to 'full').",
          },
        },
      },
    },
  },
];
