"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ShieldCheck, Database } from "lucide-react";
import { toast } from "sonner";
import OmniPromptInput from "@/features/chat/components/OmniPromptInput";
import ChatActionPills from "@/features/chat/components/ChatActionPills";
import { chatService } from "@/features/chat/services/chat.service";
import { generateSmartSessionTitle } from "@/features/chat/utils/title-generator";

export default function AppChatHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

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

        setStatusText("Analyzing your profile and finding matching jobs...");
        await chatService.uploadAndAnalyzeResume(file, session.id, (status) => {
          setStatusText(status);
        });

        toast.success("CV analyzed", {
          description: "Opening your results...",
        });

        router.push(`/c/${session.id}`);
      } else {
        setStatusText("Starting conversation...");
        // Create session with clean AI-smart generated title
        const smartTitle = generateSmartSessionTitle(prompt);
        const session = await chatService.createSession({
          title: smartTitle,
        });

        // Trigger first AI response (this inserts the single user message and creates the assistant response)
        await chatService.sendMessage({
          session_id: session.id,
          content: prompt,
        });

        router.push(`/c/${session.id}`);
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

        {/* Omni-Prompt Input */}
        <div>
          <OmniPromptInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Type a message"
          />
        </div>

        {/* Quick Action Suggestions */}
        {!isLoading && (
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
