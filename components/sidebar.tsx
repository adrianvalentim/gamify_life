"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderClosed,
  FolderOpen,
  Home,
  Plus,
  Search,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeDocumentId?: string
}

export function Sidebar({ activeDocumentId }: SidebarProps) {
  const pathname = usePathname()
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "folder-1": true,
  })

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  // Mock data - in a real app this would come from a database
  const folders = [
    {
      id: "folder-1",
      name: "Adventures",
      documents: [
        { id: "doc-1", name: "World Building" },
        { id: "doc-2", name: "Character Lore" },
      ],
      subfolders: [
        {
          id: "folder-1-1",
          name: "Quests",
          documents: [
            { id: "doc-3", name: "Main Quest" },
            { id: "doc-4", name: "Side Quests" },
          ],
        },
      ],
    },
    {
      id: "folder-2",
      name: "Journal",
      documents: [
        { id: "doc-5", name: "Daily Notes" },
        { id: "doc-6", name: "Ideas" },
      ],
    },
  ]

  const renderFolder = (
    folder: {
      id: string
      name: string
      documents?: { id: string; name: string }[]
      subfolders?: any[]
    },
    depth = 0,
  ) => {
    const isExpanded = expandedFolders[folder.id]

    return (
      <div key={folder.id} className="space-y-1">
        <button
          onClick={() => toggleFolder(folder.id)}
          className={cn(
            "flex items-center w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
            depth > 0 && "ml-3",
          )}
        >
          <span className="mr-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <span className="mr-2">
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <FolderClosed className="h-4 w-4 text-amber-500" />
            )}
          </span>
          <span className="truncate">{folder.name}</span>
        </button>

        {isExpanded && (
          <div className="space-y-1">
            {folder.documents?.map((doc) => (
              <Link key={doc.id} href={`/docs/${doc.id}`}>
                <div
                  className={cn(
                    "flex items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
                    depth > 0 && "ml-3",
                    activeDocumentId === doc.id && "bg-accent",
                  )}
                >
                  <span className="ml-5 mr-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="truncate">{doc.name}</span>
                </div>
              </Link>
            ))}
            {folder.subfolders?.map((subfolder) => renderFolder(subfolder, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col h-full">
      <div className="p-4 border-b">
        <Link href="/docs">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors">
            <Home className="h-5 w-5" />
            <span className="font-semibold text-lg">Notes & Dragons</span>
          </div>
        </Link>
      </div>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 bg-background h-9 focus-visible:ring-amber-500"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">{folders.map((folder) => renderFolder(folder))}</div>
      </ScrollArea>
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

