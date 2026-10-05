"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trash2,
  Clock,
  RotateCcw,
  AlertCircle,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { ChatSession } from "@/types/chat";
import { GroupedSessions } from "@/features/chat/hooks/useSessions";
import { useAgent } from "@/contexts/AgentContext";
import BotAvatar from "@/components/ui/BotAvatar";

interface SessionHistoryListProps {
  groupedSessions: GroupedSessions;
  isLoading: boolean;
  error?: string | null;
  deletingId?: string | null;
  onRetry?: () => void;
  onRenameSession?: (id: string, newTitle: string) => Promise<void> | void;
  onDeleteSession: (id: string) => void;
}

export default function SessionHistoryList({
  groupedSessions,
  isLoading,
  error,
  deletingId,
  onRetry,
  onRenameSession,
  onDeleteSession,
}: SessionHistoryListProps) {
  const pathname = usePathname();
  const { getAgentName } = useAgent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);

  const handleSaveRename = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed || !onRenameSession) {
      setEditingId(null);
      return;
    }
    try {
      setIsSavingRename(true);
      await onRenameSession(id, trimmed);
    } finally {
      setIsSavingRename(false);
      setEditingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-8 bg-secondary/50 rounded-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 mx-1 my-2 rounded-sm border border-destructive/20 bg-destructive/10 text-center space-y-2 text-xs">
        <div className="flex items-center justify-center gap-1.5 text-destructive font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Failed to load history</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
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
          const isEditing = editingId === session.id;

          if (isEditing) {
            return (
              <div
                key={session.id}
                className="flex items-center gap-1 px-2 py-1.5 rounded-sm bg-secondary/80 border border-border-strong text-xs my-0.5"
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename(session.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  maxLength={100}
                  disabled={isSavingRename}
                  className="flex-1 bg-background text-foreground text-xs px-2 py-1 rounded-sm border border-border focus:outline-none focus:ring-1 focus:ring-muted-foreground min-w-0"
                  aria-label="Edit session title"
                />
                <button
                  type="button"
                  disabled={isSavingRename}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveRename(session.id);
                  }}
                  aria-label="Save changes"
                  className="p-1 hover:text-foreground rounded-sm hover:bg-secondary cursor-pointer disabled:opacity-40"
                  title="Save"
                >
                  {isSavingRename ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-foreground" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSavingRename}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingId(null);
                  }}
                  aria-label="Cancel editing"
                  className="p-1 hover:text-muted-foreground rounded-sm hover:bg-secondary cursor-pointer disabled:opacity-40"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          const sessionAgentName = getAgentName(session.id);

          return (
            <div
              key={session.id}
              className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm transition-all cursor-pointer ${
                isActive
                  ? "bg-secondary text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-muted-foreground"
              }`}
            >
              <Link
                href={`/c/${session.id}`}
                className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden pr-1"
                title={`${sessionAgentName} - ${session.title}`}
              >
                {/* Bot Avatar with immutable Slush color locked to session.id seed */}
                <BotAvatar
                  name={sessionAgentName}
                  seed={session.id}
                  size="md"
                  className="shrink-0"
                />

                {/* Agent Name + Session Title Subtext */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground truncate leading-tight">
                    {sessionAgentName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                    {session.title}
                  </span>
                </div>
              </Link>

              {/* Action Buttons: Positioned absolute right-2 so session text has 100% row width when browsing */}
              <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-secondary/95 px-1 py-0.5 rounded-sm shadow-xs pointer-events-none group-hover:pointer-events-auto">
                {onRenameSession && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingId(session.id);
                      setEditTitle(session.title);
                    }}
                    aria-label={`Rename ${session.title}`}
                    className="p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

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
                      className="p-1 text-muted-foreground hover:text-destructive rounded-sm transition-colors cursor-pointer disabled:opacity-40"
                      title={isThisDeleting ? "Deleting..." : "Delete session"}
                    >
                      {isThisDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  );
                })()}
              </div>
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
