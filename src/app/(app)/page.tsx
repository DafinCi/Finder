"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import OmniPromptInput from "@/features/chat/components/OmniPromptInput";
import ChatActionPills from "@/features/chat/components/ChatActionPills";
import { chatService } from "@/features/chat/services/chat.service";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleSubmit = async (prompt: string, file?: File | null) => {
    try {
      setIsLoading(true);

      if (file) {
        setStatusText("Initializing career session...");
        const session = await chatService.createSession({
          title: `CV Analysis: ${file.name.replace(/\.pdf$/i, "")}`,
          attachment: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
          initial_message:
            prompt ||
            "Please analyze my resume and recommend matching career opportunities.",
        });

        setStatusText("Extracting profile & matching curated jobs via Groq...");
        await chatService.uploadAndAnalyzeResume(file, session.id, (status) => {
          setStatusText(status);
        });

        toast.success("Resume processed successfully!", {
          description: "Redirecting to your interactive career workspace...",
        });

        router.push(`/c/${session.id}`);
      } else {
        setStatusText("Starting conversation...");
        // Create session without initial_message to prevent duplicate user messages
        const session = await chatService.createSession({
          title: prompt.slice(0, 35) + (prompt.length > 35 ? "..." : ""),
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
      toast.error("Unable to start career session", {
        description:
          err.message ||
          "Please ensure your Supabase database permissions are updated and try again.",
      });
      setIsLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full px-4 py-8 animate-in fade-in duration-300 relative">
      <div className="w-full max-w-2xl text-center space-y-7 my-auto">
        {/* Hero Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
            Where do you want to take your career today?
          </h1>
        </div>

        {/* Omni-Prompt Input */}
        <div>
          <OmniPromptInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Ask a career question or drag & drop your CV (PDF) here..."
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
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
          <span>
            Clean text-based PDF supported. Fast, private & sovereign career
            workspace.
          </span>
        </div>
      </div>
    </div>
  );
}
