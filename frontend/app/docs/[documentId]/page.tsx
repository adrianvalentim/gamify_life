"use client";

import { DocumentEditor } from "@/components/document-editor"
import { Sidebar } from "@/components/sidebar"
import { useAuthStore } from "@/stores/auth-store";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DocumentPage() {
  const params = useParams<{ documentId: string }>();
  const documentId = params.documentId;
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeDocumentId={documentId} />
      <main className="flex-1 overflow-auto">
        <DocumentEditor documentId={documentId} />
      </main>
    </div>
  )
}

