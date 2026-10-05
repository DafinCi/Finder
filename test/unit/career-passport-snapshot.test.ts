import { describe, it, expect } from "vitest";
import { buildPublicSnapshot } from "@/features/walrus/services/career-snapshot.service";

describe("Public career passport minimization", () => {
  it("should publish only non-identifying career fields", () => {
    const snapshot = buildPublicSnapshot({
      profileVersion: 3,
      careerIntent: {
        target_roles: [{ role: "Frontend Engineer", priority: "primary" }],
        target_level: "mid_level",
        employment_types: ["full_time"],
      },
      capabilities: {
        skills: [{ skill: "React", category: "core" }],
      },
      background: {
        education: [{ institution: "Secret University" }],
        experience: [{ company_name: "Secret Corp" }],
        projects: [],
      },
      preferences: {
        salary: { min_amount: 123456, currency: "USD" },
        locations: ["Jakarta"],
      },
    } as any);

    expect(snapshot.skills).toEqual([{ skill: "React", category: "core" }]);
    expect(snapshot.target_roles).toEqual([
      { role: "Frontend Engineer", priority: "primary" },
    ]);
    expect(snapshot.career_level).toBe("mid_level");

    const serialized = JSON.stringify(snapshot);
    expect(snapshot).not.toHaveProperty("user_id");
    expect(snapshot).not.toHaveProperty("sui_address");
    expect(snapshot).not.toHaveProperty("background");
    expect(snapshot).not.toHaveProperty("preferences");
    expect(snapshot).not.toHaveProperty("resume_walrus_blob_id");
    expect(serialized).not.toContain("Secret Corp");
    expect(serialized).not.toContain("Secret University");
    expect(serialized).not.toContain("123456");
    expect(serialized).not.toContain("Jakarta");
  });
});
