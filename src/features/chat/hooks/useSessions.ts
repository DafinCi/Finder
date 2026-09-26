"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChatSession } from "@/types/chat";
import { chatService } from "../services/chat.service";
import { toast } from "sonner";

export interface GroupedSessions {
  today: ChatSession[];
  yesterday: ChatSession[];
  previous7Days: ChatSession[];
  older: ChatSession[];
}

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const refreshSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await chatService.getSessions();
      setSessions(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch sessions on mount and silently re-sync on route navigation
  useEffect(() => {
    let cancelled = false;

    chatService
      .getSessions()
      .then((data) => {
        if (!cancelled) {
          setSessions(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Real-time synchronization via custom event bus
  useEffect(() => {
    const handleSessionsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action?: "create" | "update" | "delete" | "refresh";
        session?: ChatSession;
        sessionId?: string;
      }>;

      if (!customEvent.detail) return;

      const { action, session, sessionId } = customEvent.detail;

      if (action === "create" && session) {
        setSessions((prev) => {
          if (prev.some((s) => s.id === session.id)) return prev;
          return [session, ...prev];
        });
        chatService
          .getSessions()
          .then((data) => setSessions(data))
          .catch(() => {});
      } else if (action === "update" && session) {
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id ? session : s)),
        );
        chatService
          .getSessions()
          .then((data) => setSessions(data))
          .catch(() => {});
      } else if (action === "delete" && sessionId) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else if (action === "refresh") {
        chatService
          .getSessions()
          .then((data) => setSessions(data))
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
  }, []);

  const renameSession = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    // Optimistically update local session list
    const previous = [...sessions];
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s)),
    );

    try {
      await chatService.updateSessionTitle(id, trimmed);
      toast.success("Session renamed");
    } catch (err) {
      console.error("Failed to rename session:", err);
      setSessions(previous);
      toast.error("Couldn't rename session", {
        description: (err as Error).message,
      });
    }
  };

  const deleteSession = async (id: string) => {
    if (deletingId) return; // Prevent concurrent multiple clicks
    setDeletingId(id);

    const previous = [...sessions];
    setSessions((prev) => prev.filter((s) => s.id !== id));

    try {
      await chatService.deleteSession(id);
      toast.success("Chat session deleted");

      // If user deletes the session they are currently viewing, navigate to home (new chat)
      if (pathname === `/c/${id}`) {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      setSessions(previous);
      toast.error("Failed to delete session", {
        description:
          (err as Error).message || "An error occurred while deleting.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const groupedSessions = useMemo<GroupedSessions>(() => {
    const now = new Date();
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previous7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    sessions.forEach((session) => {
      const date = new Date(session.updated_at || session.created_at);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        today.push(session);
      } else if (diffDays === 1) {
        yesterday.push(session);
      } else if (diffDays <= 7) {
        previous7Days.push(session);
      } else {
        older.push(session);
      }
    });

    return { today, yesterday, previous7Days, older };
  }, [sessions]);

  return {
    sessions,
    groupedSessions,
    isLoading,
    error,
    deletingId,
    refreshSessions,
    renameSession,
    deleteSession,
  };
}
