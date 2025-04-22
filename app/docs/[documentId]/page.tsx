import { DocumentEditor } from "@/components/document-editor"
import { Sidebar } from "@/components/sidebar"

export default function DocumentPage({ params }: { params: { documentId: string } }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeDocumentId={params.documentId} />
      <main className="flex-1 overflow-auto">
        <DocumentEditor documentId={params.documentId} />
      </main>
    </div>
  )
}

