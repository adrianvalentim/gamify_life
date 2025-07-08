"use client";

import { useAuthStore } from "@/stores/auth-store";
import useSWR from "swr";

export interface Character {
  id: string;
  user_id: string;
  name: string;
  class: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  avatar_url: string;
}

const fetcher = async (url: string, token: string | null) => {
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Return null if character is not found, SWR will cache this
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch character data: ${response.status} ${errorText}`,
    );
  }

  return response.json();
};

export function useCharacter() {
  const { token, isAuthenticated } = useAuthStore();
  
  const {
    data: character,
    error,
    isLoading,
  } = useSWR<Character | null>(
    isAuthenticated ? "/api/character" : null,
    (url: string) => fetcher(url, token),
    {
      refreshInterval: 3000, // Refresh every 3 seconds
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    },
  );
  
  return { character, isLoading, isError: !!error };
} 