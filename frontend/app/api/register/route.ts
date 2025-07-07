import { NextRequest, NextResponse } from "next/server";

const GO_API_URL = process.env.GO_API_URL || "http://localhost:8080/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const goResponse = await fetch(`${GO_API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!goResponse.ok) {
      const errorData = await goResponse.json();
      return NextResponse.json(
        { error: errorData.error || "Registration failed" },
        { status: goResponse.status }
      );
    }

    const data = await goResponse.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Registration proxying failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 