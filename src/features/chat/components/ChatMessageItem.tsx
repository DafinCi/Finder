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
        {/* Model Identifier Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Finder
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              Groq gpt-oss-120b
            </span>
          </div>

          {/* Quick Copy Action Button */}
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy message"
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Rich Markdown Text Content */}
        {message.content && <ChatMarkdown content={message.content} />}

        {/* Embedded Candidate Summary Card */}
        {analysis && <CandidateSummaryCard analysis={analysis} />}

        {/* Embedded Matched Jobs Carousel */}
        {jobMatches && jobMatches.length > 0 && (
          <JobMatchCarousel jobs={jobMatches} onAskAboutJob={onAskAboutJob} />
        )}
      </div>
    </div>
  );
}
