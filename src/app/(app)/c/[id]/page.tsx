"use client";

import React, { use } from "react";
import Link from "next/link";
import { Plus, Bot } from "lucide-react";
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
  } = useChat(id);

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
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {session?.title || "Career Workspace"}
            </h2>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
              Career Copilot
            </span>
          </div>

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
            placeholder="Ask follow-up career questions or attach another document..."
          />
        </div>
      </div>
    </div>
  );
}
