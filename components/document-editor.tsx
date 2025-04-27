"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
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
import { useDocumentStructure } from "@/hooks/use-document-structure"
import { useLanguage } from "@/hooks/use-language"

interface DocumentEditorProps {
  documentId?: string
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [showQuestPanel, setShowQuestPanel] = useState(false)
  const [showQuestInfo, setShowQuestInfo] = useState(false)
  const { addXp, characterLevel, characterXp, nextLevelXp } = useXpSystem()
  const { structure } = useDocumentStructure()
  const { translations } = useLanguage()

  // State for title - will be updated by useEffect
  const [documentTitle, setDocumentTitle] = useState("")
  // State to track if content has been loaded for the current ID
  const [contentLoaded, setContentLoaded] = useState(false); 

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return translations.whatIsTitle
          }
          return translations.beginAdventure
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    // Start with empty content, will be set by useEffect
    content: '', 
    onUpdate: ({ editor }) => {
      // Count words and add XP
      const text = editor.getText()
      const wordCount = text.split(/\s+/).filter(Boolean).length

      // Add XP for new words (this is a simple implementation)
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

  // Effect to load document title and content when documentId changes
  useEffect(() => {
    if (!editor) {
      return; // Editor not ready yet
    }

    let title = "Welcome to Gamify Journal";
    let content = "<h1>Welcome to Gamify Journal</h1><p>Start writing to earn experience and level up your character!</p><p>Select quests from the quest panel to earn bonus rewards.</p><p>Click anywhere on this page to start writing your own adventure!</p>";
    setContentLoaded(false); // Reset content loaded flag

    if (documentId) {
      // Find the document in the structure (mock)
      let foundDoc = structure.rootDocuments.find(d => d.id === documentId);
      if (!foundDoc) {
        structure.folders.forEach(folder => {
          const findInFolder = (f: any): any => {
            let doc = f.documents?.find((d: any) => d.id === documentId);
            if (doc) return doc;
            return f.subfolders?.map(findInFolder).find((d: any) => d);
          }
          if (!foundDoc) foundDoc = findInFolder(folder);
        });
      }

      // Use the found document name or a default if newly created and not yet in structure
      title = foundDoc ? foundDoc.name : "Untitled Page";
      // In a real app, you would fetch content based on documentId here
      // For mock purposes, we use a placeholder or previously known content
      content = `<h1>${title}</h1><p>Content for document ${documentId} goes here...</p>`;
    }

    setDocumentTitle(title);
    // Check if editor is ready and content needs updating
    if (editor.isEditable) { 
      editor.commands.setContent(content, false); // Set content, don't emit update
      setContentLoaded(true); // Mark content as loaded for this ID
    }

  // Rerun when documentId, editor instance, or structure changes
  }, [documentId, editor, structure]);

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
            {/* Use key prop to force re-render of input when title changes, ensuring value updates */}
            <input
              key={documentId || 'welcome'} // Add key prop
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full text-3xl font-bold mb-4 bg-transparent border-none outline-none focus:ring-0"
              placeholder="Document Title"
            />

            <EditorToolbar editor={editor} onToggleQuests={() => setShowQuestPanel(!showQuestPanel)} />

            <div className="mt-8 relative min-h-[calc(100vh-200px)]">
              {/* Only render EditorContent when editor is ready and content is loaded */}
              {editor && contentLoaded && <EditorContent editor={editor} />} 
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

