interface Document {
  id: string;
  name: string;
  content?: string;
}

interface Folder {
  id: string;
  name: string;
  documents: Document[];
  subfolders?: Folder[];
}

interface DocumentStructure {
  rootDocuments: Document[];
  folders: Folder[];
}

// In-memory store (simulates a database for development)
let store: DocumentStructure = {
  rootDocuments: [],
  folders: [
    {
      id: "folder-1",
      name: "Adventures",
      documents: [
        { id: "doc-1", name: "World Building", content: "<h1>World Building</h1><p>Initial content...</p>" },
        { id: "doc-2", name: "Character Lore", content: "<h1>Character Lore</h1><p>Initial content...</p>" },
      ],
      subfolders: [
        {
          id: "folder-1-1",
          name: "Quests",
          documents: [
            { id: "doc-3", name: "Main Quest", content: "<h1>Main Quest</h1><p>Initial content...</p>" },
            { id: "doc-4", name: "Side Quests", content: "<h1>Side Quests</h1><p>Initial content...</p>" },
          ],
        },
      ],
    },
    {
      id: "folder-2",
      name: "Journal",
      documents: [
        { id: "doc-5", name: "Daily Notes", content: "<h1>Daily Notes</h1><p>Initial content...</p>" },
        { id: "doc-6", name: "Ideas", content: "<h1>Ideas</h1><p>Initial content...</p>" },
      ],
    },
  ],
};

export const getDocumentStructure = (): DocumentStructure => {
  // Return a deep copy to prevent accidental mutation
  return JSON.parse(JSON.stringify(store));
};

export const addDocumentToStore = (document: Document, folderId?: string): void => {
  const newStore = getDocumentStructure(); // Get a fresh copy
  const docWithContent = { ...document, content: `<h1>${document.name}</h1><p>Start writing...</p>` }; // Add default content

  if (!folderId || folderId === 'root') {
    newStore.rootDocuments.push(docWithContent);
  } else {
    const updateFolder = (folders: Folder[]): boolean => {
      for (let i = 0; i < folders.length; i++) {
        if (folders[i].id === folderId) {
          // Ensure documents array exists
          if (!folders[i].documents) folders[i].documents = []; 
          folders[i].documents.push(docWithContent);
          return true;
        }
        if (folders[i].subfolders && updateFolder(folders[i].subfolders!)) {
          return true;
        }
      }
      return false;
    };
    updateFolder(newStore.folders);
  }
  store = newStore; // Update the central store
};

export const updateDocumentContentInStore = (documentId: string, content: string): boolean => {
  const newStore = getDocumentStructure(); // Get a fresh copy
  let updated = false;

  // Check root documents
  const rootDocIndex = newStore.rootDocuments.findIndex(doc => doc.id === documentId);
  if (rootDocIndex !== -1) {
    newStore.rootDocuments[rootDocIndex].content = content;
    updated = true;
  } else {
    // Check folders recursively
    const findAndUpdate = (folders: Folder[]): boolean => {
      for (let i = 0; i < folders.length; i++) {
        const docIndex = folders[i].documents?.findIndex(doc => doc.id === documentId);
        if (docIndex !== -1 && folders[i].documents) { // Check if documents array exists
          folders[i].documents[docIndex].content = content;
          return true; // Found and updated
        }
        if (folders[i].subfolders && findAndUpdate(folders[i].subfolders!)) {
          return true; // Found in subfolder
        }
      }
      return false; // Not found in this branch
    };
    updated = findAndUpdate(newStore.folders);
  }

  if (updated) {
    store = newStore; // Update the central store only if something changed
  }
  return updated;
}; 