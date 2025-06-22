import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'lib/mock-db.ts');

// This is a simplified in-memory store.
// In a real application, you'd use a database.
let documents: { [key: string]: { id: string; title: string; content: string } } = {};

// Function to read from the mock DB file.
async function readDB() {
  try {
    // In a real app, this would be a database call.
    // For now, we're just ensuring our in-memory `documents` object is populated.
    // The mock-db.ts file is not actually structured as a DB, so we won't read it here.
    // We will just use the in-memory `documents` object.
  } catch (error) {
    console.error('Failed to read mock DB', error);
  }
}

// Read the DB on startup.
readDB();

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080/api/v1';

export async function GET(
  request: Request,
  { params: { documentId } }: { params: { documentId: string } }
) {
  try {
    const res = await fetch(`${GO_API_URL}/journal/${documentId}`);
    if (!res.ok) {
      // If the backend returns a 404 or other error, we create a default
      if (res.status === 404) {
        return NextResponse.json({
          id: documentId,
          title: 'Untitled',
          content: `<h1>Untitled</h1><p>Start your story here.</p>`,
        });
      }
      throw new Error(`Backend fetch failed with status: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to fetch document ${documentId} from Go backend:`, error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params: { documentId } }: { params: { documentId: string } }
) {
  try {
    const body = await request.json();
    const res = await fetch(`${GO_API_URL}/journal/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Backend update failed with status: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to update document ${documentId} in Go backend:`, error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
} 