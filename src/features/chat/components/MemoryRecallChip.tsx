"use client";

import React from "react";
import { Brain } from "lucide-react";
import type { MemoryRecallMetadata } from "@/types/chat";

interface MemoryRecallChipProps {
  recall: MemoryRecallMetadata;
}

const CATEGORY_LABELS: Record<string, string> = {
  career_goal: "Career goal",
  role_transition: "Role transition",
  work_preference: "Work preference",
  tech_focus: "Tech focus",
  constraint_avoid: "Avoid",
  user_correction: "Correction",
};

function sourceLabel(source: MemoryRecallMetadata["source"]): string {
  if (source === "walrus") return "Walrus Mainnet";
  if (source === "cache") return "Local cache";
  return "No memory";
}

export default function MemoryRecallChip({ recall }: MemoryRecallChipProps) {
  if (recall.stateless) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
        <Brain className="w-3.5 h-3.5" />
        Memory off (Amnesia mode)
      </span>
    );
  }

  if (recall.count <= 0) return null;

  return (
    <details className="text-[11px] group">
      <summary className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-secondary border border-border text-muted-foreground cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span className="font-medium text-foreground">
          Used {recall.count} {recall.count === 1 ? "memory" : "memories"}
        </span>
        <span className="text-muted-foreground/70">
          · {sourceLabel(recall.source)}
        </span>
      </summary>
      <ul className="mt-2 space-y-1.5 pl-1">
        {recall.memories.map((memory, index) => (
          <li
            key={`${index}-${memory.content.slice(0, 24)}`}
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {memory.category && (
              <span className="font-medium text-foreground/80">
                {CATEGORY_LABELS[memory.category] || memory.category}:{" "}
              </span>
            )}
            {memory.content}
          </li>
        ))}
      </ul>
    </details>
  );
}
