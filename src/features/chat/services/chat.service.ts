import {
  ChatSession,
  ChatMessage,
  SendMessagePayload,
  ActionProposalData,
} from "@/types/chat";

export interface ToolStreamingEvent {
  type: "tool_start" | "tool_end";
  tool: string;
  label?: string;
  success?: boolean;
}

export interface SendMessageCallbacks {
  onToken?: (token: string) => void;
  onToolEvent?: (event: ToolStreamingEvent) => void;
  onActionProposal?: (proposal: ActionProposalData) => void;
  onMemoryUpdated?: () => void;
}

export const chatService = {
  async getSessions(): Promise<ChatSession[]> {
    const res = await fetch("/api/chat/session");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load session history.");
    }
    const data = await res.json();
    return data.sessions || [];
  },

  async createSession(payload: {
    title?: string;
    resume_id?: string;
    initial_message?: string;
    attachment?: { name: string; size?: number; type?: string };
  }): Promise<ChatSession> {
    const res = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to initialize career chat session.");
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-sessions-changed", {
          detail: { action: "create", session: data.session },
        }),
      );
    }
    return data.session;
  },

  async updateSessionTitle(id: string, title: string): Promise<ChatSession> {
    const res = await fetch(`/api/chat/session/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Couldn't rename session.");
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-sessions-changed", {
          detail: { action: "update", session: data.session },
        }),
      );
    }
    return data.session;
  },

  async getSessionDetail(
    id: string,
  ): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    const res = await fetch(`/api/chat/session/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load conversation details.");
    }
    return res.json();
  },

  async deleteSession(id: string): Promise<boolean> {
    const res = await fetch(`/api/chat/session/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete session.");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-sessions-changed", {
          detail: { action: "delete", sessionId: id },
        }),
      );
    }
    return true;
  },

  async sendMessage(
    payload: SendMessagePayload,
    callbacks?: ((token: string) => void) | SendMessageCallbacks,
  ): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    actionProposal?: ActionProposalData | null;
    memoryUpdated?: boolean;
  }> {
    const res = await fetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to process chat message.");
    }

    if (!res.body) {
      throw new Error("Response body is not readable for streaming.");
    }

    const cbOnToken =
      typeof callbacks === "function" ? callbacks : callbacks?.onToken;
    const cbOnToolEvent =
      typeof callbacks === "object" ? callbacks?.onToolEvent : undefined;
    const cbOnActionProposal =
      typeof callbacks === "object" ? callbacks?.onActionProposal : undefined;
    const cbOnMemoryUpdated =
      typeof callbacks === "object" ? callbacks?.onMemoryUpdated : undefined;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let userMessage: ChatMessage | null = null;
    let assistantMessage: ChatMessage | null = null;
    let actionProposal: ActionProposalData | null = null;
    let memoryUpdated = false;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);

          if (parsed.token && cbOnToken) {
            cbOnToken(parsed.token);
          }

          if (
            (parsed.type === "tool_start" || parsed.type === "tool_end") &&
            cbOnToolEvent
          ) {
            cbOnToolEvent({
              type: parsed.type,
              tool: parsed.tool,
              label: parsed.label,
              success: parsed.success,
            });
          }

          if (parsed.type === "action_proposal" && cbOnActionProposal) {
            cbOnActionProposal(parsed.proposal);
          }

          if (parsed.type === "memory_updated" && cbOnMemoryUpdated) {
            cbOnMemoryUpdated();
          }

          if (parsed.done) {
            userMessage = parsed.userMessage;
            assistantMessage = parsed.assistantMessage;
            actionProposal = parsed.actionProposal || null;
            memoryUpdated = Boolean(parsed.memoryUpdated);
          }

          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
          if (
            (e as Error).message &&
            !(e as Error).message.includes("Unexpected end of JSON")
          ) {
            throw e;
          }
        }
      }
    }

    if (!assistantMessage || !userMessage) {
      throw new Error("Conversation stream finished unexpectedly.");
    }

    return { userMessage, assistantMessage, actionProposal, memoryUpdated };
  },

  async uploadAndAnalyzeResume(
    file: File,
    sessionId: string,
    onProgress?: (status: string) => void,
    prompt?: string,
  ) {
    onProgress?.("Uploading and parsing document...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    if (prompt) {
      formData.append("prompt", prompt);
    }

    const uploadRes = await fetch("/api/upload-resume", {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload resume file.");
    }
    const uploadData = await uploadRes.json();

    onProgress?.("Analyzing profile & discovering matched roles via Groq...");
    const analyzeRes = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeId: uploadData.resumeId,
        sessionId,
      }),
    });
    if (!analyzeRes.ok) {
      const err = await analyzeRes.json().catch(() => ({}));
      throw new Error(err.error || "Failed to evaluate candidate profile.");
    }
    const result = await analyzeRes.json();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-sessions-changed", {
          detail: { action: "refresh" },
        }),
      );
    }
    return result;
  },
};
