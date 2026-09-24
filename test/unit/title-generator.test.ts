import { describe, it, expect } from "vitest";
import { generateSmartSessionTitle } from "@/features/chat/utils/title-generator";

describe("Unit: Smart Session Title Generator", () => {
  it("should strip common conversational greetings and filler phrasing", () => {
    const prompt1 =
      "Halo min, tolong bantu saya persiapan interview Frontend Engineer";
    expect(generateSmartSessionTitle(prompt1)).toBe(
      "Persiapan interview Frontend Engineer",
    );

    const prompt2 = "Hai kak, bagaimana cara beralih karir ke Data Science?";
    expect(generateSmartSessionTitle(prompt2)).toBe(
      "Beralih karir ke Data Science",
    );

    const prompt3 =
      "Can you please help me review my CV for Senior DevOps role?";
    expect(generateSmartSessionTitle(prompt3)).toBe(
      "Review my CV for Senior DevOps",
    );
  });

  it("should sanitize markdown code blocks, special symbols, and URLs", () => {
    const raw =
      "Review kode ini: ```ts const a = 1; ``` dan cek http://github.com/my-profile";
    const title = generateSmartSessionTitle(raw);
    expect(title).not.toContain("```");
    expect(title).not.toContain("http");
    expect(title.length).toBeGreaterThan(0);
  });

  it("should cap long inputs gracefully under 45 characters with ellipsis", () => {
    const longPrompt =
      "Saya ingin merencanakan transisi karir profesional dari Java Spring Boot Backend Developer menuju Cloud Native Kubernetes Solutions Architect di industri perbankan";
    const title = generateSmartSessionTitle(longPrompt);
    expect(title.length).toBeLessThanOrEqual(45);
    expect(title.endsWith("...")).toBe(true);
  });

  it("should fallback to 'Konsultasi Karir' when input is empty or only greetings", () => {
    expect(generateSmartSessionTitle("")).toBe("Konsultasi Karir");
    expect(generateSmartSessionTitle("   ")).toBe("Konsultasi Karir");
    expect(generateSmartSessionTitle("Halo")).toBe("Konsultasi Karir");
    expect(generateSmartSessionTitle("Selamat pagi kak")).toBe(
      "Konsultasi Karir",
    );
  });
});
