"use client";

import React, { use } from "react";
import Link from "next/link";
import { Plus, Bot, AlertCircle } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useChat } from "@/features/chat/hooks/useChat";
import ChatTimeline from "@/features/chat/components/ChatTimeline";
import OmniPromptInput from "@/features/chat/components/OmniPromptInput";

export default function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { collapsed } = useSidebar();
  const { session, messages, isLoading, thinkingStatus, error, sendMessage } =
    useChat(id);

  const handleAskAboutJob = (jobTitle: string, company: string) => {
    sendMessage(
      `Can you break down the ${jobTitle} position at ${company}? Based on my resume profile, what are my key competitive advantages and what technical interview questions should I prepare for?`,
      null,
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Session Topbar */}
      <div
        className={`h-14 border-b border-border/60 flex items-center justify-between bg-card/20 shrink-0 transition-all duration-200 ${
          collapsed ? "pl-14 pr-4 md:pr-6" : "px-4 md:px-6"
        }`}
      >
        {/* Session Title without decorative icon */}
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">
            {session?.title || "Career Workspace"}
          </h2>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-secondary text-muted-foreground border border-border">
            Groq gpt-oss-120b
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

      {/* Error Banner */}
      {error && (
        <div className="m-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Chat Scrollable Stream */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3">
            <Bot className="w-8 h-8 opacity-40" />
            <p className="text-sm font-medium">
              No messages in this session yet.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Ask follow-up questions about your career, interview prep, or job
              opportunities.
            </p>
          </div>
        )}

        <ChatTimeline
          messages={messages}
          isLoading={isLoading}
          thinkingStatus={thinkingStatus}
          onAskAboutJob={handleAskAboutJob}
        />
      </div>

      {/* Sticky Bottom Prompt Omnibar with Ambient Bottom Fade */}
      <div className="relative shrink-0 pb-4 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <OmniPromptInput
          isSticky={true}
          onSubmit={(prompt, file) => sendMessage(prompt, file)}
          isLoading={isLoading}
          placeholder="Ask follow-up career questions or attach another document..."
        />
      </div>
    </div>
  );
}
