"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export interface Character {
  level: number;
  xp: number;
  class: string;
  avatar_url: string;
}

export function useCharacter() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchCharacter = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/character", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCharacter(data);
        } else {
            setCharacter(null);
        }
      } catch (error) {
        console.error("Failed to fetch character data:", error);
        setCharacter(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacter();
  }, [isAuthenticated, token]);

  return { character, isLoading };
} 