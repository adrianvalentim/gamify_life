"use client";

import useSWR from 'swr';
import { useAuthStore } from "@/stores/auth-store";

export type QuestStatus = "in_progress" | "completed";

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: QuestStatus;
  experienceReward: number;
  createdAt: string;
  updatedAt: string;
}

const fetcher = async ([url, token]: [string, string | null]) => {
  if (!token) {
    throw new Error("Not authorized");
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    const errorData = await res.text();
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};

export function useQuests() {
  const { token, isAuthenticated } = useAuthStore();
  
  const { data, error, isLoading } = useSWR<Quest[]>(
    isAuthenticated ? ["/api/quests", token] : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
      revalidateOnMount: true,
    }
  );

  return {
    quests: data ?? [],
    isLoading,
    error,
  };
} 