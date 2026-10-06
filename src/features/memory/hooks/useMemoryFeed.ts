"use client";

import { useQuery } from "@tanstack/react-query";
import { CareerMemory } from "../types/memory.types";

export interface MemoryStats {
  total: number;
  active: number;
  stored: number;
  pending: number;
  failed: number;
  lastStoredAt: string | null;
}

export interface WalrusMetadata {
  network: string;
  explorerUrl: string;
  agentId: string | null;
  namespace: string;
  relayerUrl: string;
}

export interface MemoryFeed {
  memories: CareerMemory[];
  stats: MemoryStats;
  walrus: WalrusMetadata;
}

export const memoryFeedQueryKey = ["memory-feed"] as const;

async function fetchMemoryFeed(): Promise<MemoryFeed> {
  const res = await fetch("/api/memory");
  if (!res.ok) {
    throw new Error("Could not load career memories.");
  }
  return (await res.json()) as MemoryFeed;
}

/**
 * One cached source for /api/memory. Several memory cards can render on the
 * same page, and this keeps them on a single request instead of one each.
 */
export function useMemoryFeed() {
  return useQuery({
    queryKey: memoryFeedQueryKey,
    queryFn: fetchMemoryFeed,
    staleTime: 30 * 1000,
  });
}
