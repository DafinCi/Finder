"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatSession, ChatMessage } from "@/types/chat";
import { chatService } from "../services/chat.service";

export function useChat(sessionId?: string) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    sessionId,
  );
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(
    Boolean(sessionId),
  );

  // Synchronize initial loading when sessionId changes across route navigation
  if (currentSessionId !== sessionId) {
    setCurrentSessionId(sessionId);
    setIsInitialLoading(Boolean(sessionId));
  }

  const [thinkingStatus, setThinkingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [failedSubmission, setFailedSubmission] = useState<{
    prompt: string;
    file?: File;
  } | null>(null);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsInitialLoading(true);
      setError(null);
      const data = await chatService.getSessionDetail(sessionId);
      setSession(data.session);
      setMessages(data.messages);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsInitialLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    chatService
      .getSessionDetail(sessionId)
      .then((data) => {
        if (!cancelled) {
          setSession(data.session);
          setMessages(data.messages);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Synchronize session details in real-time when title is updated or refreshed
  useEffect(() => {
    if (!sessionId) return;

    const handleSessionsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action?: "create" | "update" | "delete" | "refresh";
        session?: ChatSession;
        sessionId?: string;
      }>;

      if (!customEvent.detail) return;

      const { action, session: updatedSession } = customEvent.detail;

      if (
        action === "update" &&
        updatedSession &&
        updatedSession.id === sessionId
      ) {
        setSession(updatedSession);
      } else if (action === "refresh") {
        chatService
          .getSessionDetail(sessionId)
          .then((data) => {
            setSession(data.session);
          })
          .catch(() => {});
      }
    };

    window.addEventListener("chat-sessions-changed", handleSessionsChanged);
    return () => {
      window.removeEventListener(
        "chat-sessions-changed",
        handleSessionsChanged,
      );
    };
  }, [sessionId]);

  const updateTitle = async (newTitle: string) => {
    if (!sessionId) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    const previous = session;
    if (session) {
      setSession({ ...session, title: trimmed });
    }

    try {
      const updated = await chatService.updateSessionTitle(sessionId, trimmed);
      setSession(updated);
    } catch (err) {
      setSession(previous);
      throw err;
    }
  };

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
        setFailedSubmission(null);
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      setFailedSubmission({ prompt, file: file || undefined });
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

  const retryLastMessage = () => {
    if (failedSubmission) {
      sendMessage(failedSubmission.prompt, failedSubmission.file);
    }
  };

  return {
    session,
    messages,
    isLoading,
    isInitialLoading,
    thinkingStatus,
    error,
    failedPrompt: failedSubmission?.prompt ?? null,
    canRetry: failedSubmission !== null,
    sendMessage,
    retryLastMessage,
    updateTitle,
    refreshSession: fetchSessionData,
  };
}
