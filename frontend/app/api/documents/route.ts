import { NextResponse } from 'next/server';

const GO_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authorization = request.headers.get('Authorization');

    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${GO_API_URL}/api/v1/journal`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
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
