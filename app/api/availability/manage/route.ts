export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, availabilityManageSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { data: validated, error: validationError } = validateBody(availabilityManageSchema, body);
  if (validationError) return NextResponse.json({ message: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });
  const { salon_id, slots } = validated;

  // Verify salon ownership
  const { data: salon } = await supabase.from("salons").select("owner_id").eq("id", salon_id).single();
  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Owner-facing slot management: only the two manual states are legal here. 'booked'
  // (and any other status) must only ever be set by the real booking-creation flow,
  // never by a client passing an arbitrary string on this dashboard-availability route.
  const ALLOWED_STATUSES = new Set(["available", "blocked"]);
  if (slots.some((s: { status?: string }) => s.status !== undefined && !ALLOWED_STATUSES.has(s.status))) {
    return NextResponse.json({ message: "status must be 'available' or 'blocked'", code: "INVALID_STATUS" }, { status: 400 });
  }

  // Verify every referenced staff_member_id actually belongs to THIS salon, so an owner
  // can't reference another salon's staff and pollute that salon's booking/analytics data.
  const staffIds = [...new Set(slots.map((s: { staff_member_id?: string }) => s.staff_member_id).filter(Boolean))] as string[];
  if (staffIds.length > 0) {
    const { data: ownStaff } = await supabase
      .from("staff_members")
      .select("id")
      .in("id", staffIds)
      .eq("salon_id", salon_id);
    const ownStaffIds = new Set((ownStaff ?? []).map((s) => s.id));
    if (staffIds.some((id) => !ownStaffIds.has(id))) {
      return NextResponse.json({ message: "staff_member_id does not belong to this salon", code: "STAFF_SALON_MISMATCH" }, { status: 400 });
    }
  }

  // block_reason: 'manual' marks an owner-created blocked row so the nightly
  // capacity-limiter revert (generate-slots, block_reason='capacity' only) never
  // re-opens it.
  const toInsert = slots.map((slot: { service_id?: string; staff_member_id?: string; starts_at: string; ends_at: string; status?: string }) => ({
    salon_id,
    service_id: slot.service_id ?? null,
    staff_member_id: slot.staff_member_id ?? null,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    status: slot.status ?? "available",
    block_reason: slot.status === "blocked" ? "manual" : null,
  }));

  const { data, error } = await supabase.from("availability_slots").insert(toInsert).select();
  if (error) {
    if (error.code === '23P01') {
      return NextResponse.json({ message: "Fehler: Mitarbeiter ist in diesem Zeitraum bereits gebucht.", code: "CONFLICT" }, { status: 409 });
    }
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
