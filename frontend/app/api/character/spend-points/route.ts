import { NextRequest, NextResponse } from "next/server";

const GO_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const backendResponse = await fetch(
      `${GO_API_URL}/api/v1/characters/me/spend-points`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify(body),
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `Backend error spending points: ${backendResponse.status} ${errorText}`
      );
      return NextResponse.json(
        { message: "Failed to spend points in backend" },
        { status: backendResponse.status }
      );
    }

    const updatedCharacter = await backendResponse.json();
    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error("Failed to spend attribute points", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 