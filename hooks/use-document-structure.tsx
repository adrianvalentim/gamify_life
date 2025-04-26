"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  name: string;
}

interface Folder {
  id: string;
  name: string;
  documents: Document[];
  subfolders?: Folder[];
}

interface DocumentStructure {
  rootDocuments: Document[];
  folders: Folder[];
}

export function useDocumentStructure() {
  const router = useRouter();
  const [structure, setStructure] = useState<DocumentStructure>({
    rootDocuments: [],
    folders: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStructure = useCallback(async () => {
    try {
      // Don't set loading to true if already fetching
      // setIsLoading(true);
      setError(null);
      const response = await fetch("/api/documents/structure");
      if (!response.ok) {
        throw new Error("Failed to fetch document structure");
      }
      const data = await response.json();
      setStructure(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true); // Set loading only on initial mount fetch
    fetchStructure();
  }, [fetchStructure]);

  // Renamed for clarity
  const revalidateStructure = useCallback(() => {
    // Fetch the latest structure from the server
    fetchStructure();
    // Ask Next.js to refresh server components and update cache
    router.refresh();
  }, [fetchStructure, router]);

  return {
    structure,
    isLoading,
    error,
    revalidateStructure, // Expose revalidation function
  };
} 