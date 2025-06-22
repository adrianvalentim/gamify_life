"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import { useLanguage } from '@/hooks/use-language';
import { Extension } from '@tiptap/core';
import { useDebouncedCallback } from 'use-debounce';

interface DocumentData {
  id: string;
  title: string;
  content: string;
  folderId?: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
}

// Define the structure of the AI response
interface AIResponse {
  response: string;
}

// Custom Tiptap extension to handle the Enter key press
const EnterKeyHandler = Extension.create({
  name: 'enterKeyHandler',

  addOptions() {
    return {
      onEnter: (paragraph: string) => {},
    }
  },

  addKeyboardShortcuts() {
    return {
      'Enter': () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        const currentNode = $from.node($from.depth);

        if (currentNode.textContent) {
          this.options.onEnter(currentNode.textContent);
        }
        
        return false;
      },
    }
  },
});

export const useDocument = (documentId?: string) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);
  const { translations } = useLanguage();

  const createDocument = async (title?: string, folderId?: string): Promise<DocumentData | null> => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Untitled', folderId }),
      });
      if (!response.ok) throw new Error('Failed to create document');
      const newDoc = await response.json();
      return newDoc;
    } catch (error) {
      console.error('Error creating document:', error);
      return null;
    }
  };

  const navigateToDocument = (docId: string) => {
    router.push(`/docs/${docId}`);
  };

  const sendParagraphToAI = useCallback(async (paragraph: string) => {
    if (!paragraph.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/agent/update_character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraph }),
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(`AI service error: ${errorJson.detail || response.statusText}`);
      }

      const data: AIResponse = await response.json();
      console.log("AI Response:", data.response);
    } catch (error) {
      console.error("Failed to send paragraph to AI:", error);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => node.type.name === 'heading' ? translations.whatIsTitle : translations.beginAdventure,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      EnterKeyHandler.configure({ onEnter: sendParagraphToAI }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: "outline-none prose prose-lg max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const titleNode = editor.state.doc.firstChild;
      const title = titleNode ? titleNode.textContent : translations.untitledPage;
      
      setDocument(prevDoc => {
        const newDoc = { ...(prevDoc || { id: documentId! }), title, content };
        debouncedSave(newDoc as Document);
        return newDoc as Document;
      });
    }
  }, [translations, sendParagraphToAI, documentId]);

  const debouncedSave = useDebouncedCallback(async (docToSave: Document) => {
    if (!docToSave) return;
    setSaving(true);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docToSave),
      });
    } catch (error) {
      console.error("Failed to save document:", error);
    } finally {
      setSaving(false);
    }
  }, 2000);

  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (!res.ok) throw new Error('Failed to fetch document');
        const data: Document = await res.json();
        setDocument(data);
      } catch (error) {
        console.error(error);
        const title = translations.untitledPage;
        const content = `<h1>${title}</h1>`;
        setDocument({ id: documentId, title, content });
      }
    };
    
    fetchDocument();
  }, [documentId, translations]);

  useEffect(() => {
    if (!editor || !document || !editor.isEditable) {
      return;
    }
    const isSame = editor.getHTML() === document.content;
    if (isSame) {
      return;
    }
    editor.commands.setContent(document.content, false);
  }, [editor, document]);

  const handleTitleChange = (newTitle: string) => {
    if (document && editor) {
      const updatedDoc = { ...document, title: newTitle };
      setDocument(updatedDoc);
      
      const from = 1; 
      const to = editor.state.doc.firstChild?.nodeSize ?? from;

      editor.chain().focus().command(({ tr }) => {
        tr.insertText(newTitle, from, to);
        return true;
      }).run();

      debouncedSave(updatedDoc);
    }
  };

  return {
    createDocument,
    navigateToDocument,
    isLoading,
    error,
    editor,
    document,
    saving,
    handleTitleChange
  };
}; 