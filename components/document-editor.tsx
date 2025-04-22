"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Heading from "@tiptap/extension-heading"
import TextAlign from "@tiptap/extension-text-align"
import { CharacterDisplay } from "@/components/character-display"
import { EditorToolbar } from "@/components/editor-toolbar"
import { QuestPanel } from "@/components/quest-panel"
import { useXpSystem } from "@/hooks/use-xp-system"
import { QuestInfoPanel } from "@/components/quest-info-panel"
import { cn } from "@/lib/utils"

interface DocumentEditorProps {
  documentId?: string
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [showQuestPanel, setShowQuestPanel] = useState(false)
  const [showQuestInfo, setShowQuestInfo] = useState(false)
  const { addXp, characterLevel, characterXp, nextLevelXp } = useXpSystem()

  // Mock document data - in a real app this would come from a database
  const [documentTitle, setDocumentTitle] = useState(documentId ? "My Fantasy Document" : "Welcome to Notes & Dragons")

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "What is the title?"
          }
          return "Begin your adventure..."
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: documentId
      ? "<h1>My Fantasy Document</h1><p>Once upon a time in a land far away...</p>"
      : "<h1>Welcome to Notes & Dragons</h1><p>Start writing to earn experience and level up your character!</p><p>Select quests from the quest panel to earn bonus rewards.</p><p>Click anywhere on this page to start writing your own adventure!</p>",
    onUpdate: ({ editor }) => {
      // Count words and add XP
      const text = editor.getText()
      const wordCount = text.split(/\s+/).filter(Boolean).length

      // Add XP for new words (this is a simple implementation)
      // In a real app, you'd track the previous word count and only add XP for new words
      if (wordCount > 0) {
        addXp(1)
      }
    },
    editorProps: {
      attributes: {
        class: "outline-none prose prose-lg max-w-none",
      },
    },
  })

  // Handle click anywhere in the editor area to focus
  const handleEditorAreaClick = useCallback(
    (event: React.MouseEvent) => {
      if (!editor) return

      // Only handle clicks directly on the editor area, not on existing content
      if ((event.target as HTMLElement).classList.contains("editor-container")) {
        // Focus the editor at the end
        editor.commands.focus("end")
      }
    },
    [editor],
  )

  return (
    <div className="relative h-full flex">
      {/* Main content area that shrinks when quest info is shown */}
      <div
        className={cn(
          "flex-grow transition-all duration-300 ease-in-out relative",
          showQuestInfo ? "w-[calc(100%-350px)]" : "w-full",
        )}
      >
        {/* Character display in top right */}
        <div className="absolute top-4 right-4 z-10">
          <CharacterDisplay
            level={characterLevel}
            xp={characterXp}
            nextLevelXp={nextLevelXp}
            showQuestInfo={showQuestInfo}
            onToggleQuestInfo={() => setShowQuestInfo(!showQuestInfo)}
          />
        </div>

        {/* Document content */}
        <div className="editor-container h-full w-full px-8 py-16 cursor-text" onClick={handleEditorAreaClick}>
          <div className="max-w-4xl mx-auto">
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full text-3xl font-bold mb-4 bg-transparent border-none outline-none focus:ring-0"
              placeholder="Document Title"
            />

            <EditorToolbar editor={editor} onToggleQuests={() => setShowQuestPanel(!showQuestPanel)} />

            <div className="mt-8 relative min-h-[calc(100vh-200px)]">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Quest panel */}
        {showQuestPanel && <QuestPanel onClose={() => setShowQuestPanel(false)} />}
      </div>

      {/* Quest info section that slides in from the right */}
      {showQuestInfo && (
        <QuestInfoPanel
          onClose={() => setShowQuestInfo(false)}
          characterClass={characterLevel > 5 ? "mage" : "warrior"}
          level={characterLevel}
        />
      )}
    </div>
  )
}

