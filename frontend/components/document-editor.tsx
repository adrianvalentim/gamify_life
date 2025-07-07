"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { EditorContent } from "@tiptap/react"
import { CharacterDisplay } from "@/components/character-display"
import { EditorToolbar } from "@/components/editor-toolbar"
import { QuestPanel } from "@/components/quest-panel"
import { QuestInfoPanel } from "@/components/quest-info-panel"
import { cn } from "@/lib/utils"
import { useDocument } from "@/hooks/use-document"
import { useLanguage } from "@/hooks/use-language"
import { useCharacter } from "@/hooks/use-character"

interface DocumentEditorProps {
  documentId: string
}

const getNextLevelXp = (level: number) => {
  return level * 100
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [showQuestPanel, setShowQuestPanel] = useState(false)
  const [showQuestInfo, setShowQuestInfo] = useState(false)
  const { character, isLoading: isCharacterLoading } = useCharacter()
  const { translations } = useLanguage()
  const { editor, document, saving, handleTitleChange } = useDocument(documentId)

  const handleEditorAreaClick = useCallback(
    (event: React.MouseEvent) => {
      if (!editor) return

      if ((event.target as HTMLElement).classList.contains("editor-container")) {
        editor.commands.focus("end")
      }
    },
    [editor],
  )

  if (!editor || !document || isCharacterLoading) {
    return <div>Loading...</div>
  }

  if (!character) {
    return <div>Could not load character data.</div>
  }

  const nextLevelXp = getNextLevelXp(character.level)

  return (
    <div className="relative h-full flex">
      {/* Main content area */}
      <div
        className={cn(
          "flex-grow transition-all duration-300 ease-in-out relative",
          showQuestInfo ? "w-[calc(100%-350px)]" : "w-full",
        )}
      >
        {/* Character display and saving status */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-4">
          {saving && <div className="text-muted-foreground text-sm">Saving...</div>}
          <CharacterDisplay
            level={character.level}
            xp={character.xp}
            nextLevelXp={nextLevelXp}
            characterClass={character.class}
            avatarUrl={character.avatar_url}
            showQuestInfo={showQuestInfo}
            onToggleQuestInfo={() => setShowQuestInfo(!showQuestInfo)}
          />
        </div>

        {/* Document content */}
        <div className="editor-container h-full w-full px-8 py-16 cursor-text" onClick={handleEditorAreaClick}>
          <div className="max-w-4xl mx-auto">
            <input
              type="text"
              value={document.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-3xl font-bold mb-4 bg-transparent border-none outline-none focus:ring-0"
              placeholder={translations.title}
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

      {/* Quest info panel */}
      {showQuestInfo && (
        <div className="w-[350px] flex-shrink-0">
          <QuestInfoPanel
            onClose={() => setShowQuestInfo(false)}
          />
        </div>
      )}
    </div>
  )
}

