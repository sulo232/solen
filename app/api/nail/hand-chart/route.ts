import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, generalLimiter, getClientIp } from '@/lib/ratelimit';
import { validateBody, nailHandChartSchema } from '@/lib/validations';

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

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json();
  const { data: validated, error: validationError } = validateBody(nailHandChartSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
  }
  const { clientId, notes } = validated;

  // Merge notes
  const existing = mockDb.get(clientId) || {};
  mockDb.set(clientId, { ...existing, ...notes });

  return NextResponse.json({ success: true, notes: mockDb.get(clientId) });
}
