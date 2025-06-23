import { NextResponse } from "next/server";

const GO_API_URL = process.env.GO_API_URL || "http://localhost:8080/api/v1";
if (!GO_API_URL) {
  throw new Error("Missing GO_API_URL environment variable");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  try {
    const res = await fetch(`${GO_API_URL}/journal/${documentId}`);
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({
          id: documentId,
          title: "Untitled",
          content: `<h1>Untitled</h1><p>Start your story here.</p>`,
        });
      }
      throw new Error(`Backend fetch failed with status: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `Failed to fetch document ${documentId} from Go backend:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/journal/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Backend update failed with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `Failed to update document ${documentId} in Go backend:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
} 