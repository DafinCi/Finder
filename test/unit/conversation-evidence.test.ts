import { describe, it, expect } from "vitest";
import { buildConversationEvidence } from "@/features/chat/utils/conversation-evidence";
import type { ChatMessage, ChatSession } from "@/types/chat";

const session: ChatSession = {
  id: "s1",
  user_id: "u1",
  title: "Memory demo",
  created_at: "2026-10-04T00:00:00Z",
  updated_at: "2026-10-04T00:00:00Z",
};

describe("Conversation evidence export", () => {
  it("should include the memory trace for answers that used memory", () => {
    const messages: ChatMessage[] = [
      {
        id: "m1",
        session_id: "s1",
        role: "user",
        content: "What do you remember?",
        created_at: "2026-10-04T00:00:00Z",
      },
      {
        id: "m2",
        session_id: "s1",
        role: "assistant",
        content: "You prefer remote roles based in America.",
        created_at: "2026-10-04T00:00:01Z",
        metadata: {
          memory_recall: {
            source: "walrus",
            count: 1,
            memories: [
              {
                content: "Prefers remote roles based in America",
                category: "work_preference",
                blobId: "blob-1",
              },
            ],
          },
        },
      },
    ];

    const markdown = buildConversationEvidence({
      session,
      messages,
      memoryMode: "walrus",
      exportedAt: "2026-10-04T00:00:00Z",
    });

    expect(markdown).toContain("# Finder conversation evidence");
    expect(markdown).toContain("Memory mode: Walrus Memory (memory on)");
    expect(markdown).toContain("Memory used: 1 (Walrus Mainnet)");
    expect(markdown).toContain("Prefers remote roles based in America");
  });

  it("should mark an amnesia answer as memory off", () => {
    const messages: ChatMessage[] = [
      {
        id: "m1",
        session_id: "s1",
        role: "assistant",
        content: "I do not have your preferences yet.",
        created_at: "2026-10-04T00:00:01Z",
        metadata: {
          memory_recall: {
            source: "none",
            count: 0,
            stateless: true,
            memories: [],
          },
        },
      },
    ];

    const markdown = buildConversationEvidence({
      session,
      messages,
      memoryMode: "amnesia",
    });

    expect(markdown).toContain("Memory mode: Amnesia (memory off)");
    expect(markdown).toContain("Memory: off (Amnesia mode)");
  });
});
