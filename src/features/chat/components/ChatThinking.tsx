import React from "react";

interface ChatThinkingProps {
  statusText?: string;
}

export default function ChatThinking({ statusText }: ChatThinkingProps) {
  return (
    <div className="my-6 animate-in fade-in duration-300 space-y-3">
      {/* Model Identifier Header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground tracking-tight">
          Finder
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
          AI Model
        </span>
      </div>

      {/* Thinking Animation & Status */}
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
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
  );
}
