export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, expressRebookConfirmSchema } from "@/lib/validations";

// POST /api/bookings/express-rebook/confirm — Confirm express rebook, create booking
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
  const { data: validated, error: validationError } = validateBody(expressRebookConfirmSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { slot_id, service_id, staff_id, source_booking_id } = validated;

  const admin = createAdminSupabaseClient();

  // Verify slot is still available
  const { data: slot } = await admin
    .from("availability_slots")
    .select("id, salon_id, starts_at, ends_at, status")
    .eq("id", slot_id)
    .single();

  if (!slot || slot.status !== "available") {
    return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
  }

  // Get service price
  const { data: service } = await admin
    .from("services").select("price").eq("id", service_id).single();

  // Create booking
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      salon_id: slot.salon_id,
      service_id,
      slot_id,
      staff_member_id: staff_id ?? null,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      price_paid: service?.price ?? 0,
      status: "confirmed",
      is_express_rebook: true,
      rebooked_from_id: source_booking_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark slot as booked
  await admin
    .from("availability_slots")
    .update({ status: "booked" })
    .eq("id", slot_id);

  return NextResponse.json({ booking });
}
