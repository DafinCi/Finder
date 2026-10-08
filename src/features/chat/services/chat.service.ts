import {
  ChatSession,
  ChatMessage,
  SendMessagePayload,
  ActionProposalData,
  ChatCommandResult,
  MemoryRecallMetadata,
} from "@/types/chat";

export interface ToolStreamingEvent {
  type: "tool_start" | "tool_end";
  tool: string;
  label?: string;
  success?: boolean;
}

export interface UploadAnalyzeOutcome {
  resumeId: string | null;
  status: "completed" | "needs_review" | "rejected";
  message: string;
  classification?: {
    documentType: string;
    confidence: number;
    reason: string;
  };
  result?: unknown;
}

export interface SendMessageCallbacks {
  onToken?: (token: string) => void;
  onToolEvent?: (event: ToolStreamingEvent) => void;
  onActionProposal?: (proposal: ActionProposalData) => void;
  onChatCommand?: (command: ChatCommandResult) => void;
  onMemoryUpdated?: (status?: string) => void;
  onMemoryRecall?: (recall: MemoryRecallMetadata) => void;
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
    memoryStatus?: string | null;
    memoryRecall?: MemoryRecallMetadata | null;
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
    const cbOnChatCommand =
      typeof callbacks === "object" ? callbacks?.onChatCommand : undefined;
    const cbOnMemoryUpdated =
      typeof callbacks === "object" ? callbacks?.onMemoryUpdated : undefined;
    const cbOnMemoryRecall =
      typeof callbacks === "object" ? callbacks?.onMemoryRecall : undefined;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let userMessage: ChatMessage | null = null;
    let assistantMessage: ChatMessage | null = null;
    let actionProposal: ActionProposalData | null = null;
    let memoryUpdated = false;
    let memoryStatus: string | null = null;
    let memoryRecall: MemoryRecallMetadata | null = null;
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

          if (parsed.type === "chat_command" && cbOnChatCommand) {
            cbOnChatCommand(parsed.command as ChatCommandResult);
          }

          if (parsed.type === "memory_updated" && cbOnMemoryUpdated) {
            cbOnMemoryUpdated(parsed.status);
            memoryStatus = parsed.status ?? "pending";
          }

          if (parsed.type === "memory_recall" && parsed.recall) {
            memoryRecall = parsed.recall as MemoryRecallMetadata;
            cbOnMemoryRecall?.(memoryRecall);
          }

          if (parsed.done) {
            userMessage = parsed.userMessage;
            assistantMessage = parsed.assistantMessage;
            actionProposal = parsed.actionProposal || null;
            memoryUpdated = Boolean(parsed.memoryUpdated);
            memoryStatus = parsed.memoryStatus ?? null;
            memoryRecall = parsed.memoryRecall ?? memoryRecall;
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

    return {
      userMessage,
      assistantMessage,
      actionProposal,
      memoryUpdated,
      memoryStatus,
      memoryRecall,
    };
  },

  async uploadAndAnalyzeResume(
    file: File,
    sessionId: string,
    onProgress?: (status: string) => void,
    prompt?: string,
  ): Promise<UploadAnalyzeOutcome> {
    onProgress?.("Uploading and reading your document");
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
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      if (uploadData?.code === "NOT_A_RESUME") {
        return {
          resumeId: uploadData.resumeId ?? null,
          status: "rejected",
          message:
            uploadData.error ||
            "This document doesn't look like a resume, so we didn't save it.",
        };
      }
      throw new Error(uploadData.error || "Failed to upload resume file.");
    }

    onProgress?.("Checking the document and extracting your profile");
    const analyzeRes = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeId: uploadData.resumeId,
        sessionId,
      }),
    });
    const analyzeData = await analyzeRes.json().catch(() => ({}));
    if (!analyzeRes.ok) {
      if (analyzeData?.code === "NEEDS_REVIEW") {
        return {
          resumeId: uploadData.resumeId,
          status: "needs_review",
          message:
            analyzeData.message ||
            analyzeData.error ||
            "This document doesn't look like a resume.",
          classification: analyzeData.classification,
        };
      }
      throw new Error(
        analyzeData.error || "Failed to evaluate candidate profile.",
      );
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-sessions-changed", {
          detail: { action: "refresh" },
        }),
      );
    }

    return {
      resumeId: uploadData.resumeId,
      status: "completed",
      message: "Analysis complete",
      result: analyzeData,
    };
  },

  async analyzeResume(
    resumeId: string,
    sessionId?: string,
    options?: { allowNonResume?: boolean },
  ) {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeId,
        sessionId,
        allowNonResume: options?.allowNonResume,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to analyze resume.");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-sessions-changed", {
          detail: { action: "refresh" },
        }),
      );
    }
    return data;
  },

  async rejectResume(resumeId: string) {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, decision: "reject" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to remove the document.");
    }
    return data;
  },

  async applyResumeToProfile(resumeId: string) {
    const res = await fetch("/api/profile/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data.error || "Failed to save the resume to your career profile.",
      );
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-sessions-changed", {
          detail: { action: "refresh" },
        }),
      );
    }
    return data;
  },
};
