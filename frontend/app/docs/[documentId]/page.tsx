import { DocumentEditor } from "@/components/document-editor"
import { Sidebar } from "@/components/sidebar"

export default async function DocumentPage({ params: { documentId } }: { params: { documentId: string } }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeDocumentId={documentId} />
      <main className="flex-1 overflow-auto">
        <DocumentEditor documentId={documentId} />
      </main>
    </div>
  )
}

