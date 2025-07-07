import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { questId: string } }
) {
  const authorization = request.headers.get("authorization");
  const { questId } = params;

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!questId) {
    return NextResponse.json(
      { message: "Quest ID is required" },
      { status: 400 }
    );
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  try {
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/quests/${questId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
        },
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `Backend error completing quest: ${backendResponse.status} ${errorText}`
      );
      return NextResponse.json(
        { message: "Failed to complete quest in backend" },
        { status: backendResponse.status }
      );
    }

    const questData = await backendResponse.json();
    return NextResponse.json(questData);
  } catch (error) {
    console.error("Failed to complete quest", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 