import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // In a real app, you'd get the user ID from the session/token
  const userId = "user-123"; // Using the hardcoded seed user for now

  try {
    const backendResponse = await fetch(
      `http://localhost:8080/api/v1/characters/user/${userId}`,
      {
        cache: "no-store", // Ensure we get the latest data
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `Backend error: ${backendResponse.status} ${errorText}`
      );
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