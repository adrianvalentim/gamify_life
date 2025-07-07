import { NextRequest, NextResponse } from "next/server";

// Use the internal URL for server-side fetching, otherwise use the public one.
const backendUrl =
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
      `${backendUrl}/api/v1/quests/me`,
      {
        headers: {
          Authorization: authorization,
        },
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `Backend error fetching quests: ${backendResponse.status} ${errorText}`
      );
      return NextResponse.json(
        { message: "Failed to fetch quests from backend" },
        { status: backendResponse.status }
      );
    }

    const questsData = await backendResponse.json();
    return NextResponse.json(questsData);
  } catch (error) {
    console.error("Failed to fetch quests data", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 