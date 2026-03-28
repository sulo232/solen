import { NextResponse } from 'next/server';

// Temporary in-memory store to mock the `hand_chart_notes` Supabase table
const mockDb = new Map<string, any>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  
  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
  }

  const notes = mockDb.get(clientId) || {};
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { clientId, notes } = body;

  if (!clientId) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
  }

  // Merge notes
  const existing = mockDb.get(clientId) || {};
  mockDb.set(clientId, { ...existing, ...notes });

  return NextResponse.json({ success: true, notes: mockDb.get(clientId) });
}
