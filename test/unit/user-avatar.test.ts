import { describe, it, expect } from "vitest";
import {
  USER_AVATAR_PALETTES,
  getUserAvatarHash,
  getUserAvatarDimensions,
} from "@/components/ui/UserAvatar";

describe("UserAvatar Logic & Specifications", () => {
  it("defines standard 6 color palettes matching Finder design system", () => {
    expect(USER_AVATAR_PALETTES).toHaveLength(6);
    const paletteNames = USER_AVATAR_PALETTES.map((p) => p.name);
    expect(paletteNames).toEqual([
      "violet",
      "mint",
      "blue",
      "ember",
      "lavender",
      "yellow",
    ]);
  });

  it("hashes seeds deterministically and non-negatively", () => {
    const hash1 = getUserAvatarHash("alice@example.com");
    const hash2 = getUserAvatarHash("alice@example.com");
    const hash3 = getUserAvatarHash("bob@example.com");

    expect(hash1).toBe(hash2);
    expect(hash1).toBeGreaterThanOrEqual(0);
    expect(typeof hash3).toBe("number");
  });

  it("calculates correct dimensions for all named avatar sizes", () => {
    expect(getUserAvatarDimensions("xs")).toEqual({
      containerClass: "w-6 h-6",
      pixelSize: 24,
    });
    expect(getUserAvatarDimensions("sm")).toEqual({
      containerClass: "w-8 h-8",
      pixelSize: 32,
    });
    expect(getUserAvatarDimensions("md")).toEqual({
      containerClass: "w-10 h-10",
      pixelSize: 40,
    });
    expect(getUserAvatarDimensions("lg")).toEqual({
      containerClass: "w-14 h-14",
      pixelSize: 56,
    });
    expect(getUserAvatarDimensions("xl")).toEqual({
      containerClass: "w-18 h-18",
      pixelSize: 72,
    });
    expect(getUserAvatarDimensions("2xl")).toEqual({
      containerClass: "w-20 h-20 sm:w-24 sm:h-24",
      pixelSize: 88,
    });
    expect(getUserAvatarDimensions("3xl")).toEqual({
      containerClass: "w-24 h-24 sm:w-28 sm:h-28",
      pixelSize: 104,
    });
  });

  it("supports numeric pixel size overrides", () => {
    const custom = getUserAvatarDimensions(92);
    expect(custom).toEqual({
      containerClass: "",
      pixelSize: 92,
    });
  });
});
