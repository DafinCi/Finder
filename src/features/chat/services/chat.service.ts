import { ChatSession, ChatMessage, SendMessagePayload } from "@/types/chat";

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
    return true;
  },

  async sendMessage(
    payload: SendMessagePayload,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const res = await fetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to process chat message.");
    }
    return res.json();
  },

  async uploadAndAnalyzeResume(
    file: File,
    sessionId: string,
    onProgress?: (status: string) => void,
  ) {
    onProgress?.("Uploading and parsing document...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);

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
        rawText: uploadData.rawText,
        sessionId,
      }),
    });
    if (!analyzeRes.ok) {
      const err = await analyzeRes.json().catch(() => ({}));
      throw new Error(err.error || "Failed to evaluate candidate profile.");
    }
    return analyzeRes.json();
  },
};
