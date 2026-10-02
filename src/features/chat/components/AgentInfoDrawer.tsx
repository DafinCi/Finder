"use client";

import React, { useState, useEffect } from "react";
import { X, Cpu, Check, Pencil, Activity, Database, Bot } from "lucide-react";
import { toast } from "sonner";
import BotAvatar from "@/components/ui/BotAvatar";
import { useAgent, DrawerTabType } from "@/contexts/AgentContext";
import WalrusMemoryInspector from "@/features/memory/components/WalrusMemoryInspector";

interface AgentInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function AgentInfoDrawer({
  isOpen,
  onClose,
  sessionId,
}: AgentInfoDrawerProps) {
  const agentCtx = useAgent();
  const currentAgentName = agentCtx.getAgentName(sessionId);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentAgentName);

  // Resilient tab state: syncs with AgentContext, with local state fallback to prevent HMR desync
  const [localTab, setLocalTab] = useState<DrawerTabType>("info");

  useEffect(() => {
    if (agentCtx.drawerTab) {
      setLocalTab(agentCtx.drawerTab);
    }
  }, [agentCtx.drawerTab]);

  const activeTab = agentCtx.drawerTab || localTab;

  const handleTabChange = (tab: DrawerTabType) => {
    setLocalTab(tab);
    if (typeof agentCtx.setDrawerTab === "function") {
      agentCtx.setDrawerTab(tab);
    }
  };

  // Synchronize local input whenever currentAgentName changes
  useEffect(() => {
    setNameInput(currentAgentName);
  }, [currentAgentName]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isEditing) {
          setIsEditing(false);
          setNameInput(currentAgentName);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEditing, currentAgentName, onClose]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error("Agent name cannot be blank");
      return;
    }
    agentCtx.setAgentName(trimmed, sessionId);
    setIsEditing(false);
    toast.success("Agent nickname updated");
  };

  const handleCancelEdit = () => {
    setNameInput(currentAgentName);
    setIsEditing(false);
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close agent info drawer backdrop"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onClose();
          }}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Drawer Sheet */}
      <aside
        aria-label="Agent information and Walrus memory"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-card border-l border-border/80 shadow-2xl flex flex-col h-[100dvh] overflow-hidden transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header with Dual Tab Switcher */}
        <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-1.5 bg-background p-1 rounded-sm border border-border">
            <button
              type="button"
              onClick={() => handleTabChange("info")}
              aria-label="Agent Info Tab"
              className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === "info"
                  ? "bg-secondary text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agent</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("memory")}
              aria-label="Walrus Memory Tab"
              className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === "memory"
                  ? "bg-secondary text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>Walrus Memory</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="min-h-[44px] min-w-[44px] p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === "memory" ? (
            <WalrusMemoryInspector />
          ) : (
            <div className="space-y-6">
              {/* Section 1: Hero Avatar & Name Personalization */}
              <div className="flex flex-col items-center text-center p-5 rounded-sm bg-secondary border border-border space-y-3.5">
                <BotAvatar
                  name={currentAgentName}
                  seed={sessionId}
                  size="xl"
                  className="shadow-sm"
                />

                {isEditing ? (
                  <div className="w-full space-y-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                      maxLength={30}
                      aria-label="Agent nickname"
                      className="w-full text-center text-sm font-semibold bg-background text-foreground border border-primary/50 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Enter agent nickname"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveName}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-sm bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition-opacity inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-sm bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <h4 className="text-lg font-bold font-heading text-foreground">
                        {currentAgentName}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        aria-label="Edit agent nickname"
                        title="Edit agent nickname"
                        className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your personalized AI career partner
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2: LLM Model & Technical Architecture */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                  <span>Intelligence Architecture</span>
                </h5>

                <div className="rounded-sm border border-border bg-secondary p-4 space-y-3.5 text-xs">
                  {/* Active Model */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">
                      Active Model
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-foreground px-2 py-0.5 rounded-sm bg-background border border-border">
                      openai/gpt-oss-120b
                    </span>
                  </div>

                  {/* Provider */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">
                      Inference Engine
                    </span>
                    <span className="text-foreground font-medium">
                      Groq Cloud (Fast Stream)
                    </span>
                  </div>

                  {/* Agent Tools */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">
                      Autonomous Tools
                    </span>
                    <span className="text-foreground font-medium">
                      Active & Sovereign
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <Activity className="w-3 h-3 text-[#22C55E]" />
                      <span>Service Status</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#22C55E]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      Operational
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
