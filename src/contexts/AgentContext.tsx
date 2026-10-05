"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const GLOBAL_AGENT_NICKNAME_KEY = "finder_agent_nickname";
const SESSION_AGENT_NICKNAMES_KEY = "finder_session_agent_nicknames";
export const AMNESIA_DEMO_KEY = "finder_demo_amnesia";
export const DEFAULT_AGENT_NAME = "Finder";

export type DrawerTabType = "info" | "memory";

export interface AgentContextType {
  agentName: string;
  activeSessionId?: string | null;
  setActiveSessionId: (id: string | null) => void;
  getAgentName: (sessionId?: string) => string;
  setAgentName: (name: string, sessionId?: string) => void;
  resetAgentName: (sessionId?: string) => void;
  isDrawerOpen: boolean;
  drawerTab: DrawerTabType;
  setDrawerTab: (tab: DrawerTabType) => void;
  openDrawer: (tab?: DrawerTabType) => void;
  openDrawerWithTab: (tab: DrawerTabType) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  isAmnesiaMode: boolean;
  setIsAmnesiaMode: (enabled: boolean) => void;
  toggleAmnesiaMode: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [globalAgentName, setGlobalAgentName] = useState<string>(DEFAULT_AGENT_NAME);
  const [sessionNicknames, setSessionNicknames] = useState<Record<string, string>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTabType>("info");
  const [isAmnesiaMode, setIsAmnesiaModeState] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Clean up legacy global nickname so test strings never pollute new sessions
      const savedGlobal = localStorage.getItem(GLOBAL_AGENT_NICKNAME_KEY);
      if (savedGlobal) {
        localStorage.removeItem(GLOBAL_AGENT_NICKNAME_KEY);
      }

      const savedSessions = localStorage.getItem(SESSION_AGENT_NICKNAMES_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (parsed && typeof parsed === "object") {
          // Browser-only storage: syncing after mount keeps SSR markup stable.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSessionNicknames(parsed);
        }
      }

      // Check URL query parameter (?demo=stateless or ?mode=amnesia) or sessionStorage
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const urlStateless =
          searchParams.get("demo") === "stateless" ||
          searchParams.get("mode") === "amnesia";
        const savedAmnesia = sessionStorage.getItem(AMNESIA_DEMO_KEY);

        if (urlStateless || savedAmnesia === "true") {
          setIsAmnesiaModeState(true);
        }
      }
    } catch {
      // Storage access may be restricted in sandboxed or incognito environments
    }
  }, []);

  const getAgentName = useCallback(
    (sessionId?: string): string => {
      if (sessionId && sessionNicknames[sessionId]) {
        return sessionNicknames[sessionId];
      }
      return globalAgentName;
    },
    [sessionNicknames, globalAgentName]
  );

  const setAgentName = useCallback(
    (name: string, sessionId?: string) => {
      const trimmed = name.trim();
      const finalName = trimmed || DEFAULT_AGENT_NAME;

      if (sessionId) {
        setSessionNicknames((prev) => {
          const updated = { ...prev, [sessionId]: finalName };
          try {
            localStorage.setItem(SESSION_AGENT_NICKNAMES_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage errors
          }
          return updated;
        });
      } else {
        setGlobalAgentName(finalName);
        try {
          localStorage.setItem(GLOBAL_AGENT_NICKNAME_KEY, finalName);
        } catch {
          // Ignore storage errors
        }
      }
    },
    []
  );

  const resetAgentName = useCallback(
    (sessionId?: string) => {
      if (sessionId) {
        setSessionNicknames((prev) => {
          const updated = { ...prev };
          delete updated[sessionId];
          try {
            localStorage.setItem(SESSION_AGENT_NICKNAMES_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage errors
          }
          return updated;
        });
      } else {
        setGlobalAgentName(DEFAULT_AGENT_NAME);
        try {
          localStorage.setItem(GLOBAL_AGENT_NICKNAME_KEY, DEFAULT_AGENT_NAME);
        } catch {
          // Ignore storage errors
        }
      }
    },
    []
  );

  const openDrawer = useCallback((tab?: DrawerTabType) => {
    if (tab) {
      setDrawerTab(tab);
    }
    setIsDrawerOpen(true);
  }, []);

  const openDrawerWithTab = useCallback((tab: DrawerTabType) => {
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const setIsAmnesiaMode = useCallback((enabled: boolean) => {
    setIsAmnesiaModeState(enabled);
    try {
      if (enabled) {
        sessionStorage.setItem(AMNESIA_DEMO_KEY, "true");
      } else {
        sessionStorage.removeItem(AMNESIA_DEMO_KEY);
      }
    } catch {
      // Storage access may be restricted
    }
  }, []);

  const toggleAmnesiaMode = useCallback(() => {
    setIsAmnesiaModeState((prev) => {
      const next = !prev;
      try {
        if (next) {
          sessionStorage.setItem(AMNESIA_DEMO_KEY, "true");
        } else {
          sessionStorage.removeItem(AMNESIA_DEMO_KEY);
        }
      } catch {
        // Storage access may be restricted
      }
      return next;
    });
  }, []);

  // Active agent name: prioritized by activeSessionId, falling back to global
  const currentAgentName = activeSessionId
    ? getAgentName(activeSessionId)
    : globalAgentName;

  return (
    <AgentContext.Provider
      value={{
        agentName: currentAgentName,
        activeSessionId,
        setActiveSessionId,
        getAgentName,
        setAgentName,
        resetAgentName,
        isDrawerOpen,
        drawerTab,
        setDrawerTab,
        openDrawer,
        openDrawerWithTab,
        closeDrawer,
        toggleDrawer,
        isAmnesiaMode,
        setIsAmnesiaMode,
        toggleAmnesiaMode,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextType {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
