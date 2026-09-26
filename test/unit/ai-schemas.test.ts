import { describe, it, expect } from "vitest";
import { cleanJsonFences, parseAndValidateJson } from "@/lib/groq/client";
import {
  ExtractedCandidateSchema,
  ExtractedProfileResultSchema,
} from "@/lib/groq/profile-extractor";
import {
  JobMatchResultItemSchema,
  JobMatchResponseSchema,
} from "@/lib/groq/job-matcher";
import { z } from "zod";

describe("Unit: AI Schemas & JSON Parsers", () => {
  describe("cleanJsonFences", () => {
    it("should strip markdown json fences cleanly", () => {
      const input = '```json\n{"test": 123}\n```';
      expect(cleanJsonFences(input)).toBe('{"test": 123}');
    });

    it("should strip generic markdown fences", () => {
      const input = '```\n{"key": "val"}\n```';
      expect(cleanJsonFences(input)).toBe('{"key": "val"}');
    });

    it("should return unfenced text trimmed", () => {
      const input = '   {"already": "clean"}   ';
      expect(cleanJsonFences(input)).toBe('{"already": "clean"}');
    });
  });

  describe("ExtractedProfileResultSchema validation", () => {
    it("should validate and apply defaults for candidate profile", () => {
      const minimal = {
        json_profile: {
          candidate: {
            name: "Budi Santoso",
            title: "Frontend Engineer",
            years_of_experience: 3,
          },
          career: {
            recommended_roles: ["Frontend Dev", "Fullstack Dev"],
          },
        },
      };

      const parsed = ExtractedProfileResultSchema.parse(minimal);
      expect(parsed.json_profile.candidate.name).toBe("Budi Santoso");
      expect(parsed.json_profile.candidate.skills.core).toEqual([]);
      expect(parsed.json_profile.candidate.skills.supporting).toEqual([]);
      expect(parsed.json_profile.career.career_level).toBe("Mid-Level");
    });

    it("should coerce string years_of_experience into number", () => {
      const data = {
        name: "Siti Rahma",
        title: "QA Engineer",
        years_of_experience: "5",
      };
      const parsed = ExtractedCandidateSchema.parse(data);
      expect(parsed.years_of_experience).toBe(5);
    });
  });

  describe("JobMatchResponseSchema validation", () => {
    it("should preprocess raw array into matches object", () => {
      const rawArray = [
        {
          job_id: "job-1",
          score: 85,
          reason: "Good fit",
          missing_skills: ["Docker"],
        },
        { job_id: "job-2", score: 70 },
      ];

      const parsed = JobMatchResponseSchema.parse(rawArray);
      expect(parsed.matches).toHaveLength(2);
      expect(parsed.matches[0].job_id).toBe("job-1");
      expect(parsed.matches[0].score).toBe(85);
      expect(parsed.matches[1].missing_skills).toEqual([]);
    });

    it("should reject job match item missing job_id", () => {
      const invalid = { score: 90, reason: "Missing ID" };
      expect(() => JobMatchResultItemSchema.parse(invalid)).toThrow();
    });

    it("should reject scores outside 0-100 bounds", () => {
      expect(() =>
        JobMatchResultItemSchema.parse({ job_id: "j1", score: 150 }),
      ).toThrow();
      expect(() =>
        JobMatchResultItemSchema.parse({ job_id: "j1", score: -10 }),
      ).toThrow();
    });
  });

  describe("parseAndValidateJson resilience", () => {
    const SimpleSchema = z.object({ value: z.number() });

    it("should parse fenced JSON successfully", () => {
      const text = '```json\n{"value": 42}\n```';
      const result = parseAndValidateJson(text, SimpleSchema);
      expect(result.value).toBe(42);
    });

    it("should throw on malformed non-JSON text", () => {
      expect(() => parseAndValidateJson("NOT_A_JSON", SimpleSchema)).toThrow(
        /Couldn't process AI response/,
      );
    });

    it("should throw on schema mismatch", () => {
      const text = '{"value": "not-a-number"}';
      expect(() => parseAndValidateJson(text, SimpleSchema)).toThrow();
    });
  });
});
