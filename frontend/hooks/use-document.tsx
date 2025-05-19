"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentData {
  id: string;
  name: string;
  folderId?: string;
}

export function useDocument() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDocument = async (title?: string, folderId?: string): Promise<DocumentData | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || "Untitled",
          folderId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create document");
      }
      
      // Refresh the page to show updated document list
      router.refresh();
      
      return data.document;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToDocument = (documentId: string) => {
    router.push(`/docs/${documentId}`);
  };

  return {
    createDocument,
    navigateToDocument,
    isLoading,
    error
  };
} 