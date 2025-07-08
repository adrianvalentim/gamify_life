import { NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8001';

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ detail: 'Missing title or description' }, { status: 400 });
    }

    const aiResponse = await fetch(`${AI_SERVICE_URL}/agent/generate_quest_details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error('AI service error:', errorBody);
      return NextResponse.json(
        { detail: `AI service failed with status: ${aiResponse.status}` },
        { status: aiResponse.status }
      );
    }

    const data = await aiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in quest-details API route:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
} 