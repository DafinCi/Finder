import { describe, it, expect } from "vitest";
import {
  normalizeSkill,
  matchesSkill,
} from "@/features/matching/utils/skill-normalizer";

describe("Unit: Centralized Skill Normalizer", () => {
  describe("Lexical Alias Resolution", () => {
    it("should resolve programming language aliases canonically", () => {
      expect(normalizeSkill("ts")).toBe("typescript");
      expect(normalizeSkill("TypeScript")).toBe("typescript");
      expect(normalizeSkill("js")).toBe("javascript");
      expect(normalizeSkill("JavaScript")).toBe("javascript");
      expect(normalizeSkill("golang")).toBe("go");
      expect(normalizeSkill("Go")).toBe("go");
      expect(normalizeSkill("py")).toBe("python");
      expect(normalizeSkill("Python 3")).toBe("python");
    });

    it("should resolve framework & library aliases canonically", () => {
      expect(normalizeSkill("React.js")).toBe("react");
      expect(normalizeSkill("reactjs")).toBe("react");
      expect(normalizeSkill("Next.js")).toBe("next.js");
      expect(normalizeSkill("nextjs")).toBe("next.js");
      expect(normalizeSkill("Node.js")).toBe("node.js");
      expect(normalizeSkill("nodejs")).toBe("node.js");
      expect(normalizeSkill("node")).toBe("node.js");
      expect(normalizeSkill("Vue.js")).toBe("vue");
      expect(normalizeSkill("Nuxt.js")).toBe("nuxt.js");
    });

    it("should resolve database & infrastructure aliases canonically", () => {
      expect(normalizeSkill("postgres")).toBe("postgresql");
      expect(normalizeSkill("PostgreSQL")).toBe("postgresql");
      expect(normalizeSkill("pgsql")).toBe("postgresql");
      expect(normalizeSkill("k8s")).toBe("kubernetes");
      expect(normalizeSkill("Kubernetes")).toBe("kubernetes");
      expect(normalizeSkill("Amazon Web Services")).toBe("aws");
    });
  });

  describe("Punctuation & Whitespace Handling", () => {
    it("should strip wrapping quotes and brackets", () => {
      expect(normalizeSkill('"React"')).toBe("react");
      expect(normalizeSkill("('TypeScript')")).toBe("typescript");
      expect(normalizeSkill("  Docker  ")).toBe("docker");
    });

    it("should preserve critical language punctuation (C++, C#, .NET)", () => {
      expect(normalizeSkill("C++")).toBe("c++");
      expect(normalizeSkill("c#")).toBe("c#");
      expect(normalizeSkill(".net")).toBe(".net");
    });
  });

  describe("Guardrails: Anti-Inflation & Semantic Separation", () => {
    it("must NEVER treat Java and JavaScript as equivalent", () => {
      expect(normalizeSkill("Java")).toBe("java");
      expect(normalizeSkill("JavaScript")).toBe("javascript");
      expect(matchesSkill("Java", "JavaScript")).toBe(false);
    });

    it("must NEVER treat React and React Native as equivalent", () => {
      expect(normalizeSkill("React")).toBe("react");
      expect(normalizeSkill("React Native")).toBe("react native");
      expect(matchesSkill("React", "React Native")).toBe(false);
    });

    it("must NEVER treat Node.js and Express as equivalent", () => {
      expect(matchesSkill("Node.js", "Express")).toBe(false);
    });

    it("must NEVER treat C, C++, and C# as equivalent", () => {
      expect(matchesSkill("C", "C++")).toBe(false);
      expect(matchesSkill("C++", "C#")).toBe(false);
      expect(matchesSkill("C", "C#")).toBe(false);
    });
  });

  describe("Matching Predicate", () => {
    it("should match skills regardless of casing and common aliases", () => {
      expect(matchesSkill("TypeScript", "ts")).toBe(true);
      expect(matchesSkill("React.js", "reactjs")).toBe(true);
      expect(matchesSkill("PostgreSQL", "postgres")).toBe(true);
      expect(matchesSkill("k8s", "Kubernetes")).toBe(true);
    });

    it("should return false for completely empty or non-matching skills", () => {
      expect(matchesSkill("", "TypeScript")).toBe(false);
      expect(matchesSkill("Docker", "Kubernetes")).toBe(false);
    });
  });
});
