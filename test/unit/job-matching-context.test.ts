import { describe, it, expect, vi } from "vitest";
import {
  toJobMatchingContext,
  toCandidateMatchingContext,
  extractRoleOverview,
  extractKeyQualifications,
} from "@/features/jobs/domain/job-matching-context";

describe("Unit: AI Job Matching Context Boundary", () => {
  describe("extractRoleOverview", () => {
    it("should handle empty or non-string input safely", () => {
      expect(extractRoleOverview("")).toBe("");
      expect(extractRoleOverview(null as any)).toBe("");
    });

    it("should skip metadata headers and take narrative lines", () => {
      const desc = `Location: Remote
Availability: 40 hrs/week
Reporting to: Engineering Lead

We are looking for a Senior React Engineer to scale our core web app. The role involves designing clean APIs.

What we offer:
Health insurance and 401k matching.`;

      const overview = extractRoleOverview(desc);
      expect(overview).toContain("We are looking for a Senior React Engineer");
      expect(overview).not.toContain("Location: Remote");
      expect(overview).not.toContain("Health insurance");
    });

    it("should bound overview text at sentence boundary", () => {
      const longText =
        "First sentence is short. Second sentence explains that we are building the next generation AI tool for enterprise developers. Third sentence mentions our global team across twenty countries. Fourth sentence discusses engineering practices. Fifth sentence is also quite long.";

      const overview = extractRoleOverview(longText, 180);
      expect(overview.length).toBeLessThanOrEqual(180);
      expect(overview.endsWith(".")).toBe(true);
    });

    it("should sanitize raw HTML tags if present in description", () => {
      const htmlDesc =
        "<p>We are hiring a <strong>Fullstack Developer</strong>.<script>alert('xss')</script></p>";
      const overview = extractRoleOverview(htmlDesc);
      expect(overview).toContain("We are hiring a Fullstack Developer.");
      expect(overview).not.toContain("<script>");
      expect(overview).not.toContain("alert");
    });
  });

  describe("extractKeyQualifications", () => {
    it("should extract qualification statements with years of experience or tech proficiencies", () => {
      const desc = `About Us: We are a cool company.
• 5+ years of experience with React and TypeScript is required
• Strong understanding of distributed microservices architecture
• Experience with Vector Databases and Pinecone is mandatory
What we offer:
• Competitive compensation and 401k
• Health insurance and dental`;

      const quals = extractKeyQualifications(desc);
      expect(quals.length).toBeGreaterThanOrEqual(2);
      expect(quals[0]).toContain(
        "5+ years of experience with React and TypeScript",
      );
      expect(quals.some((q) => q.includes("Vector Databases"))).toBe(true);
      expect(quals.some((q) => q.includes("401k"))).toBe(false);
      expect(quals.some((q) => q.includes("Health insurance"))).toBe(false);
    });

    it("should respect maxItems and maxTotalChars", () => {
      const desc = Array.from(
        { length: 15 },
        (_, i) =>
          `• 3+ years experience with Technology-${i} in production environments`,
      ).join("\n");

      const quals = extractKeyQualifications(desc, 3, 250);
      expect(quals.length).toBeLessThanOrEqual(3);
      const totalLen = quals.reduce((sum, q) => sum + q.length, 0);
      expect(totalLen).toBeLessThanOrEqual(250);
    });
  });

  describe("toJobMatchingContext", () => {
    it("should transform full job data into compact representation without leaking URLs or raw HTML", () => {
      const fullJob = {
        id: "job-uuid-123",
        title: "Senior Fullstack Engineer",
        company_name: "Acme Corp",
        company_logo: "https://example.com/logo.png",
        source_url: "https://remotive.com/job/123",
        apply_url: "https://acme.com/apply",
        location: "Worldwide",
        job_type: "full-time",
        experience_level: "Senior",
        salary_range: "$120,000 - $150,000",
        requirements: ["React", "TypeScript", "Node.js", "PostgreSQL"],
        description: `
          <h1>Acme Corp is hiring!</h1>
          <p>We are seeking a seasoned Senior Fullstack Engineer to lead our frontend platform.</p>
          <ul>
            <li>• 5+ years of experience building scalable web applications</li>
            <li>• Proven expertise in TypeScript and GraphQL APIs</li>
          </ul>
          <h3>Benefits:</h3>
          <p>Unlimited PTO, 401(k) matching, health and dental insurance.</p>
        `,
      };

      const compact = toJobMatchingContext(fullJob);

      // Essential fields preserved
      expect(compact.id).toBe("job-uuid-123");
      expect(compact.title).toBe("Senior Fullstack Engineer");
      expect(compact.company).toBe("Acme Corp");
      expect(compact.location).toBe("Worldwide");
      expect(compact.employment_type).toBe("full-time");
      expect(compact.experience_level).toBe("Senior");
      expect(compact.salary).toBe("$120,000 - $150,000");
      expect(compact.requirements).toEqual([
        "React",
        "TypeScript",
        "Node.js",
        "PostgreSQL",
      ]);

      // Compact narrative & qualifications
      expect(compact.role_overview).toContain("Senior Fullstack Engineer");
      expect(compact.key_qualifications.length).toBeGreaterThanOrEqual(1);

      // Excluded metadata & security checks
      expect(compact).not.toHaveProperty("apply_url");
      expect(compact).not.toHaveProperty("source_url");
      expect(compact).not.toHaveProperty("company_logo");
      expect(JSON.stringify(compact)).not.toContain("<script>");
      expect(JSON.stringify(compact)).not.toContain("Unlimited PTO");
      expect(JSON.stringify(compact)).not.toContain("401(k)");

      // Original job object must NOT be mutated
      expect(fullJob.description).toContain("<h1>Acme Corp is hiring!</h1>");
      expect(fullJob.apply_url).toBe("https://acme.com/apply");
    });

    it("should safely handle jobs with missing optional fields", () => {
      const minimalJob = {
        id: "job-min",
        title: "Developer",
        description: "Simple role",
        requirements: [],
      };

      const compact = toJobMatchingContext(minimalJob);
      expect(compact.id).toBe("job-min");
      expect(compact.title).toBe("Developer");
      expect(compact.company).toBe("Company");
      expect(compact.location).toBe("Remote");
      expect(compact.employment_type).toBe("full-time");
      expect(compact.experience_level).toBe("Mid-Level");
      expect(compact.salary).toBeNull();
      expect(compact.requirements).toEqual([]);
    });
  });

  describe("toCandidateMatchingContext", () => {
    it("should strip long achievement essays, education history, and coaching insights", () => {
      const fullCandidate = {
        candidate: {
          name: "Budi Pratama",
          title: "Senior Software Engineer",
          years_of_experience: 7,
          summary:
            "Experienced software engineer specializing in scalable cloud applications and distributed systems.",
          skills: {
            core: ["TypeScript", "React", "Node.js", "Go"],
            supporting: ["Docker", "Kubernetes", "AWS", "CI/CD"],
          },
          experience: [
            {
              company: "Tech Giant Corp",
              role: "Lead Frontend Engineer",
              duration: "2021 - Present",
              achievements: [
                "Redesigned the entire checkout flow generating $5M additional annual revenue.",
                "Mentored a team of 8 junior and mid-level engineers in best practices.",
                "Decreased Core Web Vitals LCP by 45% through aggressive SSR optimizations.",
              ],
            },
            {
              company: "Startup Hub",
              role: "Fullstack Developer",
              duration: "2018 - 2021",
              achievements: [
                "Built greenfield microservices in Go and deployed to EKS.",
              ],
            },
          ],
          education: [
            {
              institution: "Institut Teknologi Bandung",
              degree: "B.Sc. Computer Science",
              year: "2014 - 2018",
            },
          ],
        },
        career: {
          recommended_roles: ["Staff Engineer", "Engineering Manager"],
          career_level: "Senior",
          strengths: ["Architecture", "System Design"],
          weaknesses: ["Public Speaking"],
        },
      };

      const compact = toCandidateMatchingContext(fullCandidate);

      expect(compact.title).toBe("Senior Software Engineer");
      expect(compact.years_of_experience).toBe(7);
      expect(compact.career_level).toBe("Senior");
      expect(compact.skills.core).toEqual([
        "TypeScript",
        "React",
        "Node.js",
        "Go",
      ]);
      expect(compact.skills.supporting).toEqual([
        "Docker",
        "Kubernetes",
        "AWS",
        "CI/CD",
      ]);

      // Roles stripped of achievement essays
      expect(compact.recent_roles).toEqual([
        {
          role: "Lead Frontend Engineer",
          company: "Tech Giant Corp",
          duration: "2021 - Present",
        },
        {
          role: "Fullstack Developer",
          company: "Startup Hub",
          duration: "2018 - 2021",
        },
      ]);

      const serialized = JSON.stringify(compact);
      expect(serialized).not.toContain("Redesigned the entire checkout flow");
      expect(serialized).not.toContain("Institut Teknologi Bandung");
      expect(serialized).not.toContain("Public Speaking");
    });
  });

  describe("analyzeJobMatches payload consistency across primary and fallback", () => {
    it("should deliver the exact same compact payload to both primary and fallback attempts", async () => {
      const { analyzeJobMatches } = await import("@/lib/groq/job-matcher");
      const { groq, DEFAULT_GROQ_MODEL, FALLBACK_GROQ_MODEL } =
        await import("@/lib/groq/client");

      const capturedCalls: Array<{ model: string; messages: any[] }> = [];

      const mockCreate = vi
        .fn()
        .mockImplementationOnce(async (args: any) => {
          capturedCalls.push({ model: args.model, messages: args.messages });
          const err: any = new Error("429 Rate limit exceeded");
          err.status = 429;
          throw err;
        })
        .mockImplementationOnce(async (args: any) => {
          capturedCalls.push({ model: args.model, messages: args.messages });
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    matches: [
                      {
                        job_id: "job-1",
                        score: 90,
                        reason: "Great match",
                        missing_skills: [],
                      },
                    ],
                  }),
                },
              },
            ],
            usage: {
              prompt_tokens: 450,
              completion_tokens: 80,
              total_tokens: 530,
            },
          };
        });

      vi.spyOn(groq.chat.completions, "create").mockImplementation(mockCreate);

      const candidateContext = {
        title: "Engineer",
        years_of_experience: 5,
        career_level: "Senior",
        summary: "Lead engineer",
        skills: { core: ["React"], supporting: ["Node"] },
        recent_roles: [],
      };

      const jobContexts = [
        {
          id: "job-1",
          title: "Senior React Dev",
          company: "TechCorp",
          location: "Remote",
          employment_type: "full-time",
          experience_level: "Senior",
          requirements: ["React", "TypeScript"],
          role_overview: "Build core products.",
          key_qualifications: ["5+ years experience"],
        },
      ];

      const matches = await analyzeJobMatches(candidateContext, jobContexts);

      expect(matches).toHaveLength(1);
      expect(capturedCalls).toHaveLength(2);

      // Primary call
      expect(capturedCalls[0].model).toBe(DEFAULT_GROQ_MODEL);
      // Fallback call
      expect(capturedCalls[1].model).toBe(FALLBACK_GROQ_MODEL);

      // User prompt message content must be identical between primary and fallback
      const primaryUserPrompt = capturedCalls[0].messages.find(
        (m) => m.role === "user",
      )?.content;
      const fallbackUserPrompt = capturedCalls[1].messages.find(
        (m) => m.role === "user",
      )?.content;

      expect(primaryUserPrompt).toBeDefined();
      expect(fallbackUserPrompt).toBeDefined();
      expect(primaryUserPrompt).toBe(fallbackUserPrompt);

      // Verify compact structure in user prompt
      expect(primaryUserPrompt).toContain("<untrusted_job_data>");
      expect(primaryUserPrompt).toContain('"job-1"');
      expect(primaryUserPrompt).toContain('"Senior React Dev"');
      expect(primaryUserPrompt).toContain("Build core products.");
    });
  });
});
