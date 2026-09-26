import { describe, it, expect } from "vitest";
import {
  CanonicalJobSchema,
  JobSourceSchema,
  validateCanonicalJob,
} from "@/features/jobs/schemas/canonical-job.schema";
import {
  isExternalJob,
  getProviderIdentityKey,
  CanonicalJob,
} from "@/features/jobs/domain/canonical-job";
import { sanitizeJobDescription } from "@/features/jobs/utils/sanitize-description";

describe("Unit: Canonical Job Domain Model & Validation", () => {
  describe("JobSource & External Identity", () => {
    it("should accept all authorized job sources", () => {
      const allowedSources = [
        "manual",
        "remotive",
        "remoteok",
        "jobicy",
        "arbeitnow",
      ];
      for (const source of allowedSources) {
        expect(JobSourceSchema.parse(source)).toBe(source);
      }
    });

    it("should reject unauthorized external sources", () => {
      expect(() => JobSourceSchema.parse("linkedin_scrape")).toThrow();
      expect(() => JobSourceSchema.parse("unverified_feed")).toThrow();
    });

    it("should identify external jobs versus internal/manual jobs", () => {
      expect(isExternalJob({ source: "remotive" })).toBe(true);
      expect(isExternalJob({ source: "remoteok" })).toBe(true);
      expect(isExternalJob({ source: "jobicy" })).toBe(true);
      expect(isExternalJob({ source: "arbeitnow" })).toBe(true);
      expect(isExternalJob({ source: "manual" })).toBe(false);
    });

    it("should derive deterministic provider identity keys", () => {
      expect(
        getProviderIdentityKey({ source: "remotive", sourceJobId: "12345" }),
      ).toBe("remotive:12345");

      expect(
        getProviderIdentityKey({ source: "remoteok", sourceJobId: "rok-999" }),
      ).toBe("remoteok:rok-999");

      // Internal jobs have no external provider identity
      expect(
        getProviderIdentityKey({ source: "manual", sourceJobId: null }),
      ).toBeNull();
      expect(
        getProviderIdentityKey({ source: "remotive", sourceJobId: null }),
      ).toBeNull();
    });
  });

  describe("CanonicalJobSchema Validation", () => {
    it("should validate a complete canonical job", () => {
      const validJob: CanonicalJob = {
        source: "remotive",
        sourceJobId: "rem-101",
        title: "Senior Fullstack Engineer",
        companyName: "Acme Cloud",
        companyLogo: "https://acme.com/logo.png",
        description: "We are seeking a senior engineer to scale our platform.",
        requirements: ["TypeScript", "Next.js", "PostgreSQL"],
        location: "Remote (Worldwide)",
        isRemote: true,
        jobType: "full-time",
        experienceLevel: "Senior",
        salaryMin: 120000,
        salaryMax: 150000,
        salaryCurrency: "USD",
        salaryRange: "$120k - $150k",
        postedAt: "2026-09-24T12:00:00Z",
        applyUrl: "https://acme.com/apply/101",
        sourceUrl: "https://remotive.com/jobs/101",
        isActive: true,
      };

      const parsed = validateCanonicalJob(validJob);
      expect(parsed.title).toBe("Senior Fullstack Engineer");
      expect(parsed.source).toBe("remotive");
      expect(parsed.salaryMin).toBe(120000);
      expect(parsed.applyUrl).toBe("https://acme.com/apply/101");
    });

    it("should successfully validate minimal jobs with null/missing optional provider fields", () => {
      // Simulates real-world sparse external provider records (no salary, no skills list, no logo)
      const sparseJob = {
        title: "Frontend Developer",
        companyName: "Startup Co",
        description: "Great team looking for a frontend developer.",
      };

      const parsed = validateCanonicalJob(sparseJob);
      expect(parsed.title).toBe("Frontend Developer");
      expect(parsed.companyName).toBe("Startup Co");
      expect(parsed.source).toBe("manual"); // defaults to manual
      expect(parsed.isRemote).toBe(true);
      expect(parsed.requirements).toEqual([]);
      expect(parsed.salaryMin).toBeUndefined();
      expect(parsed.salaryRange).toBeUndefined();
      expect(parsed.applyUrl).toBeUndefined();
    });

    it("should throw validation error when required fields are missing", () => {
      expect(() =>
        validateCanonicalJob({
          title: "",
          companyName: "Acme",
          description: "Description",
        }),
      ).toThrow(/Job title is required/);

      expect(() =>
        validateCanonicalJob({
          title: "Developer",
          companyName: "",
          description: "Description",
        }),
      ).toThrow(/Company name is required/);

      expect(() =>
        validateCanonicalJob({
          title: "Developer",
          companyName: "Acme",
          description: "",
        }),
      ).toThrow(/Job description is required/);
    });

    it("should enforce valid URL formats for sourceUrl and applyUrl", () => {
      expect(() =>
        validateCanonicalJob({
          title: "Engineer",
          companyName: "Acme",
          description: "Valid description",
          applyUrl: "not_a_valid_url",
        }),
      ).toThrow(/URL format is invalid/);

      // Empty string should coerce to null safely
      const parsed = validateCanonicalJob({
        title: "Engineer",
        companyName: "Acme",
        description: "Valid description",
        applyUrl: "",
        sourceUrl: "",
      });
      expect(parsed.applyUrl).toBeNull();
      expect(parsed.sourceUrl).toBeNull();
    });
  });

  describe("Untrusted HTML Job Description Sanitization", () => {
    it("should strip executable script tags and inner content", () => {
      const maliciousHtml =
        "<p>Job overview</p><script>alert('pwned');</script><p>Responsibilities</p>";
      const clean = sanitizeJobDescription(maliciousHtml);

      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("alert('pwned')");
      expect(clean).toContain("Job overview");
      expect(clean).toContain("Responsibilities");
    });

    it("should strip iframes, objects, styles, and embedded containers", () => {
      const complexHtml = `
        <style>body { display: none; }</style>
        <h3>About the role</h3>
        <iframe src="https://evil.com/phishing"></iframe>
        <p>Requirements:</p>
        <object data="exploit.swf"></object>
      `;
      const clean = sanitizeJobDescription(complexHtml);

      expect(clean).not.toContain("<style>");
      expect(clean).not.toContain("iframe");
      expect(clean).not.toContain("evil.com");
      expect(clean).not.toContain("object");
      expect(clean).toContain("About the role");
      expect(clean).toContain("Requirements:");
    });

    it("should strip inline event handlers and javascript: URLs", () => {
      const inlineAttack = `
        <a href="javascript:stealCookies()" onclick="malicious()" onmouseover="track()">Click to Apply</a>
      `;
      const clean = sanitizeJobDescription(inlineAttack);

      expect(clean).not.toContain("javascript:");
      expect(clean).not.toContain("onclick");
      expect(clean).not.toContain("onmouseover");
      expect(clean).toContain("Click to Apply");
    });

    it("should format list items and paragraphs into legible text with bullet points", () => {
      const formattedHtml = `
        <p>Qualifications:</p>
        <ul>
          <li>3+ years TypeScript experience</li>
          <li>Familiarity with Next.js App Router</li>
        </ul>
      `;
      const clean = sanitizeJobDescription(formattedHtml);

      expect(clean).toContain("Qualifications:");
      expect(clean).toContain("• 3+ years TypeScript experience");
      expect(clean).toContain("• Familiarity with Next.js App Router");
      expect(clean).not.toContain("<ul>");
      expect(clean).not.toContain("<li>");
    });

    it("should decode common HTML entities", () => {
      const htmlEntities =
        "Stripe &amp; Co &mdash; Engineers &lt;React &gt; &quot;Senior&quot;";
      const clean = sanitizeJobDescription(htmlEntities);

      expect(clean).toBe('Stripe & Co — Engineers <React > "Senior"');
    });

    it("should safely handle empty, null, or undefined input", () => {
      expect(sanitizeJobDescription("")).toBe("");
      expect(sanitizeJobDescription(null as unknown as string)).toBe("");
      expect(sanitizeJobDescription(undefined as unknown as string)).toBe("");
    });
  });
});
