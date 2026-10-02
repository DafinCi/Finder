"use client";

import React, { use, useEffect } from "react";
import { ChevronRight, Database } from "lucide-react";
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
    openDrawerWithTab,
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
    <div className="flex-1 relative flex flex-col h-full w-full overflow-hidden bg-background chat-wallpaper">
      {/* Session Topbar: Placed outside scroll container so scrollbar never cuts through */}
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
        className={`z-20 h-16 border-b border-border/80 bg-sidebar flex items-center justify-between shrink-0 select-none group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer ${
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
            showStatusIndicator={isLoading}
            indicatorStatus="typing"
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

        {/* Right Actions: Walrus Memory Badge Button + Chevron */}
        <div className="flex items-center gap-2.5 pr-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDrawerWithTab("memory");
            }}
            title="Inspect Walrus Mainnet Memories"
            className="min-h-[36px] px-2.5 py-1 rounded-sm bg-secondary hover:bg-secondary/80 text-foreground border border-border inline-flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-medium"
          >
            <Database className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Walrus Memory</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Mainnet
            </span>
          </button>

          <div className="text-muted-foreground/60">
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </header>

      {/* Full-Height Scrollable Stream */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar relative">
        {/* Chat Content Body */}
        <div className="min-h-full flex flex-col justify-between">
          {/* Initial Loading Skeleton */}
          {isInitialLoading ? (
            <ChatTimelineSkeleton />
          ) : messages.length === 0 ? (
            /* Empty State */
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
      <div className="absolute bottom-0 inset-x-0 z-20 pb-3 md:pb-4 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none px-3 sm:px-4">
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
