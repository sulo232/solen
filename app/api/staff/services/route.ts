export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, staffServicesSchema } from "@/lib/validations";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { getActiveSalonId } from "@/lib/active-salon";
import { requireSalonAccess } from "@/lib/auth/require";
import type { Database } from "@/lib/database.types";

// GET /api/staff/services — Get staff-service assignments for a salon
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  const staffMemberId = searchParams.get("staff_member_id");

  const admin = createAdminSupabaseClient();
  const effectiveSalonId = salonId ?? await getActiveSalonId(admin, user.id, "any");
  if (!effectiveSalonId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: staffSelf } = await admin.from("staff_members").select("id, salon_id")
    .eq("user_id", user.id).eq("salon_id", effectiveSalonId).eq("is_active", true).maybeSingle();

  const access = await requireSalonAccess(effectiveSalonId, "catalog", { user, supabase });
  const selfOnly = access instanceof NextResponse;
  if (selfOnly && (!staffSelf || (staffMemberId && staffMemberId !== staffSelf.id))) return access;

  // staff_services has no salon_id. Resolve the authorized staff ids first,
  // then scope the service-role read through that foreign key.
  let allowedStaffIds: string[];
  if (selfOnly) {
    allowedStaffIds = [staffSelf!.id];
  } else {
    const { data: salonStaff, error } = await admin.from("staff_members")
      .select("id").eq("salon_id", effectiveSalonId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    allowedStaffIds = (salonStaff ?? []).map((staff) => staff.id);
  }
  if (staffMemberId && !allowedStaffIds.includes(staffMemberId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!allowedStaffIds.length) return NextResponse.json({ items: [] });
  const query = admin.from("staff_services")
    .select("*, services(name_de, name_en, category, duration_minutes, price), staff_members(name)")
    .in("staff_member_id", staffMemberId ? [staffMemberId] : allowedStaffIds);

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

  const admin = createAdminSupabaseClient();
  // Resolve only the target identity before checking its Store permission.
  const { data: staffMember } = await admin
    .from("staff_members")
    .select("id, salon_id")
    .eq("id", staff_member_id)
    .single();

  if (!staffMember) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog = services & pricing) instead of the old
  // owner-only compare.
  const access = await requireSalonAccess(staffMember.salon_id, "catalog", { user, supabase });
  if (access instanceof NextResponse) return access;

  // Verify every service_id actually belongs to this staff member's salon, so a
  // caller can't cross-reference another salon's service (name/price/duration
  // would then leak onto this salon's public staff profile).
  if (service_ids.length > 0) {
    const { data: ownServices, error: servicesError } = await admin
      .from("services")
      .select("id")
      .in("id", service_ids)
      .eq("salon_id", staffMember.salon_id);

    if (servicesError) return NextResponse.json({ error: servicesError.message }, { status: 500 });
    const ownIds = new Set((ownServices ?? []).map((s) => s.id));
    const foreignIds = service_ids.filter((sid: string) => !ownIds.has(sid));
    if (foreignIds.length > 0) {
      return NextResponse.json({ error: "One or more service_ids do not belong to this salon" }, { status: 400 });
    }
  }

  // Resource write via the admin client: staff_services_salon_write RLS is
  // owner-only, so a "catalog"-granted staff caller's delete+insert would
  // silently remove nothing / 500 through the session client. staff_member_id
  // is already verified above to belong to the gated salon.
  // Delete existing assignments and re-insert
  const { error: deleteError } = await admin
    .from("staff_services")
    .delete()
    .eq("staff_member_id", staff_member_id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (service_ids.length > 0) {
    // Phantom-column fix: staff_services has no "salon_id" column (see the GET handler above),
    // so this insert always 400'd before this fix. Salon scoping was already fully enforced
    // above (the foreignIds check), so dropping the field changes no real behavior.
    const rows: Database["public"]["Tables"]["staff_services"]["Insert"][] = service_ids.map((sid: string) => ({
      staff_member_id,
      service_id: sid,
    }));

    const { error } = await admin.from("staff_services").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Services assigned", count: service_ids.length });
}
