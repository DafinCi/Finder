import { describe, it, expect } from "vitest";
import { evaluateLocationCompatibility } from "@/features/matching/utils/location-matcher";
import {
  parseSalaryRange,
  convertSalary,
  detectSalaryPeriod,
  resolveSalaryPeriod,
  normalizeSalaryToAnnual,
} from "@/features/matching/utils/salary-parser";

describe("Unit: Global Remote Location & Multi-Currency Matching", () => {
  describe("evaluateLocationCompatibility", () => {
    it("should treat unrestricted remote keywords as worldwide compatible", () => {
      const candidates = [
        ["Indonesia"],
        ["Jakarta"],
        ["Berlin, Germany"],
        ["Singapore"],
      ];

      for (const locs of candidates) {
        expect(evaluateLocationCompatibility("Worldwide", true, locs)).toEqual({
          isCompatible: true,
          score: 100,
          isWorldwide: true,
          restrictionDetected: null,
        });

        expect(evaluateLocationCompatibility("Anywhere", true, locs)).toEqual({
          isCompatible: true,
          score: 100,
          isWorldwide: true,
          restrictionDetected: null,
        });

        expect(evaluateLocationCompatibility("Remote", true, locs)).toEqual({
          isCompatible: true,
          score: 100,
          isWorldwide: true,
          restrictionDetected: null,
        });
      }
    });

    it("should reject remote jobs with geographic restrictions if candidate is in a different region", () => {
      // Indonesian candidate trying to apply to USA Only remote job
      const idCandidate = ["Jakarta", "Indonesia"];
      const res = evaluateLocationCompatibility("USA Only", true, idCandidate);

      expect(res.isCompatible).toBe(false);
      expect(res.score).toBe(25);
      expect(res.isWorldwide).toBe(false);
      expect(res.restrictionDetected).toBe("usa only");
    });

    it("should accept remote jobs with geographic restrictions if candidate location matches", () => {
      // US candidate applying to USA Only remote job
      const usCandidate = ["San Francisco", "United States"];
      const res = evaluateLocationCompatibility("USA Only", true, usCandidate);

      expect(res.isCompatible).toBe(true);
      expect(res.score).toBe(100);
      expect(res.isWorldwide).toBe(false);
    });

    it("should accept APAC / Asia Only remote jobs for Southeast Asian candidates", () => {
      const seaCandidate = ["Jakarta", "Indonesia"];
      const res = evaluateLocationCompatibility("APAC Only", true, seaCandidate);

      expect(res.isCompatible).toBe(true);
      expect(res.score).toBe(100);
    });

    it("should match physical locations for onsite and hybrid jobs", () => {
      const localCandidate = ["Jakarta, Indonesia"];
      const matchRes = evaluateLocationCompatibility(
        "Jakarta",
        false,
        localCandidate,
      );
      expect(matchRes.isCompatible).toBe(true);
      expect(matchRes.score).toBe(100);

      const foreignRes = evaluateLocationCompatibility(
        "London, UK",
        false,
        localCandidate,
      );
      expect(foreignRes.isCompatible).toBe(false);
      expect(foreignRes.score).toBe(20);
    });

    it("should award neutral score if candidate declared no preferred location", () => {
      const res = evaluateLocationCompatibility("USA Only", true, []);
      expect(res.isCompatible).toBe(true);
      expect(res.score).toBe(100);
    });
  });

  describe("convertSalary (multi-currency exchange conversion)", () => {
    it("should return identical amount when currencies match", () => {
      expect(convertSalary(100000, "USD", "USD")).toBe(100000);
      expect(convertSalary(15000000, "IDR", "IDR")).toBe(15000000);
    });

    it("should accurately convert USD to IDR and vice versa using baseline reference rates", () => {
      // 1 USD = 16,000 IDR
      expect(convertSalary(1000, "USD", "IDR")).toBe(16000000);
      expect(convertSalary(16000000, "IDR", "USD")).toBe(1000);
    });

    it("should convert EUR to USD and IDR", () => {
      // 1 EUR = ~1.087 USD
      const inUsd = convertSalary(1000, "EUR", "USD");
      expect(inUsd).toBe(1087);

      const inIdr = convertSalary(1000, "EUR", "IDR");
      expect(inIdr).toBe(17391304);
    });
  });

  describe("parseSalaryRange (enhanced international notation)", () => {
    it("should parse Indonesian Rupiah with million suffix ('jt' or 'juta')", () => {
      const res = parseSalaryRange("Rp 15jt - 25jt");
      expect(res.currency).toBe("IDR");
      expect(res.min).toBe(15000000);
      expect(res.max).toBe(25000000);
    });

    it("should parse dot-separated thousands in IDR amounts", () => {
      const res = parseSalaryRange("15.000.000 - 20.000.000 IDR");
      expect(res.currency).toBe("IDR");
      expect(res.min).toBe(15000000);
      expect(res.max).toBe(20000000);
    });

    it("should parse millions suffix in English ('m' or 'mil')", () => {
      const res = parseSalaryRange("$1.2m - $1.5m");
      expect(res.currency).toBe("USD");
      expect(res.min).toBe(1200000);
      expect(res.max).toBe(1500000);
    });
  });

  describe("salary period detection and normalization", () => {
    it("should detect explicit periods from text", () => {
      expect(detectSalaryPeriod("$10,000 per month")).toBe("month");
      expect(detectSalaryPeriod("$120,000 per year")).toBe("year");
      expect(detectSalaryPeriod("$60 / hour")).toBe("hour");
    });

    it("should default by currency convention when no period is stated", () => {
      expect(resolveSalaryPeriod(null, "USD")).toBe("year");
      expect(resolveSalaryPeriod(null, "IDR")).toBe("month");
    });

    it("should normalize amounts to their annual equivalent", () => {
      expect(normalizeSalaryToAnnual(10000, "month")).toBe(120000);
      expect(normalizeSalaryToAnnual(120000, "year")).toBe(120000);
      expect(normalizeSalaryToAnnual(60, "hour")).toBe(124800);
    });

    it("should expose the detected period from parseSalaryRange", () => {
      expect(parseSalaryRange("$8,000 - $10,000 per month").period).toBe(
        "month",
      );
      expect(parseSalaryRange("$80,000 - $100,000").period).toBe("year");
      expect(parseSalaryRange("Rp 15jt - 25jt").period).toBe("month");
    });
  });
});
