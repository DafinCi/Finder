"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatSession, ChatMessage } from "@/types/chat";
import { chatService } from "../services/chat.service";

export function useChat(sessionId?: string) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await chatService.getSessionDetail(sessionId);
      setSession(data.session);
      setMessages(data.messages);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const sendMessage = async (prompt: string, file?: File | null) => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      setError(null);

      // If file attached, upload and analyze
      if (file) {
        setThinkingStatus("Uploading and parsing resume document...");

        // Optimistically add user message
        const tempUserMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          session_id: sessionId,
          role: "user",
          content:
            prompt ||
            "Please analyze my resume and find matching career opportunities.",
          metadata: {
            attachment: {
              name: file.name,
              size: file.size,
              type: file.type,
            },
          },
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);

        await chatService.uploadAndAnalyzeResume(file, sessionId, (status) => {
          setThinkingStatus(status);
        });

        // Refetch complete session messages to sync with database
        const updatedData = await chatService.getSessionDetail(sessionId);
        setMessages(updatedData.messages);
      } else {
        // Text-only message
        setThinkingStatus("Finder AI is drafting a response...");

        // Optimistically add user message
        const tempUserMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          session_id: sessionId,
          role: "user",
          content: prompt,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);

        const res = await chatService.sendMessage({
          session_id: sessionId,
          content: prompt,
        });

        // Replace optimistic user message with persisted one and append assistant message
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          res.userMessage,
          res.assistantMessage,
        ]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      setThinkingStatus("");
    }
  };

  return {
    session,
    messages,
    isLoading,
    thinkingStatus,
    error,
    sendMessage,
    refreshSession: fetchSessionData,
  };
}
