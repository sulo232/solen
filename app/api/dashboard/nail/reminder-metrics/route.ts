export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/nail/reminder-metrics?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (salon?.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // NOTE: reminder_log is not a real table (checked lib/database.types.ts; nail infill
  // reminders are currently written to client_notes, not a dedicated log), so both queries
  // that used to sit here always errored (42P01 undefined table) and this route has always
  // returned honest zeros on every call. Returning that same response directly, byte
  // identical to the previous behavior. A real fix needs a schema decision (a dedicated
  // reminder_log table, or reading infill reminders back out of client_notes) outside this
  // typed-fix pass.
  return NextResponse.json({ sent: 0, booked: 0, conversion_rate: 0, period_days: 30 });
}
