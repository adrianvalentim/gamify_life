import { NextRequest, NextResponse } from "next/server";

const GO_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(
      `${GO_API_URL}/api/v1/characters/me`,
      {
        headers: {
          Authorization: authorization,
        },
        cache: "no-store", // Ensure we get the latest data
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `Backend error: ${backendResponse.status} ${errorText}`
      );
      // A 404 from the backend probably means the user exists but has no character
      if (backendResponse.status === 404) {
        return NextResponse.json(
          { message: "Character not found for this user" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: "Failed to fetch character from backend" },
        { status: backendResponse.status }
      );
    }

    const characterData = await backendResponse.json();
    return NextResponse.json(characterData);
  } catch (error) {
    console.error("Failed to fetch character data", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 