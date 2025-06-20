"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { Extension } from "@tiptap/core"
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

// Define the structure of the AI response
interface AIResponse {
  response: string;
}

// Custom Tiptap extension to handle the Enter key press
const EnterKeyHandler = Extension.create({
  name: 'enterKeyHandler',

  addOptions() {
    return {
      onEnter: () => {},
    }
  },

  addKeyboardShortcuts() {
    return {
      'Enter': () => {
        console.log("Enter key pressed, handler fired!");

        const { state } = this.editor
        const { selection } = state
        const { $from } = selection
        
        // Get the node (paragraph) the cursor is currently in
        const currentNode = $from.node($from.depth)
        
        console.log("Current node content:", currentNode.textContent);

        // If the node has text, trigger the onEnter callback
        if (currentNode.textContent) {
          this.options.onEnter(currentNode.textContent)
        }
        
        // Return false to let the default Enter key behavior run (i.e., create a new line)
        return false
      },
    }
  },
})

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

  // Function to send paragraph to the AI service, wrapped in useCallback
  const sendParagraphToAI = useCallback(async (paragraph: string) => {
    if (!paragraph.trim()) {
      console.log("Skipping empty paragraph.");
      return;
    }

    console.log("Sending to AI:", paragraph);
    try {
      const response = await fetch("http://localhost:8000/agent/update_character", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paragraph: paragraph }),
      });

      if (!response.ok) {
        // Try to get a more detailed error from the response body
        let errorDetail = `AI service returned an error: ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson.detail) {
            errorDetail = `AI service error: ${errorJson.detail}`;
          }
        } catch (jsonError) {
          // The body wasn't JSON or something went wrong, stick to the status text
        }
        throw new Error(errorDetail);
      }

      const data: AIResponse = await response.json();
      console.log("AI Response:", data.response);
      // Here you could update the UI, grant XP, etc. based on the response
    } catch (error) {
      console.error("Failed to send paragraph to AI:", error);
    }
  }, []); // Empty dependency array as this function doesn't depend on component state

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
      // Add our custom extension to handle the Enter key
      EnterKeyHandler.configure({
        onEnter: sendParagraphToAI,
      }),
    ],
    // Start with empty content, will be set by useEffect
    content: '',
    editorProps: {
      attributes: {
        class: "outline-none prose prose-lg max-w-none",
      },
    },
  }, [translations, sendParagraphToAI]) // Add sendParagraphToAI to dependency array

  // Effect to load document title and content when documentId changes
  useEffect(() => {
    if (!editor) {
      return; // Editor not ready yet
    }

    let title = `${translations.welcomeTo} Gamify Journal`;
    let content = `<h1>${translations.welcomeTo} Gamify Journal</h1><p>${translations.startWriting}</p><p>${translations.selectQuests}</p><p>${translations.clickAnywhere}</p>`;
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
      title = foundDoc ? foundDoc.name : translations.untitledPage;
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
  }, [documentId, editor, structure, translations]);

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
              key={`${documentId || 'welcome'}-${translations.language}`} // Add language to key to force re-render
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full text-3xl font-bold mb-4 bg-transparent border-none outline-none focus:ring-0"
              placeholder={translations.title}
            />

            <EditorToolbar editor={editor} onToggleQuests={() => setShowQuestPanel(!showQuestPanel)} />

            <div className="mt-8 relative min-h-[calc(100vh-200px)]">
              {/* Only render EditorContent when editor is ready and content is loaded */}
              {editor && contentLoaded && (
                <EditorContent 
                  editor={editor} 
                  key={`editor-${translations.language}`} // Add key to force re-render when language changes
                />
              )} 
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

