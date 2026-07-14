export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, staffServicesSchema } from "@/lib/validations";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import type { Database } from "@/lib/database.types";

// GET /api/staff/services — Get staff-service assignments for a salon
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  const staffMemberId = searchParams.get("staff_member_id");

  // User must own the salon or be a staff member there
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salonId ?? "")
    .eq("owner_id", user.id)
    .single();

  const { data: staffSelf } = !salon
    ? await supabase
        .from("staff_members")
        .select("id, salon_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()
    : { data: null };

  const effectiveSalonId = salon?.id ?? staffSelf?.salon_id;
  if (!effectiveSalonId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Phantom-column fix: staff_services has no "salon_id" column (only staff_member_id,
  // service_id, price_override, tier_label; confirmed against the live schema and
  // lib/database.types.ts), so this filter always 400'd the whole query before this fix. Salon
  // scoping only exists transitively through staff_member_id -> staff_members.salon_id, so
  // resolve this salon's staff ids first, then filter on the real column (computed-filter
  // pattern, see app/api/salons/route.ts).
  let query = supabase
    .from("staff_services")
    .select("*, services(name_de, name_en, category, duration_minutes, price), staff_members(name)");

  const { data: salonStaff } = await supabase
    .from("staff_members")
    .select("id")
    .eq("salon_id", effectiveSalonId);
  const salonStaffIds = (salonStaff ?? []).map((s) => s.id);

  if (staffMemberId) {
    // Mirror the original double-scoped intent (salon_id AND staff_member_id together):
    // staffMemberId must belong to this caller's effectiveSalonId, otherwise reject before
    // querying, so a caller can't pass another salon's staff_member_id to read its rows.
    if (!salonStaffIds.includes(staffMemberId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    query = query.eq("staff_member_id", staffMemberId);
  } else {
    query = query.in("staff_member_id", salonStaffIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

// POST /api/staff/services — Assign services to a staff member (salon owner only)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(staffServicesSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { staff_member_id, service_ids } = validated;

  // Verify salon ownership
  const { data: staffMember } = await supabase
    .from("staff_members")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", staff_member_id)
    .single();

  if (!staffMember) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  const salonOwner = (staffMember.salons as unknown as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Only salon owners can assign services" }, { status: 403 });
  }

  // Verify every service_id actually belongs to this staff member's salon, so a
  // caller can't cross-reference another salon's service (name/price/duration
  // would then leak onto this salon's public staff profile).
  if (service_ids.length > 0) {
    const { data: ownServices } = await supabase
      .from("services")
      .select("id")
      .in("id", service_ids)
      .eq("salon_id", staffMember.salon_id);

    const ownIds = new Set((ownServices ?? []).map((s) => s.id));
    const foreignIds = service_ids.filter((sid: string) => !ownIds.has(sid));
    if (foreignIds.length > 0) {
      return NextResponse.json({ error: "One or more service_ids do not belong to this salon" }, { status: 400 });
    }
  }

  // Delete existing assignments and re-insert
  await supabase
    .from("staff_services")
    .delete()
    .eq("staff_member_id", staff_member_id);

  if (service_ids.length > 0) {
    // Phantom-column fix: staff_services has no "salon_id" column (see the GET handler above),
    // so this insert always 400'd before this fix. Salon scoping was already fully enforced
    // above (the foreignIds check), so dropping the field changes no real behavior.
    const rows: Database["public"]["Tables"]["staff_services"]["Insert"][] = service_ids.map((sid: string) => ({
      staff_member_id,
      service_id: sid,
    }));

    const { error } = await supabase.from("staff_services").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Services assigned", count: service_ids.length });
}
