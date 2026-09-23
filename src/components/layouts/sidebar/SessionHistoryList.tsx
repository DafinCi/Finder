"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trash2, Clock } from "lucide-react";
import { ChatSession } from "@/types/chat";
import { GroupedSessions } from "@/features/chat/hooks/useSessions";

interface SessionHistoryListProps {
  groupedSessions: GroupedSessions;
  isLoading: boolean;
  onDeleteSession: (id: string) => void;
}

export default function SessionHistoryList({
  groupedSessions,
  isLoading,
  onDeleteSession,
}: SessionHistoryListProps) {
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-8 bg-secondary/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  const renderGroup = (title: string, sessions: ChatSession[]) => {
    if (sessions.length === 0) return null;

    return (
      <div className="space-y-1 my-3">
        <h5 className="px-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          {title}
        </h5>
        {sessions.map((session) => {
          const isActive = pathname === `/c/${session.id}`;

          return (
            <div
              key={session.id}
              className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Link
                href={`/c/${session.id}`}
                className="flex items-center gap-2.5 min-w-0 flex-1"
                title={session.title}
              >
                <span className="truncate">{session.title}</span>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive rounded transition-opacity cursor-pointer"
                title="Delete session"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const hasAnySessions =
    groupedSessions.today.length > 0 ||
    groupedSessions.yesterday.length > 0 ||
    groupedSessions.previous7Days.length > 0 ||
    groupedSessions.older.length > 0;

  if (!hasAnySessions) {
    return (
      <div className="px-4 py-8 text-center text-xs text-muted-foreground/60 space-y-1">
        <Clock className="w-5 h-5 mx-auto opacity-40 mb-2" />
        <p>No conversation history</p>
        <p className="text-[11px]">Start a new chat to begin exploring</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-2 py-1 scrollbar-thin">
      {renderGroup("Today", groupedSessions.today)}
      {renderGroup("Yesterday", groupedSessions.yesterday)}
      {renderGroup("Previous 7 Days", groupedSessions.previous7Days)}
      {renderGroup("Older", groupedSessions.older)}
    </div>
  );
}
