export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireSalonAccess } from "@/lib/auth/require";

// GET /api/dashboard/nail/reminder-metrics?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (marketing) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "marketing");
  if (accessResult instanceof NextResponse) return accessResult;

  // NOTE: reminder_log is not a real table (checked lib/database.types.ts; nail infill
  // reminders are currently written to client_notes, not a dedicated log), so both queries
  // that used to sit here always errored (42P01 undefined table) and this route has always
  // returned honest zeros on every call. Returning that same response directly, byte
  // identical to the previous behavior. A real fix needs a schema decision (a dedicated
  // reminder_log table, or reading infill reminders back out of client_notes) outside this
  // typed-fix pass.
  return NextResponse.json({ sent: 0, booked: 0, conversion_rate: 0, period_days: 30 });
}
