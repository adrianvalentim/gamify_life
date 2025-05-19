import { NextResponse } from "next/server";
import { addDocumentToStore } from "@/lib/mock-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate input (add proper validation in real app)
    const { title, folderId } = body;
    
    const newDocumentId = `doc-${Date.now()}`; 
    const newDocument = { 
      id: newDocumentId, 
      name: title || "Untitled" 
    };

    // Add to our shared in-memory store
    addDocumentToStore(newDocument, folderId === "root" ? undefined : folderId);
    
    return NextResponse.json(
      { 
        success: true, 
        document: { ...newDocument, folderId } // Return folderId for consistency if needed
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create document" },
      { status: 500 }
    );
  }
} 