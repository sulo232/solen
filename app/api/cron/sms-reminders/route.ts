export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextResponse } from "next/server";

// GET /api/cron/sms-reminders — Stub for SMS reminders cron (TODO: implement in R10)
export async function GET() {
  // Placeholder — full implementation planned in roadmap R10
  return NextResponse.json({ ok: true, sent: 0 });
}
