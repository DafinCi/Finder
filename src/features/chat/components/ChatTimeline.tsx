"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import ChatMessageItem from "./ChatMessageItem";
import ChatThinking from "./ChatThinking";

interface ChatTimelineProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  thinkingStatus?: string;
  onAskAboutJob?: (jobTitle: string, company: string) => void;
}

export default function ChatTimeline({
  messages,
  isLoading = false,
  thinkingStatus,
  onAskAboutJob,
}: ChatTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-4">
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          onAskAboutJob={onAskAboutJob}
        />
      ))}

      {isLoading && <ChatThinking statusText={thinkingStatus} />}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
