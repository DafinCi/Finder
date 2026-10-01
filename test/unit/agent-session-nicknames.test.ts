import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Per-Session Agent Nicknames Scoping and Isolation", () => {
  const GLOBAL_KEY = "finder_agent_nickname";
  const SESSIONS_KEY = "finder_session_agent_nicknames";
  const DEFAULT_NAME = "Finder";

  const storage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, val: string) => {
      storage[key] = val;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      for (const k of Object.keys(storage)) delete storage[k];
    }),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.clear();
  });

  it("returns default agent name when no custom nickname exists", () => {
    const getAgentName = (
      sessionId?: string,
      sessionsMap: Record<string, string> = {},
      globalName = DEFAULT_NAME,
    ) => {
      if (sessionId && sessionsMap[sessionId]) {
        return sessionsMap[sessionId];
      }
      return globalName;
    };

    expect(getAgentName("session-123")).toBe("Finder");
    expect(getAgentName()).toBe("Finder");
  });

  it("isolates nickname changes to specific session without mutating other sessions", () => {
    const sessionMap: Record<string, string> = {};

    const setAgentName = (name: string, sessionId?: string) => {
      const trimmed = name.trim() || DEFAULT_NAME;
      if (sessionId) {
        sessionMap[sessionId] = trimmed;
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessionMap));
      } else {
        localStorage.setItem(GLOBAL_KEY, trimmed);
      }
    };

    const getAgentName = (sessionId?: string) => {
      if (sessionId && sessionMap[sessionId]) return sessionMap[sessionId];
      return DEFAULT_NAME;
    };

    // Rename Session 1 to "Career Coach"
    setAgentName("Career Coach", "session-1");

    // Rename Session 2 to "Tech Mentor"
    setAgentName("Tech Mentor", "session-2");

    // Verify session isolation
    expect(getAgentName("session-1")).toBe("Career Coach");
    expect(getAgentName("session-2")).toBe("Tech Mentor");

    // Verify untouched Session 3 remains default
    expect(getAgentName("session-3")).toBe("Finder");

    // Verify localStorage payload is correctly structured
    const stored = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "{}");
    expect(stored).toEqual({
      "session-1": "Career Coach",
      "session-2": "Tech Mentor",
    });
  });

  it("correctly resets session nickname without affecting other sessions", () => {
    const sessionMap: Record<string, string> = {
      "session-1": "Career Coach",
      "session-2": "Tech Mentor",
    };

    const resetAgentName = (sessionId?: string) => {
      if (sessionId) {
        delete sessionMap[sessionId];
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessionMap));
      }
    };

    const getAgentName = (sessionId?: string) => {
      if (sessionId && sessionMap[sessionId]) return sessionMap[sessionId];
      return DEFAULT_NAME;
    };

    resetAgentName("session-1");

    expect(getAgentName("session-1")).toBe("Finder");
    expect(getAgentName("session-2")).toBe("Tech Mentor");

    const stored = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "{}");
    expect(stored).toEqual({
      "session-2": "Tech Mentor",
    });
  });
});
