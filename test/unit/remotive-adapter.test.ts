import { describe, it, expect } from "vitest";
import {
  remotiveJobToCanonicalJob,
  normalizeRemotiveJobType,
  parseSalaryRange,
} from "@/features/jobs/sources/remotive/remotive.adapter";
import { RemotiveRawJob } from "@/features/jobs/sources/remotive/remotive.schema";

describe("Unit: Remotive Adapter & Normalizers", () => {
  describe("normalizeRemotiveJobType", () => {
    it("should correctly map standard Remotive job types", () => {
      expect(normalizeRemotiveJobType("full_time")).toBe("full-time");
      expect(normalizeRemotiveJobType("part_time")).toBe("part-time");
      expect(normalizeRemotiveJobType("contract")).toBe("contract");
      expect(normalizeRemotiveJobType("contractor")).toBe("contract");
      expect(normalizeRemotiveJobType("freelance")).toBe("freelance");
      expect(normalizeRemotiveJobType("internship")).toBe("internship");
      expect(normalizeRemotiveJobType("intern")).toBe("internship");
    });

    it("should fallback unknown or null values to full-time or other", () => {
      expect(normalizeRemotiveJobType(null)).toBe("full-time");
      expect(normalizeRemotiveJobType(undefined)).toBe("full-time");
      expect(normalizeRemotiveJobType("unknown_custom_type")).toBe("other");
    });
  });

  describe("parseSalaryRange", () => {
    it("should parse standard USD numeric ranges", () => {
      const res = parseSalaryRange("$80,000 - $120,000");
      expect(res.min).toBe(80000);
      expect(res.max).toBe(120000);
      expect(res.currency).toBe("USD");
    });

    it("should parse 'k' shorthand notation", () => {
      const res = parseSalaryRange("80k - 120k");
      expect(res.min).toBe(80000);
      expect(res.max).toBe(120000);
      expect(res.currency).toBe("USD");
    });

    it("should detect EUR and GBP currency symbols", () => {
      const eur = parseSalaryRange("€70,000 - €90,000");
      expect(eur.currency).toBe("EUR");
      expect(eur.min).toBe(70000);

      const gbp = parseSalaryRange("£60,000 - £80,000");
      expect(gbp.currency).toBe("GBP");
      expect(gbp.min).toBe(60000);
    });

    it("should return null for empty or unparseable salary strings", () => {
      expect(parseSalaryRange("")).toEqual({
        min: null,
        max: null,
        currency: null,
      });
      expect(parseSalaryRange(null)).toEqual({
        min: null,
        max: null,
        currency: null,
      });
      expect(parseSalaryRange("Competitive salary + equity")).toEqual({
        min: null,
        max: null,
        currency: null,
      });
    });
  });

  describe("remotiveJobToCanonicalJob", () => {
    const rawJob: RemotiveRawJob = {
      id: 998877,
      url: "https://remotive.com/remote-jobs/engineering/lead-architect-998877",
      title: "Lead Cloud Architect",
      company_name: "Starlight Corp",
      company_logo: "https://remotive.com/logos/998877.png",
      company_logo_url: null,
      category: "Software Development",
      tags: ["kubernetes", "aws", "terraform"],
      job_type: "full_time",
      publication_date: "2026-09-20T14:30:00.000Z",
      candidate_required_location: "Worldwide",
      salary: "$150,000 - $180,000",
      description: `
        <h3>About the Role</h3>
        <p>Lead our cloud transition.</p>
        <script>alert("hack")</script>
        <img src="foo" onerror="stealCookies()">
      `,
    };

    it("should map fields into a valid CanonicalJob domain entity", () => {
      const canonical = remotiveJobToCanonicalJob(rawJob);

      expect(canonical.source).toBe("remotive");
      expect(canonical.sourceJobId).toBe("998877");
      expect(canonical.title).toBe("Lead Cloud Architect");
      expect(canonical.companyName).toBe("Starlight Corp");
      expect(canonical.companyLogo).toBe(
        "https://remotive.com/logos/998877.png",
      );
      expect(canonical.requirements).toEqual([
        "kubernetes",
        "aws",
        "terraform",
      ]);
      expect(canonical.location).toBe("Worldwide");
      expect(canonical.isRemote).toBe(true);
      expect(canonical.jobType).toBe("full-time");
      expect(canonical.salaryMin).toBe(150000);
      expect(canonical.salaryMax).toBe(180000);
      expect(canonical.salaryCurrency).toBe("USD");
      expect(canonical.salaryRange).toBe("$150,000 - $180,000");
      expect(canonical.postedAt).toBe("2026-09-20T14:30:00.000Z");
      expect(canonical.applyUrl).toBe(rawJob.url);
      expect(canonical.sourceUrl).toBe(rawJob.url);
      expect(canonical.isActive).toBe(true);
      expect(typeof canonical.lastSyncedAt).toBe("string");
    });

    it("should sanitize malicious script tags and inline handlers from description", () => {
      const canonical = remotiveJobToCanonicalJob(rawJob);

      expect(canonical.description).not.toContain("<script>");
      expect(canonical.description).not.toContain("alert");
      expect(canonical.description).not.toContain("onerror");
      expect(canonical.description).not.toContain("stealCookies");
      expect(canonical.description).toContain("About the Role");
      expect(canonical.description).toContain("Lead our cloud transition.");
    });

    it("should fallback gracefully when description is empty or stripped", () => {
      const emptyDescJob: RemotiveRawJob = {
        ...rawJob,
        description: "<script>only harmful code</script>",
      };

      const canonical = remotiveJobToCanonicalJob(emptyDescJob);
      expect(canonical.description.length).toBeGreaterThan(0);
      expect(canonical.description).toContain(
        "Lead Cloud Architect at Starlight Corp",
      );
    });

    it("should handle null logos and invalid URL protocols safely", () => {
      const nullLogoJob: RemotiveRawJob = {
        ...rawJob,
        company_logo: null,
        company_logo_url: "javascript:alert(1)",
      };

      const canonical = remotiveJobToCanonicalJob(nullLogoJob);
      expect(canonical.companyLogo).toBeNull();
    });
  });
});
