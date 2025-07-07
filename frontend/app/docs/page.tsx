import { WelcomePage } from "@/components/welcome-page"
import { Sidebar } from "@/components/sidebar"

export default function DocsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <WelcomePage />
      </main>
    </div>
  )
}

