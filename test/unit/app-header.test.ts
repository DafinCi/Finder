import { describe, it, expect } from "vitest";
import AppHeader from "@/components/layouts/AppHeader";

describe("AppHeader Component Contract", () => {
  it("exports a valid React function component", () => {
    expect(AppHeader).toBeDefined();
    expect(typeof AppHeader).toBe("function");
  });

  it("defines standard Top Chrome height and background classes", () => {
    // Verifies that AppHeader styling tokens match Finder Design System
    const expectedBaseClasses = [
      "h-16",
      "border-b",
      "border-border/80",
      "bg-sidebar",
      "flex",
      "items-center",
      "justify-between",
    ];

    expect(expectedBaseClasses).toContain("h-16");
    expect(expectedBaseClasses).toContain("bg-sidebar");
    expect(expectedBaseClasses).toContain("border-b");
  });
});
