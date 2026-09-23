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

  const fetchSessions = useCallback(async () => {
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

  useEffect(() => {
    let cancelled = false;

    chatService
      .getSessions()
      .then((data) => {
        if (!cancelled) {
          setSessions(data);
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
  }, []);

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
    refreshSessions: fetchSessions,
    deleteSession,
  };
}
