"use client";

import useSWR from 'swr';
import { Quest } from './use-quests';

interface QuestDetails {
  lore: string;
  rewards: string;
}

const fetcher = async (url: string, quest: Quest) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: quest.title,
      description: quest.description,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    const error = new Error(errorData.detail || 'Failed to generate quest details.');
    throw error;
  }

  return res.json();
};

export function useQuestDetails(quest: Quest | null) {
  const { data, error, isLoading } = useSWR<QuestDetails>(
    quest ? [`/api/quest-details`, quest] : null,
    ([url, q]: [string, Quest]) => fetcher(url, q),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    details: data,
    isLoading,
    error,
  };
} 