import { NextResponse } from "next/server";

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080/api/v1';

// A function to build the folder structure recursively
function buildStructure(folders: any[], documents: any[]) {
    const folderMap = new Map(folders.map(f => [f.id, { ...f, documents: [], subfolders: [] }]));
    const rootFolders: any[] = [];

    // Place documents into their respective folders
    for (const doc of documents) {
        if (doc.folder_id && folderMap.has(doc.folder_id)) {
            folderMap.get(doc.folder_id).documents.push({ id: doc.id, name: doc.title });
        }
    }

    // Build the folder hierarchy
    for (const folder of folderMap.values()) {
        if (folder.parent_id && folderMap.has(folder.parent_id)) {
            folderMap.get(folder.parent_id).subfolders.push(folder);
        } else {
            rootFolders.push(folder);
        }
    }

    // Get documents that are at the root (no folder_id)
    const rootDocuments = documents
        .filter(doc => !doc.folder_id)
        .map(doc => ({ id: doc.id, name: doc.title }));
    
    return { rootDocuments, folders: rootFolders };
}

export async function GET() {
  try {
    const userID = "user-123"; // Hardcoded for now
    const [docsRes, foldersRes] = await Promise.all([
        fetch(`${GO_API_URL}/journal/user/${userID}`),
        fetch(`${GO_API_URL}/folders/user/${userID}`)
    ]);
    
    if (!docsRes.ok) {
      throw new Error(`Backend document fetch failed with status: ${docsRes.status}`);
    }
    if (!foldersRes.ok) {
        throw new Error(`Backend folder fetch failed with status: ${foldersRes.status}`);
    }
    
    const documents = await docsRes.json();
    const folders = await foldersRes.json() || []; // handle case where no folders exist
        
    const structure = buildStructure(folders, documents);

    return NextResponse.json(structure);
  } catch (error) {
    console.error("Error fetching document structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch document structure" },
      { status: 500 }
    );
  }
} 