"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { Plus, Bot, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "@/contexts/SidebarContext";
import { useChat } from "@/features/chat/hooks/useChat";
import ChatTimeline from "@/features/chat/components/ChatTimeline";
import OmniPromptInput from "@/features/chat/components/OmniPromptInput";
import ChatTimelineSkeleton from "@/features/chat/skeletons/ChatTimelineSkeleton";

export default function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { collapsed } = useSidebar();
  const {
    session,
    messages,
    isLoading,
    isInitialLoading,
    thinkingStatus,
    error,
    sendMessage,
    retryLastMessage,
    updateTitle,
  } = useChat(id);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const handleSaveTitle = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === session?.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      setIsSavingTitle(true);
      await updateTitle(trimmed);
      toast.success("Session renamed");
      setIsEditingTitle(false);
    } catch (err) {
      toast.error("Couldn't rename session", {
        description: (err as Error).message,
      });
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleAskAboutJob = (jobTitle: string, company: string) => {
    sendMessage(
      `Can you break down the ${jobTitle} position at ${company}? Based on my resume profile, what are my key competitive advantages and what technical interview questions should I prepare for?`,
      null,
    );
  };

  return (
    <div className="flex-1 relative h-full w-full overflow-hidden bg-background">
      {/* Full-Height Scrollable Stream */}
      <div className="h-full w-full overflow-y-auto custom-scrollbar">
        {/* Session Topbar: Sticky inside scroll container so scrollbar spans full height */}
        <div
          className={`sticky top-0 z-20 h-14 border-b border-border/60 flex items-center justify-between bg-background/85 backdrop-blur-md shrink-0 transition-all duration-200 ${
            collapsed ? "pl-14 pr-4 md:pr-6" : "px-4 md:px-6"
          }`}
        >
          {/* Session Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0 max-w-sm">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                autoFocus
                maxLength={100}
                disabled={isSavingTitle}
                className="bg-secondary text-foreground text-xs px-2.5 py-1 rounded-md border border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary w-full"
                aria-label="Edit chat session title"
              />
              <button
                type="button"
                disabled={isSavingTitle}
                onClick={handleSaveTitle}
                className="p-1 hover:text-primary rounded hover:bg-secondary text-primary cursor-pointer disabled:opacity-40"
                title="Save"
              >
                {isSavingTitle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                disabled={isSavingTitle}
                onClick={() => setIsEditingTitle(false)}
                className="p-1 hover:text-muted-foreground rounded hover:bg-secondary text-muted-foreground cursor-pointer disabled:opacity-40"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 max-w-md group">
              <h2
                className="text-sm font-semibold text-foreground truncate cursor-pointer hover:underline decoration-muted-foreground/40 underline-offset-4"
                onClick={() => {
                  setIsEditingTitle(true);
                  setNewTitle(session?.title || "");
                }}
                title="Rename session"
              >
                {session?.title || "Chat session"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(true);
                  setNewTitle(session?.title || "");
                }}
                aria-label="Rename session"
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-opacity cursor-pointer"
                title="Rename session"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border shrink-0">
                Career Copilot
              </span>
            </div>
          )}

          {/* Quick New Chat Button */}
          <Link
            href="/"
            className="p-1.5 rounded-lg border border-border/80 bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            title="New Chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </Link>
        </div>

        {/* Chat Content Body */}
        <div className="min-h-[calc(100%-3.5rem)] flex flex-col justify-between">
          {/* Initial Loading Skeleton */}
          {isInitialLoading ? (
            <ChatTimelineSkeleton />
          ) : messages.length === 0 ? (
            /* Empty State: Only shown if definitely not loading and no messages */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 my-auto text-muted-foreground space-y-3 min-h-[50vh] animate-in fade-in duration-200">
              <Bot className="w-8 h-8 opacity-40" />
              <p className="text-sm font-medium">
                No messages in this session yet.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Ask follow-up questions about your career, interview prep, or
                job opportunities.
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
              <ChatTimeline
                messages={messages}
                isLoading={isLoading}
                thinkingStatus={thinkingStatus}
                error={error}
                onRetry={retryLastMessage}
                onAskAboutJob={handleAskAboutJob}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Prompt Omnibar with Ambient Bottom Fade */}
      <div className="absolute bottom-0 inset-x-0 z-20 pb-4 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none pr-3 sm:pr-4">
        <div className="pointer-events-auto">
          <OmniPromptInput
            isSticky={true}
            onSubmit={(prompt, file) => sendMessage(prompt, file)}
            isLoading={isLoading}
            placeholder="Ask a follow-up question or attach another CV..."
          />
        </div>
      </div>
    </div>
  );
}
