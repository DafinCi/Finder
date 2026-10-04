import type { ChatMessage, ChatSession } from "@/types/chat";

export interface ConversationEvidenceInput {
  session: ChatSession | null;
  messages: ChatMessage[];
  memoryMode: "walrus" | "amnesia";
  exportedAt?: string;
}

function sourceLabel(source: string | undefined): string {
  if (source === "walrus") return "Walrus Mainnet";
  if (source === "cache") return "local cache";
  return "none";
}

/**
 * Builds a plain markdown transcript of a conversation, including the memory
 * trace of each answer. This is the artifact used for the before/after writeup.
 */
export function buildConversationEvidence({
  session,
  messages,
  memoryMode,
  exportedAt,
}: ConversationEvidenceInput): string {
  const timestamp = exportedAt ?? new Date().toISOString();
  const lines: string[] = [
    "# Finder conversation evidence",
    "",
    `Session: ${session?.title || "Untitled"}`,
    `Exported: ${timestamp}`,
    `Memory mode: ${
      memoryMode === "amnesia"
        ? "Amnesia (memory off)"
        : "Walrus Memory (memory on)"
    }`,
    "",
  ];

  for (const message of messages) {
    const speaker = message.role === "user" ? "User" : "Finder";
    lines.push(`## ${speaker}`, "", message.content || "(empty)", "");

    const recall = message.metadata?.memory_recall;
    if (recall && recall.stateless) {
      lines.push("Memory: off (Amnesia mode)", "");
    } else if (recall && recall.count > 0) {
      lines.push(
        `Memory used: ${recall.count} (${sourceLabel(recall.source)})`,
        "",
      );
      for (const item of recall.memories) {
        lines.push(`- ${item.content}`);
      }
      lines.push("");
    }

    if (message.metadata?.memory_updated) {
      lines.push("Memory updated: saved to career memory", "");
    }
  }

  return lines.join("\n").trim() + "\n";
}
