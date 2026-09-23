"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trash2, Clock, RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import { ChatSession } from "@/types/chat";
import { GroupedSessions } from "@/features/chat/hooks/useSessions";

interface SessionHistoryListProps {
  groupedSessions: GroupedSessions;
  isLoading: boolean;
  error?: string | null;
  deletingId?: string | null;
  onRetry?: () => void;
  onDeleteSession: (id: string) => void;
}

export default function SessionHistoryList({
  groupedSessions,
  isLoading,
  error,
  deletingId,
  onRetry,
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

  if (error) {
    return (
      <div className="p-3 mx-1 my-2 rounded-lg border border-destructive/20 bg-destructive/10 text-center space-y-2 text-xs">
        <div className="flex items-center justify-center gap-1.5 text-destructive font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Failed to load history</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
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

              {(() => {
                const isThisDeleting = deletingId === session.id;
                return (
                  <button
                    type="button"
                    disabled={isThisDeleting || Boolean(deletingId)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    aria-label={`Delete session ${session.title}`}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 min-w-[36px] min-h-[36px] flex items-center justify-center hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/50 rounded-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isThisDeleting ? "Deleting..." : "Delete session"}
                  >
                    {isThisDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                );
              })()}
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
    <div className="flex-1 overflow-y-auto px-2 py-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {renderGroup("Today", groupedSessions.today)}
      {renderGroup("Yesterday", groupedSessions.yesterday)}
      {renderGroup("Previous 7 Days", groupedSessions.previous7Days)}
      {renderGroup("Older", groupedSessions.older)}
    </div>
  );
}
