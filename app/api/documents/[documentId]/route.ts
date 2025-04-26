import { NextResponse } from "next/server";
import { updateDocumentContentInStore } from "@/lib/mock-db";

interface RouteParams {
  params: {
    documentId: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { documentId } = params;
    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Update content in our shared in-memory store
    const updated = updateDocumentContentInStore(documentId, content);

    if (!updated) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Document updated" });

  } catch (error) {
    console.error(`Error updating document ${params?.documentId}:`, error);
    // Distinguish between JSON parsing errors and other errors
    if (error instanceof SyntaxError) { 
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update document" },
      { status: 500 }
    );
  }
} 