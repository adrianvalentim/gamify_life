import { NextResponse } from 'next/server';

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080/api/v1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Backend create failed with status: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to create document in Go backend:`, error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
} 