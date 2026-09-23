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

        await chatService.uploadAndAnalyzeResume(
          file,
          sessionId,
          (status) => {
            setThinkingStatus(status);
          },
          prompt,
        );

        // Refetch complete session messages to sync with database
        const updatedData = await chatService.getSessionDetail(sessionId);
        setMessages(updatedData.messages);
      } else {
        // Text-only message: assistant message bubble provides the streaming placeholder, so keep thinkingStatus empty
        setThinkingStatus("");

        // Optimistically add user message
        const tempUserMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          session_id: sessionId,
          role: "user",
          content: prompt,
          created_at: new Date().toISOString(),
        };

        const tempAssistantId = `stream-${Date.now()}`;
        const tempAssistantMsg: ChatMessage = {
          id: tempAssistantId,
          session_id: sessionId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

        const res = await chatService.sendMessage(
          {
            session_id: sessionId,
            content: prompt,
          },
          (token: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantId
                  ? { ...msg, content: msg.content + token }
                  : msg,
              ),
            );
          },
        );

        // Replace optimistic messages with persisted database records
        setMessages((prev) => [
          ...prev.filter(
            (m) => m.id !== tempUserMsg.id && m.id !== tempAssistantId,
          ),
          res.userMessage,
          res.assistantMessage,
        ]);
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      // Clean up unpersisted optimistic temp messages on error
      setMessages((prev) =>
        prev.filter(
          (m) => !m.id.startsWith("temp-") && !m.id.startsWith("stream-"),
        ),
      );
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
