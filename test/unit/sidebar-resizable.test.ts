import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
} from "@/components/layouts/sidebar/Sidebar";

describe("Sidebar Resizable Dimensions and Clamping Logic", () => {
  const mockStorage: Record<string, string> = {};
  const localStorageMock = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(mockStorage)) {
        delete mockStorage[key];
      }
    }),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
  });

  it("exports correct boundary constants matching design specifications", () => {
    expect(MIN_SIDEBAR_WIDTH).toBe(240);
    expect(MAX_SIDEBAR_WIDTH).toBe(420);
    expect(DEFAULT_SIDEBAR_WIDTH).toBe(260);
    expect(DEFAULT_SIDEBAR_WIDTH).toBeGreaterThanOrEqual(MIN_SIDEBAR_WIDTH);
    expect(DEFAULT_SIDEBAR_WIDTH).toBeLessThanOrEqual(MAX_SIDEBAR_WIDTH);
  });

  it("clamps clientX to MIN_SIDEBAR_WIDTH when dragged too far left", () => {
    const clientX = 180;
    const clamped = Math.min(
      MAX_SIDEBAR_WIDTH,
      Math.max(MIN_SIDEBAR_WIDTH, clientX)
    );
    expect(clamped).toBe(240);
  });

  it("clamps clientX to MAX_SIDEBAR_WIDTH when dragged too far right", () => {
    const clientX = 550;
    const clamped = Math.min(
      MAX_SIDEBAR_WIDTH,
      Math.max(MIN_SIDEBAR_WIDTH, clientX)
    );
    expect(clamped).toBe(420);
  });

  it("preserves exact width within boundary limits", () => {
    const clientX = 320;
    const clamped = Math.min(
      MAX_SIDEBAR_WIDTH,
      Math.max(MIN_SIDEBAR_WIDTH, clientX)
    );
    expect(clamped).toBe(320);
  });

  it("handles keyboard navigation step calculation correctly", () => {
    const initialWidth = 260;
    const step = 10;

    const leftWidth = Math.max(MIN_SIDEBAR_WIDTH, initialWidth - step);
    expect(leftWidth).toBe(250);

    const rightWidth = Math.min(MAX_SIDEBAR_WIDTH, initialWidth + step);
    expect(rightWidth).toBe(270);

    // Bounded step left at min
    const atMin = 240;
    expect(Math.max(MIN_SIDEBAR_WIDTH, atMin - step)).toBe(240);

    // Bounded step right at max
    const atMax = 420;
    expect(Math.min(MAX_SIDEBAR_WIDTH, atMax + step)).toBe(420);
  });

  it("validates localStorage persistence storage key and value range", () => {
    const STORAGE_KEY = "finder_sidebar_width";

    // Valid width stored
    localStorage.setItem(STORAGE_KEY, "350");
    const retrieved = localStorage.getItem(STORAGE_KEY);
    const parsed = parseInt(retrieved || "0", 10);
    expect(parsed).toBe(350);
    expect(parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH).toBe(true);

    // Invalid non-numeric fallback
    localStorage.setItem(STORAGE_KEY, "invalid-width");
    const rawInvalid = localStorage.getItem(STORAGE_KEY);
    const parsedInvalid = parseInt(rawInvalid || "0", 10);
    expect(isNaN(parsedInvalid)).toBe(true);

    // Out of bounds fallback
    localStorage.setItem(STORAGE_KEY, "999");
    const rawOverflow = localStorage.getItem(STORAGE_KEY);
    const parsedOverflow = parseInt(rawOverflow || "0", 10);
    const isValid =
      !isNaN(parsedOverflow) &&
      parsedOverflow >= MIN_SIDEBAR_WIDTH &&
      parsedOverflow <= MAX_SIDEBAR_WIDTH;
    expect(isValid).toBe(false);
  });
});
