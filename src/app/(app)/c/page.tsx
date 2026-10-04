"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, ShieldCheck, Briefcase, X } from "lucide-react";
import { toast } from "sonner";
import OmniPromptInput from "@/features/chat/components/OmniPromptInput";
import ChatActionPills from "@/features/chat/components/ChatActionPills";
import { chatService } from "@/features/chat/services/chat.service";
import { generateSmartSessionTitle } from "@/features/chat/utils/title-generator";
import { useAgent } from "@/contexts/AgentContext";
import { jobsApi } from "@/features/jobs/services/jobs.api";

function AppChatHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramJobId = searchParams
    ? searchParams.get("job") || searchParams.get("jobId")
    : null;

  const { isAmnesiaMode } = useAgent();
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [activeJobContext, setActiveJobContext] = useState<{
    id: string;
    title: string;
    companyName: string;
  } | null>(null);

  useEffect(() => {
    if (!paramJobId) {
      setActiveJobContext(null);
      return;
    }

    let cancelled = false;
    jobsApi
      .getJobDetail(paramJobId)
      .then((detail) => {
        if (!cancelled && detail) {
          setActiveJobContext({
            id: detail.id,
            title: detail.title,
            companyName: detail.company_name,
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to load job context for chat:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [paramJobId]);

  const handleSubmit = async (prompt: string, file?: File | null) => {
    try {
      setIsLoading(true);

      if (file) {
        setStatusText("Initializing career session...");
        const session = await chatService.createSession({
          title: `CV analysis: ${file.name.replace(/\.pdf$/i, "")}`,
          attachment: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
          initial_message:
            prompt ||
            "Please analyze my resume and recommend matching career opportunities.",
        });

        setStatusText("Checking the document and extracting your profile");
        const outcome = await chatService.uploadAndAnalyzeResume(
          file,
          session.id,
          (status) => {
            setStatusText(status);
          },
        );

        if (outcome.status === "rejected") {
          toast.error("Resume not analyzed", {
            description: outcome.message,
          });
          return;
        }

        if (outcome.status === "needs_review") {
          toast.info("One quick check", {
            description: outcome.message,
          });
          router.push(`/c/${session.id}`);
          return;
        }

        toast.success("Resume analyzed", {
          description: "Opening your results.",
        });

        router.push(`/c/${session.id}`);
      } else {
        setStatusText("Starting conversation...");

        const effectivePrompt = activeJobContext
          ? `[Job Context: ${activeJobContext.title} at ${activeJobContext.companyName} (ID: ${activeJobContext.id})] ${prompt || `Can you analyze the ${activeJobContext.title} role at ${activeJobContext.companyName} against my profile?`}`
          : prompt;

        // Create session with clean AI-smart generated title
        const smartTitle = activeJobContext
          ? `Role: ${activeJobContext.title}`
          : generateSmartSessionTitle(prompt);

        const session = await chatService.createSession({
          title: smartTitle,
        });

        // Trigger first AI response (this inserts the single user message and creates the assistant response)
        await chatService.sendMessage({
          session_id: session.id,
          content: effectivePrompt,
          simulate_stateless: isAmnesiaMode,
        });

        const searchSuffix =
          typeof window !== "undefined" && window.location.search
            ? window.location.search
            : "";
        router.push(`/c/${session.id}${searchSuffix}`);
      }
    } catch (error) {
      console.error("Session initialization failed:", error);
      const err = error as Error;
      toast.error("Something went wrong", {
        description:
          err.message ||
          "Try again, or contact support if the problem continues.",
      });
      setIsLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full px-4 py-8 animate-in fade-in duration-300 relative overflow-y-auto custom-scrollbar chat-wallpaper">
      <div className="w-full max-w-4xl text-center space-y-7 my-auto">
        {/* Clean Action-Focused Greeting */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
            What can I help you explore today?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Ask about roles, analyze your resume, or practice interview
            questions.
          </p>
        </div>

        {/* Active Job Context Pill */}
        {activeJobContext && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/80 border border-border text-xs text-foreground font-medium animate-in fade-in slide-in-from-top-1">
            <Briefcase className="w-3.5 h-3.5 text-slush-mint" />
            <span>
              Discussing: <strong>{activeJobContext.title}</strong> at{" "}
              {activeJobContext.companyName}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveJobContext(null);
                router.replace("/c");
              }}
              className="text-muted-foreground hover:text-foreground ml-1 cursor-pointer"
              title="Clear job context"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Omni-Prompt Input */}
        <div>
          <OmniPromptInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder={
              activeJobContext
                ? `Ask about ${activeJobContext.title} at ${activeJobContext.companyName}...`
                : "Type a message"
            }
          />
        </div>

        {/* Quick Action Suggestions */}
        {!isLoading && !activeJobContext && (
          <ChatActionPills
            onSelectPrompt={(promptText) => handleSubmit(promptText)}
          />
        )}

        {/* Loading / Status State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse py-2">
            <Bot className="w-4 h-4 text-primary animate-spin" />
            <span>{statusText || "Processing request..."}</span>
          </div>
        )}

        {/* Trust & Privacy Footnote */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
          <ShieldCheck className="w-3.5 h-3.5 text-slush-mint/80" />
          <span>Text-based PDF only. Your data stays private.</span>
        </div>
      </div>
    </div>
  );
}

export default function AppChatHomePage() {
  return (
    <Suspense fallback={null}>
      <AppChatHomeContent />
    </Suspense>
  );
}
