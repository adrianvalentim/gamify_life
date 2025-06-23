import { NextResponse } from "next/server";

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080/api/v1';

export async function GET() {
  try {
    const userID = "user-123"; // Hardcoded for now
    const res = await fetch(`${GO_API_URL}/journal/user/${userID}`);
    
    if (!res.ok) {
      throw new Error(`Backend fetch failed with status: ${res.status}`);
    }
    
    const documents = await res.json();
    
    // The frontend expects a specific structure. We'll adapt the response.
    // For now, we'll place all documents at the root.
    const structure = {
      rootDocuments: documents.map((doc: any) => ({
        id: doc.id,
        name: doc.title,
      })),
      folders: [], // Folders are not implemented yet
    };

    return NextResponse.json(structure);
  } catch (error) {
    console.error("Error fetching document structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch document structure" },
      { status: 500 }
    );
  }
} 