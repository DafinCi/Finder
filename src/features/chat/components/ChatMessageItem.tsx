"use client";

import React, { useState } from "react";
import { FileText, Copy, Check, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/types/chat";
import CandidateSummaryCard from "@/features/ai-analysis/components/CandidateSummaryCard";
import JobMatchCarousel from "@/features/ai-analysis/components/JobMatchCarousel";
import ChatMarkdown from "./ChatMarkdown";
import ActionProposalCard from "./ActionProposalCard";

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
  const [feedback, setFeedback] = useState<"helpful" | "unhelpful" | null>(
    (message.metadata?.feedback as "helpful" | "unhelpful") || null,
  );

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

  const handleFeedback = (type: "helpful" | "unhelpful") => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    if (newFeedback === "helpful") {
      toast.success("Feedback recorded: helpful response");
    } else if (newFeedback === "unhelpful") {
      toast.info("Feedback recorded: unhelpful response");
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-4 animate-in fade-in duration-200">
        <div className="flex flex-col items-end max-w-xl space-y-2">
          {/* Attachment Preview Badge */}
          {attachment && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/80 border border-border text-xs text-foreground font-medium shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-xs">{attachment.name}</span>
            </div>
          )}

          {/* User message text bubble: Slush-violet identity surface */}
          {message.content && (
            <div className="px-4 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-sans leading-relaxed shadow-2xs">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message (Neutral surface with deliberate AI evaluation actions)
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

        {/* Action Proposal Card */}
        {message.metadata?.action_proposal && (
          <ActionProposalCard
            proposal={message.metadata.action_proposal}
            messageId={message.id}
          />
        )}

        {/* Sovereign Memory Updated Badge */}
        {message.metadata?.memory_updated && (
          <div className="flex items-center gap-1.5 py-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Sovereign Career Memory Updated
            </span>
          </div>
        )}

        {/* Bottom AI Actions: Evaluation & Utility */}
        {!isStreaming && message.content && (
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy response to clipboard"
              title="Copy response"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slush-mint" />
                  <span className="text-[11px] text-slush-mint font-medium">
                    Copied
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFeedback("helpful")}
              aria-label="Mark response as helpful"
              title="Helpful response"
              className={`p-1.5 rounded-sm text-xs transition-colors cursor-pointer ${
                feedback === "helpful"
                  ? "text-slush-mint bg-slush-mint/10 border border-slush-mint/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleFeedback("unhelpful")}
              aria-label="Mark response as unhelpful"
              title="Unhelpful response"
              className={`p-1.5 rounded-sm text-xs transition-colors cursor-pointer ${
                feedback === "unhelpful"
                  ? "text-slush-ember bg-slush-ember/10 border border-slush-ember/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
