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
export const DEFAULT_AGENT_NAME = "Finder";

interface AgentContextType {
  agentName: string;
  activeSessionId?: string | null;
  setActiveSessionId: (id: string | null) => void;
  getAgentName: (sessionId?: string) => string;
  setAgentName: (name: string, sessionId?: string) => void;
  resetAgentName: (sessionId?: string) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [globalAgentName, setGlobalAgentName] = useState<string>(DEFAULT_AGENT_NAME);
  const [sessionNicknames, setSessionNicknames] = useState<Record<string, string>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
          setSessionNicknames(parsed);
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

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

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
        openDrawer,
        closeDrawer,
        toggleDrawer,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}

