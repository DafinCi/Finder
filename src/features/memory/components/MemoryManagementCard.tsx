"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CareerMemory, MemoryCategory } from "../types/memory.types";
import { WALRUS_CONFIG } from "@/lib/walrus/walrus-config";
import { getMemoryStatusPresentation } from "../utils/memory-status";

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  career_goal: "Career Goal",
  role_transition: "Role Transition",
  work_preference: "Work Preference",
  tech_focus: "Tech Focus",
  constraint_avoid: "Avoid Constraint",
  user_correction: "Correction",
};

export function MemoryManagementCard() {
  const [memories, setMemories] = useState<CareerMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "forgotten">(
    "active",
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/memory");
      if (!res.ok) {
        throw new Error("Failed to load career memories.");
      }
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (err) {
      toast.error((err as Error).message || "Could not load memories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMemories();
  }, []);

  const handleForget = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/memory/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to forget memory.");
      }

      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "forgotten" } : m)),
      );
      toast.success("Career memory marked as forgotten.");
    } catch (err) {
      toast.error((err as Error).message || "Action failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  return (
    <div className="rounded-sm border border-border bg-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-sm bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Sovereign Career Memories
            </h2>
            <p className="text-xs text-muted-foreground">
              Durable preferences and career facts remembered by Finder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-sm bg-secondary/50 p-0.5 border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === "active"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("forgotten")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === "forgotten"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Forgotten
            </button>
          </div>

          <button
            type="button"
            onClick={fetchMemories}
            disabled={isLoading}
            aria-label="Refresh memories"
            title="Refresh memories"
            className="p-2 rounded-sm bg-secondary/30 border border-border/60 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
          Loading sovereign memories...
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            {filter === "active"
              ? "No active memories recorded yet."
              : "No memories found for this filter."}
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Tell Finder about your career target, tech stack, or work mode in
            chat.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredMemories.map((mem) => {
            const isForgotten = mem.status === "forgotten";
            const isDeleting = deletingId === mem.id;
            const memoryStatus = getMemoryStatusPresentation(mem.walrusStatus);

            return (
              <div
                key={mem.id}
                className={`p-3.5 rounded-sm border transition-all space-y-2 ${
                  isForgotten
                    ? "bg-secondary/15 border-border/40 opacity-60"
                    : "bg-secondary/30 border-border/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary border border-border text-muted-foreground">
                        {CATEGORY_LABELS[mem.category] || mem.category}
                      </span>

                      {mem.walrusBlobId && memoryStatus.tone === "verified" ? (
                        <a
                          href={`${WALRUS_CONFIG.explorerUrl}/${mem.walrusBlobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
                          title="View blob on Walrus"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{memoryStatus.label}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : memoryStatus.tone === "failed" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {memoryStatus.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {memoryStatus.label}
                        </span>
                      )}

                      {isForgotten && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-destructive/10 text-destructive font-medium">
                          Forgotten
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {mem.content}
                    </p>
                  </div>

                  {!isForgotten && (
                    <button
                      type="button"
                      onClick={() => handleForget(mem.id)}
                      disabled={isDeleting}
                      aria-label="Forget this memory"
                      title="Forget this memory"
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
