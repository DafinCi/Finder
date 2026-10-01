"use client";

import React, { use, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAgent } from "@/contexts/AgentContext";
import { useChat } from "@/features/chat/hooks/useChat";
import ChatTimeline from "@/features/chat/components/ChatTimeline";
import OmniPromptInput from "@/features/chat/components/OmniPromptInput";
import ChatTimelineSkeleton from "@/features/chat/skeletons/ChatTimelineSkeleton";
import BotAvatar from "@/components/ui/BotAvatar";
import AgentInfoDrawer from "@/features/chat/components/AgentInfoDrawer";

export default function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { collapsed } = useSidebar();
  const {
    getAgentName,
    setActiveSessionId,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
  } = useAgent();

  // Set active session in agent context
  useEffect(() => {
    setActiveSessionId(id);
    return () => setActiveSessionId(null);
  }, [id, setActiveSessionId]);

  const currentAgentName = getAgentName(id);

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
    <div className="flex-1 relative h-full w-full overflow-hidden bg-background chat-wallpaper">
      {/* Full-Height Scrollable Stream */}
      <div className="h-full w-full overflow-y-auto custom-scrollbar">
        {/* Session Topbar: Solid background header, full-bar click opens agent info drawer */}
        <header
          role="button"
          tabIndex={0}
          onClick={openDrawer}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDrawer();
            }
          }}
          className={`sticky top-0 z-20 h-16 border-b border-border bg-card flex items-center justify-between shrink-0 select-none group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer ${
            collapsed ? "pl-14 pr-4 md:pr-6" : "px-4 md:px-6"
          }`}
          title="Click anywhere for agent details"
          aria-label="Click anywhere for agent details"
        >
          {/* Left: Bot Avatar + Agent Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <BotAvatar
              name={currentAgentName}
              seed={id}
              size="md"
              showStatusIndicator
              indicatorStatus={isLoading ? "typing" : "online"}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-semibold text-foreground truncate leading-tight">
                {currentAgentName}
              </span>
              <span className="text-xs sm:text-sm truncate leading-tight mt-0.5">
                {isLoading ? (
                  <span className="text-primary font-medium inline-flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span>{thinkingStatus || "Thinking..."}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Click here for agent info
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Right: Subtle Chevron Indicator */}
          <div className="text-muted-foreground/60 pr-1">
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
        </header>

        {/* Chat Content Body */}
        <div className="min-h-[calc(100%-4rem)] flex flex-col justify-between">
          {/* Initial Loading Skeleton */}
          {isInitialLoading ? (
            <ChatTimelineSkeleton />
          ) : messages.length === 0 ? (
            /* Empty State: Only shown if definitely not loading and no messages */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 my-auto text-muted-foreground space-y-2 min-h-[50vh] animate-in fade-in duration-200">
              <p className="text-sm font-medium text-foreground/80">
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
      <div className="absolute bottom-14 md:bottom-0 inset-x-0 z-20 pb-3 md:pb-4 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none pr-3 sm:pr-4">
        <div className="pointer-events-auto">
          <OmniPromptInput
            isSticky={true}
            onSubmit={(prompt, file) => sendMessage(prompt, file)}
            isLoading={isLoading}
            placeholder="Type a message"
          />
        </div>
      </div>

      {/* Agent Contact Info Right Drawer */}
      <AgentInfoDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        sessionId={id}
      />
    </div>
  );
}
