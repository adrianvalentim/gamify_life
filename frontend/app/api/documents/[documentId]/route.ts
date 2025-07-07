import { NextRequest, NextResponse } from "next/server";

const GO_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const url = new URL(request.url);
  const documentId = url.pathname.split("/").pop();

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is missing" },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${GO_API_URL}/api/v1/journal/${documentId}`, {
      headers: { Authorization: authorization },
    });
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
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const url = new URL(request.url);
  const documentId = url.pathname.split("/").pop();

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is missing" },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/api/v1/journal/${documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const url = new URL(request.url);
  const documentId = url.pathname.split("/").pop();

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is missing" },
      { status: 400 }
    );
  }
  
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const res = await fetch(`${GO_API_URL}/api/v1/journal/${documentId}`, {
      method: "DELETE",
      headers: {
        Authorization: authorization,
      },
    });

    if (!res.ok) {
      throw new Error(`Backend delete failed with status: ${res.status}`);
    }

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `Failed to delete document ${documentId} from Go backend:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 