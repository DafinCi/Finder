import React from "react";
import { Sparkles } from "lucide-react";

interface ChatThinkingProps {
  statusText?: string;
}

export default function ChatThinking({ statusText }: ChatThinkingProps) {
  return (
    <div className="flex items-start gap-3.5 my-3 animate-in fade-in duration-300">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        <Sparkles className="w-4 h-4 animate-spin text-primary" />
      </div>
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            Finder AI
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            Groq gpt-oss-120b
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
          </span>
          <span className="italic">
            {statusText || "Analyzing profile & generating response..."}
          </span>
        </div>
      </div>
    </div>
  );
}
