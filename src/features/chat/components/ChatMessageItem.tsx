"use client";

import React, { useState } from "react";
import { FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/types/chat";
import CandidateSummaryCard from "@/features/ai-analysis/components/CandidateSummaryCard";
import JobMatchCarousel from "@/features/ai-analysis/components/JobMatchCarousel";
import ChatMarkdown from "./ChatMarkdown";

interface ChatMessageItemProps {
  message: ChatMessage;
  onAskAboutJob?: (jobTitle: string, company: string) => void;
}

export default function ChatMessageItem({
  message,
  onAskAboutJob,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const attachment = message.metadata?.attachment;
  const analysis = message.metadata?.analysis;
  const jobMatches = message.metadata?.job_matches;
  const isStreaming = message.id.startsWith("stream-");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-4 animate-in fade-in duration-200">
        <div className="flex flex-col items-end max-w-xl space-y-2">
          {/* Attachment Preview Badge */}
          {attachment && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border text-xs text-foreground font-medium shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-xs">{attachment.name}</span>
            </div>
          )}

          {/* User message text bubble */}
          {message.content && (
            <div className="px-4 py-2.5 rounded-2xl bg-secondary/80 text-foreground text-sm font-sans leading-relaxed border border-border/50 shadow-2xs">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message (Clean, avatar-free, industry-standard editorial style)
  return (
    <div className="group relative my-6 animate-in fade-in duration-300">
      <div className="space-y-3">
        {/* Rich Markdown Text Content */}
        {message.content ? (
          <ChatMarkdown content={message.content} />
        ) : !analysis && (!jobMatches || jobMatches.length === 0) ? (
          <div className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse [animation-delay:300ms]" />
          </div>
        ) : null}

        {/* Embedded Candidate Summary Card */}
        {analysis && <CandidateSummaryCard analysis={analysis} />}

        {/* Embedded Matched Jobs Carousel */}
        {jobMatches && jobMatches.length > 0 && (
          <JobMatchCarousel jobs={jobMatches} onAskAboutJob={onAskAboutJob} />
        )}

        {/* Bottom Action: Always visible Quick Copy Button once response is fully rendered */}
        {!isStreaming && message.content && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy response to clipboard"
              title="Copy response"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 focus:bg-secondary/70 focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-500 font-medium">
                    Copied
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
