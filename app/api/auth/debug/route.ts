export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

/**
 * Minimal debug: no Supabase, no cookies — just return JSON.
 * If this works but /api/profile doesn't, the issue is Supabase client.
 * DELETE AFTER DEBUGGING.
 */
export async function GET() {
  return NextResponse.json({ ok: true, time: Date.now() });
}
