import { NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/folders`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error:", errorText);
      throw new Error(`Backend folder creation failed with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
} 