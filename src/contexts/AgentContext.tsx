"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const AGENT_NICKNAME_KEY = "finder_agent_nickname";
const DEFAULT_AGENT_NAME = "Finder";

interface AgentContextType {
  agentName: string;
  setAgentName: (name: string) => void;
  resetAgentName: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agentName, setAgentNameState] = useState<string>(DEFAULT_AGENT_NAME);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AGENT_NICKNAME_KEY);
      if (saved && saved.trim()) {
        setAgentNameState(saved.trim());
      }
    } catch {
      // Storage access may be restricted in sandboxed environments
    }
  }, []);

  const setAgentName = (name: string) => {
    const trimmed = name.trim();
    const finalName = trimmed || DEFAULT_AGENT_NAME;
    setAgentNameState(finalName);
    try {
      localStorage.setItem(AGENT_NICKNAME_KEY, finalName);
    } catch {
      // Storage access may be restricted
    }
  };

  const resetAgentName = () => {
    setAgentName(DEFAULT_AGENT_NAME);
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  return (
    <AgentContext.Provider
      value={{
        agentName,
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
