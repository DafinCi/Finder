import { describe, it, expect } from "vitest";
import { SETTINGS_TABS, type SettingsTab } from "@/app/(app)/settings/page";

describe("Settings Navigation Tabs Specification", () => {
  it("defines the 4 canonical categories in correct hierarchy", () => {
    const tabIds: SettingsTab[] = SETTINGS_TABS.map((t) => t.id);
    expect(tabIds).toEqual(["account", "wallet", "memories", "storage"]);
  });

  it("provides comprehensive titles and subtitles for every tab", () => {
    for (const tab of SETTINGS_TABS) {
      expect(tab.title).toBeTruthy();
      expect(tab.subtitle).toBeTruthy();
      expect(tab.icon).toBeDefined();
    }
  });

  it("ensures no em dash character codes exist in any tab titles or subtitles", () => {
    const emDashChar = String.fromCharCode(8212);
    for (const tab of SETTINGS_TABS) {
      expect(tab.title.includes(emDashChar)).toBe(false);
      expect(tab.subtitle.includes(emDashChar)).toBe(false);
    }
  });

  it("ensures Account & Identity is the default primary entry", () => {
    const firstTab = SETTINGS_TABS[0];
    expect(firstTab.id).toBe("account");
    expect(firstTab.title).toBe("Account & Identity");
  });
});
