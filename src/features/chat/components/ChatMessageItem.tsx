"use client";

import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Brain,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/types/chat";
import { Button } from "@/components/ui/button";
import CandidateSummaryCard from "@/features/ai-analysis/components/CandidateSummaryCard";
import JobMatchCarousel from "@/features/ai-analysis/components/JobMatchCarousel";
import ChatMarkdown from "./ChatMarkdown";
import ActionProposalCard from "./ActionProposalCard";
import ChatCommandCard from "./ChatCommandCard";
import MemoryRecallChip from "./MemoryRecallChip";

interface ChatMessageItemProps {
  message: ChatMessage;
  onAskAboutJob?: (jobTitle: string, company: string) => void;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export default function ChatMessageItem({
  message,
  onAskAboutJob,
  isFirstInGroup = true,
  isLastInGroup = true,
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
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

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

  const reinforceUsedMemories = async () => {
    const memories = message.metadata?.memory_recall?.memories ?? [];
    if (memories.length === 0) return;

    try {
      const res = await fetch("/api/memory/reinforce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memories: memories.map((memory) => ({
            id: memory.id ?? null,
            content: memory.content,
          })),
        }),
      });
      if (!res.ok) return;

      const data = await res.json().catch(() => ({}));
      if (data?.reinforced > 0) {
        toast.success("Thanks. Finder will weigh this context more strongly.");
      }
    } catch {
      // Reinforcement is best-effort and must never affect the answer itself.
    }
  };

  const handleSaveCorrection = async () => {
    const content = correctionText.trim();
    if (content.length < 3) {
      toast.error("Tell Finder what to remember, in a few words.");
      return;
    }

    setIsSavingCorrection(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "user_correction",
          content,
          confidence: "high",
          source: "user_correction",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save the correction.");
      }

      toast.success("Correction saved to your career memory", {
        description: "Future answers will use it.",
      });
      setShowCorrection(false);
      setCorrectionText("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const handleFeedback = async (type: "helpful" | "unhelpful") => {
    if (
      isStreaming ||
      message.id.startsWith("stream-") ||
      isSubmittingFeedback
    ) {
      return;
    }

    const previousFeedback = feedback;
    const nextFeedback = feedback === type ? null : type;

    // Optimistic UI: Update visual state immediately for instant feedback
    setFeedback(nextFeedback);
    setIsSubmittingFeedback(true);

    try {
      const res = await fetch(`/api/chat/message/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: nextFeedback }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update feedback");
      }

      if (nextFeedback === "unhelpful") {
        setShowCorrection(true);
      } else if (nextFeedback === "helpful") {
        void reinforceUsedMemories();
      }
    } catch {
      // Rollback to previous state on failure
      setFeedback(previousFeedback);
      toast.error("Failed to record feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isUser) {
    return (
      <div
        className={`flex justify-end animate-in fade-in duration-200 ${
          isFirstInGroup ? "mt-4 sm:mt-5" : "mt-1.5"
        }`}
      >
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-2xl space-y-1.5">
          {/* Attachment Preview Badge */}
          {attachment && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/80 border border-border text-xs text-foreground font-medium shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-xs">{attachment.name}</span>
            </div>
          )}

          {/* User message text bubble: Slush-violet primary surface with newline preservation */}
          {message.content && (
            <div className="px-4 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm sm:text-[15px] font-sans leading-relaxed whitespace-pre-wrap break-words shadow-2xs">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message (Neutral surface with deliberate AI evaluation actions)
  return (
    <div
      className={`group relative animate-in fade-in duration-300 ${
        isFirstInGroup ? "mt-5 sm:mt-6" : "mt-2"
      }`}
    >
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

        {/* Slash command result: /remember, /help */}
        {message.metadata?.chat_command && (
          <ChatCommandCard command={message.metadata.chat_command} />
        )}

        {/* Memory recall trace: shows which memories shaped this answer */}
        {message.metadata?.memory_recall &&
          (message.metadata.memory_recall.count > 0 ||
            message.metadata.memory_recall.stateless) && (
            <div className="flex items-center gap-1.5 py-1">
              <MemoryRecallChip recall={message.metadata.memory_recall} />
            </div>
          )}

        {/* Career Memory Saved Badge */}
        {message.metadata?.memory_updated && (
          <div className="flex items-center gap-1.5 py-1 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-secondary border border-border text-secondary-foreground font-medium text-[11px]">
              <Brain className="w-3.5 h-3.5 text-muted-foreground" />
              Saved to your career memory
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
              disabled={isStreaming || message.id.startsWith("stream-")}
              aria-label="Mark response as helpful"
              aria-busy={isSubmittingFeedback}
              title="Helpful response"
              className={`p-1.5 rounded-sm text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
              disabled={isStreaming || message.id.startsWith("stream-")}
              aria-label="Mark response as unhelpful"
              aria-busy={isSubmittingFeedback}
              title="Unhelpful response"
              className={`p-1.5 rounded-sm text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                feedback === "unhelpful"
                  ? "text-slush-ember bg-slush-ember/10 border border-slush-ember/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {showCorrection && (
          <div className="rounded-sm border border-border bg-secondary/30 p-3 space-y-2">
            <label
              htmlFor={`correction-${message.id}`}
              className="block text-xs font-medium text-foreground"
            >
              What should Finder remember instead?
            </label>
            <textarea
              id={`correction-${message.id}`}
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Example: I prefer hybrid roles in Jakarta, not remote."
              className="w-full resize-none rounded-sm border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSaveCorrection}
                disabled={isSavingCorrection}
              >
                {isSavingCorrection ? "Saving" : "Save correction"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowCorrection(false);
                  setCorrectionText("");
                }}
                disabled={isSavingCorrection}
              >
                Skip
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
