export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, expressRebookSchema } from "@/lib/validations";

// POST /api/bookings/express-rebook — One-tap rebook: find next available slot
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(expressRebookSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { rebook_from_booking_id } = validated;

  const admin = createAdminSupabaseClient();

  // Fetch source booking
  const { data: source } = await admin
    .from("bookings")
    .select("id, salon_id, service_id, staff_member_id, price_paid, services(name_de, duration_minutes), staff_members(name)")
    .eq("id", rebook_from_booking_id)
    .eq("user_id", user.id)
    .single();

  if (!source) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const service = source.services as any;
  const staff = source.staff_members as any;

  // Find next available slot for this barber + service
  const now = new Date();
  let { data: slot } = await admin
    .from("availability_slots")
    .select("id, starts_at, ends_at")
    .eq("salon_id", source.salon_id)
    .eq("staff_member_id", source.staff_member_id)
    .eq("status", "available")
    .gt("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let fallbackBarber = false;

  // If preferred barber unavailable, find any available barber
  if (!slot) {
    const { data: anySlot } = await admin
      .from("availability_slots")
      .select("id, starts_at, ends_at, staff_member_id, staff_members(name)")
      .eq("salon_id", source.salon_id)
      .eq("status", "available")
      .gt("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (anySlot) {
      slot = anySlot;
      fallbackBarber = true;
    }
  }

  if (!slot) {
    return NextResponse.json({ error: "No available slots" }, { status: 404 });
  }

  const suggestedDate = new Date(slot.starts_at);

  return NextResponse.json({
    suggestedSlot: {
      slotId: slot.id,
      date: suggestedDate.toISOString().split("T")[0],
      time: suggestedDate.toTimeString().slice(0, 5),
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
    },
    serviceId: source.service_id,
    serviceName: service?.name_de ?? null,
    staffId: source.staff_member_id,
    staffName: staff?.name ?? null,
    price: source.price_paid,
    fallbackBarber,
    sourceBookingId: source.id,
  });
}
