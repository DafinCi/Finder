"use client";

import React from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useMemoryFeed } from "@/features/memory/hooks/useMemoryFeed";
import { getMemoryStatusPresentation } from "@/features/memory/utils/memory-status";
import type { ChatCommandResult } from "@/types/chat";

interface ChatCommandCardProps {
  command: ChatCommandResult;
}

const CATEGORY_LABELS: Record<string, string> = {
  career_goal: "Career goal",
  role_transition: "Role transition",
  work_preference: "Work preference",
  tech_focus: "Tech focus",
  constraint_avoid: "Constraint / avoid",
  user_correction: "Correction",
};

export default function ChatCommandCard({ command }: ChatCommandCardProps) {
  // The card reads the shared memory feed so the status can move from pending to
  // stored without an extra request per card.
  const { data } = useMemoryFeed();
  const liveMemory = command.memoryId
    ? data?.memories.find((memory) => memory.id === command.memoryId)
    : undefined;
  const status = liveMemory?.walrusStatus ?? command.walrusStatus ?? null;

  if (command.error) {
    return (
      <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>Memory not saved</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {command.message || "Something went wrong while saving that."}
        </p>
      </div>
    );
  }

  if (command.name === "help") return null;

  const statusView = getMemoryStatusPresentation(status);
  const statusColor =
    statusView.tone === "verified"
      ? "text-emerald-600 dark:text-emerald-400"
      : statusView.tone === "failed"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="rounded-sm border border-border bg-secondary/30 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span>Saved to career memory</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusColor}`}
        >
          {statusView.tone === "pending" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : statusView.tone === "verified" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span>{statusView.label}</span>
        </span>
      </div>

      {command.content && (
        <p className="text-muted-foreground leading-relaxed">
          {command.content}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        {command.category && (
          <span className="px-1.5 py-0.5 rounded-xs bg-secondary border border-border">
            {CATEGORY_LABELS[command.category] ?? command.category}
            {command.categorySource === "inferred" ? " · guessed" : ""}
          </span>
        )}
        {command.supersededId && <span>Replaced an earlier memory</span>}
      </div>
    </div>
  );
}
