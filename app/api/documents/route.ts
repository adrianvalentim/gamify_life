import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, folderId } = body;
    
    // In a real implementation, you would:
    // 1. Validate the input
    // 2. Create the document in your database using an ORM like Prisma
    // 3. Return the created document

    // For now, we'll mock the response
    const newDocumentId = `doc-${Date.now()}`; 
    
    return NextResponse.json(
      { 
        success: true, 
        document: { 
          id: newDocumentId, 
          name: title || "Untitled", 
          folderId 
        } 
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