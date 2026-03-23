export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, staffServicesSchema } from "@/lib/validations";

// GET /api/staff/services — Get staff-service assignments for a salon
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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

  let query = supabase
    .from("staff_services")
    .select("*, services(name_de, name_en, category, duration_minutes, price), staff_members(name)")
    .eq("salon_id", effectiveSalonId);

  if (staffMemberId) query = query.eq("staff_member_id", staffMemberId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

// POST /api/staff/services — Assign services to a staff member (salon owner only)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Delete existing assignments and re-insert
  await supabase
    .from("staff_services")
    .delete()
    .eq("staff_member_id", staff_member_id);

  if (service_ids.length > 0) {
    const rows = service_ids.map((sid: string) => ({
      staff_member_id,
      service_id: sid,
      salon_id: staffMember.salon_id,
    }));

    const { error } = await supabase.from("staff_services").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Services assigned", count: service_ids.length });
}
