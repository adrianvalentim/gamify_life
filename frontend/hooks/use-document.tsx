"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import { useLanguage } from '@/hooks/use-language';
import { Extension } from '@tiptap/core';
import { useDebouncedCallback } from 'use-debounce';
import { useAuthStore } from '@/stores/auth-store';

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

export const useDocument = (documentId?: string) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);
  const lastProcessedText = useRef<string>("");
  const { translations } = useLanguage();
  const { token } = useAuthStore();

  const createDocument = async (title?: string, folderId?: string): Promise<DocumentData | null> => {
    if (!token) return null;
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }: { node: any }) => node.type.name === 'heading' ? translations.whatIsTitle : translations.beginAdventure,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: "outline-none prose prose-lg max-w-none",
      },
    },
    onUpdate: ({ editor }: { editor: any }) => {
      const content = editor.getHTML();
      
      setDocument((prevDoc: Document | null) => {
        if (!prevDoc) return null;
        const newDoc = { ...prevDoc, content };
        debouncedSave(newDoc as Document);
        return newDoc as Document;
      });
    },
    immediatelyRender: false,
  }, [translations, documentId]);

  const debouncedSave = useDebouncedCallback(async (docToSave: Document) => {
    if (!docToSave || !token || !editor) return;

    const currentContent = editor.getHTML();
    const currentText = editor.getText();

    // Do nothing if the text content hasn't changed.
    if (currentText === lastProcessedText.current) {
      return;
    }

    let newTextForAI = "";
    // If the user is just appending text, send only the new part.
    if (currentText.startsWith(lastProcessedText.current)) {
      newTextForAI = currentText.substring(lastProcessedText.current.length);
    } else {
      // For more complex changes (editing in the middle), send the whole text.
      // This is a safe fallback to ensure the AI doesn't miss context.
      newTextForAI = currentText;
    }

    setSaving(true);

    try {
      const payload = {
        title: docToSave.title,
        content: currentContent, // Always save the full HTML content.
        new_text: newTextForAI,    // Send the new/relevant text to the AI.
      };

      await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // After a successful save, update the last processed text.
      lastProcessedText.current = currentText;

    } catch (error) {
      console.error("Failed to save document:", error);
    } finally {
      setSaving(false);
    }
  }, 2000);

  useEffect(() => {
    if (!documentId || !token) return;

    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
  }, [documentId, translations, token]);

  useEffect(() => {
    if (!editor || !document) return;

    const isSame = editor.getHTML() === document.content;
    if (isSame) return;
    
    editor.commands.setContent(document.content, false);
    // Initialize lastProcessedText once the editor has the document content.
    lastProcessedText.current = editor.getText();
  }, [editor, document]);

  const handleTitleChange = (newTitle: string) => {
    if (document) {
      const updatedDoc = { ...document, title: newTitle };
      setDocument(updatedDoc);
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