import { NextResponse } from "next/server";
import { getDocumentStructure } from "@/lib/mock-db";

// This is a mock implementation. In a real app, this would fetch from your database
export async function GET() {
  try {
    // Get the current structure from the shared store
    const structure = getDocumentStructure();
    return NextResponse.json(structure);
  } catch (error) {
    console.error("Error fetching document structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch document structure" },
      { status: 500 }
    );
  }
} 