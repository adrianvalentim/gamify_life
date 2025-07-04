import { NextResponse } from "next/server";

const GO_API_URL = process.env.GO_API_URL || "http://localhost:8080/api/v1";

export async function PUT(
  request: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/folders/${params.folderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error:", errorText);
      throw new Error(`Backend folder update failed: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to update folder ${params.folderId}:`, error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}

export async function DELETE(
    request: Request,
    { params }: { params: { folderId: string } }
) {
    try {
        const res = await fetch(`${GO_API_URL}/folders/${params.folderId}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Backend error:", errorText);
            throw new Error(`Backend folder deletion failed: ${res.status}`);
        }
        
        return new Response(null, { status: 204 }); // No Content
    } catch (error) {
        console.error(`Failed to delete folder ${params.folderId}:`, error);
        return NextResponse.json(
            { error: "Failed to delete folder" },
            { status: 500 }
        );
    }
} 