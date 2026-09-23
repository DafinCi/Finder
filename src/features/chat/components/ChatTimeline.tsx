"use client";

import React, { useEffect, useRef } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import ChatMessageItem from "./ChatMessageItem";
import ChatThinking from "./ChatThinking";

interface ChatTimelineProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  thinkingStatus?: string;
  error?: string | null;
  onRetry?: () => void;
  onAskAboutJob?: (jobTitle: string, company: string) => void;
}

export default function ChatTimeline({
  messages,
  isLoading = false,
  thinkingStatus,
  error,
  onRetry,
  onAskAboutJob,
}: ChatTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    const scrollContainer = bottomRef.current?.closest(".overflow-y-auto");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-busy={isLoading}
      className="w-full max-w-3xl mx-auto px-4 py-6 space-y-4"
    >
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          onAskAboutJob={onAskAboutJob}
        />
      ))}

      {isLoading && thinkingStatus ? (
        <ChatThinking statusText={thinkingStatus} />
      ) : null}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="border border-destructive/20 bg-destructive/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 font-semibold transition-colors cursor-pointer w-fit"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom spacer ensures messages and actions clear the floating bottom omnibar */}
      <div
        ref={bottomRef}
        className="h-36 sm:h-40 shrink-0"
        aria-hidden="true"
      />
    </div>
  );
}
