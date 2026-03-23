export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, groupBookingSchema } from "@/lib/validations";

// POST /api/bookings/group — Create group booking using atomic RPC
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(groupBookingSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Verify salon exists
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", validated.members[0]?.service_id ? body.salon_id : "")
    .single();

  // Use the RPC for atomic slot reservation
  const salonId = body.salon_id;
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // Build members JSON for RPC (needs slot_id per member)
  const membersJson = validated.members.map((m) => ({
    name: m.name,
    service_id: m.service_id,
    staff_member_id: m.staff_member_id ?? null,
    slot_id: (body.member_slots as any)?.[validated.members.indexOf(m)] ?? null,
  }));

  // Validate all members have slot_ids
  if (membersJson.some((m) => !m.slot_id)) {
    return NextResponse.json({ error: "Each member needs a slot_id (pass member_slots array)" }, { status: 400 });
  }

  const { data: groupId, error: rpcError } = await supabase.rpc("create_group_booking", {
    p_organizer_name: validated.organizer_name,
    p_salon_id: salonId,
    p_group_size: validated.group_size,
    p_event_type: validated.event_type,
    p_members: membersJson,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 409 });
  }

  // Update organizer info
  await supabase
    .from("group_bookings")
    .update({
      organizer_user_id: user.id,
      organizer_phone: validated.organizer_phone ?? null,
    })
    .eq("id", groupId);

  return NextResponse.json({ data: { group_booking_id: groupId } }, { status: 201 });
}
