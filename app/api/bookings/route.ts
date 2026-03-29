export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingConfirmation, salonNewBooking } from "@/lib/email";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createBookingSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("bookings")
    .select("*, salons(name, slug, cover_photo_url), services(name_de, name_en, duration_minutes), staff_members(name)", { count: "exact" })
    .eq("user_id", user.id)
    .order("starts_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ items: data, total: count ?? 0, page, limit });
}

export async function POST(request: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(createBookingSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { slot_id, service_id, staff_member_id, is_first_visit, referral_code } = validated;

  // 1. Verify slot is available
  const { data: slot, error: slotError } = await supabase
    .from("availability_slots")
    .select("*, salons(*), services(*)")
    .eq("id", slot_id)
    .eq("status", "available")
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
  }

  // 2. Get user profile for is_first_visit
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_first_visit_default, locale")
    .eq("id", user.id)
    .single();

  const price = slot.price_override ?? slot.services?.price ?? 0;
  const firstVisit = is_first_visit ?? profile?.is_first_visit_default ?? true;

  // T&S §3.1: check booking confirmation mode (instant vs manual_approval)
  const confirmMode = (slot.salons as any)?.booking_confirmation_mode ?? "instant";
  const bookingStatus = confirmMode === "manual_approval" ? "pending_approval" : "confirmed";

  // 3. Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      salon_id: slot.salon_id,
      service_id,
      staff_member_id: staff_member_id ?? slot.staff_member_id,
      slot_id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      price_paid: price,
      status: bookingStatus,
      is_first_visit: firstVisit,
    })
    .select()
    .single();

  if (bookingError) return NextResponse.json({ message: bookingError.message, code: "DB_ERROR" }, { status: 500 });

  // 4. Mark slot as booked
  await supabase
    .from("availability_slots")
    .update({ status: "booked", booked_by: user.id, booking_id: booking.id })
    .eq("id", slot_id);

  // 5. Send confirmation email to customer
  const locale = (profile?.locale ?? "de") as "de" | "en";
  const serviceNameKey = locale === "de" ? "name_de" : "name_en";
  const serviceName = slot.services?.[serviceNameKey] ?? "Service";
  const salonName = slot.salons?.name ?? "Salon";
  const bookingDate = new Date(slot.starts_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB");
  const bookingTime = new Date(slot.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  try {
    const emailData = bookingConfirmation(
      user.email!,
      { service: serviceName, salon: salonName, date: bookingDate, time: bookingTime },
      locale
    );
    await sendEmail(emailData);
  } catch { /* email failure shouldn't break booking */ }

  // 6. Notify salon owner about the new booking
  try {
    const ownerId = (slot.salons as any)?.owner_id;
    if (ownerId) {
      const admin = createAdminSupabaseClient();
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", ownerId)
        .single();
      // Fetch the owner's auth email via admin auth API
      const { data: ownerAuthUser } = await admin.auth.admin.getUserById(ownerId);
      const ownerEmail = ownerAuthUser?.user?.email;
      if (ownerEmail && ownerProfile) {
        const ownerEmailData = salonNewBooking(
          ownerEmail,
          {
            customerName: user.email!,
            service: serviceName,
            date: bookingDate,
            time: bookingTime,
            price,
          },
          "de" // salon owners use DE by default; profile locale not fetched here
        );
        await sendEmail(ownerEmailData);
      }
    }
  } catch { /* owner notification failure must not break booking */ }

  // 7. Complete referral on first booking (if a referral_code was provided)
  if (referral_code) {
    try {
      const admin = createAdminSupabaseClient();

      // Only reward on first completed booking for this user
      const { count: bookingCount } = await admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "confirmed");

      // bookingCount includes the booking we just created — first booking = count of 1
      const isFirstBooking = (bookingCount ?? 0) <= 1;

      if (isFirstBooking) {
        // Ensure user hasn't already received a referral reward
        const { data: existingReferral } = await admin
          .from("referrals")
          .select("id")
          .eq("referred_user_id", user.id)
          .eq("status", "completed")
          .maybeSingle();

        if (!existingReferral) {
          // Find the pending referral matching the provided code
          const { data: referral } = await admin
            .from("referrals")
            .select("id, referrer_id, reward_amount")
            .eq("referral_code", referral_code)
            .is("referred_user_id", null)
            .eq("status", "pending")
            .maybeSingle();

          if (referral && referral.referrer_id !== user.id) {
            const rewardAmount = referral.reward_amount ?? 10;
            const creditExpiry = new Date();
            creditExpiry.setMonth(creditExpiry.getMonth() + 6);

            // Mark referral complete
            await admin
              .from("referrals")
              .update({
                referred_user_id: user.id,
                status: "completed",
                completed_at: new Date().toISOString(),
              })
              .eq("id", referral.id);

            // Credit referrer
            await admin.from("user_credits").insert({
              user_id: referral.referrer_id,
              amount: rewardAmount,
              remaining: rewardAmount,
              source: "referral",
              source_id: referral.id,
              expires_at: creditExpiry.toISOString(),
            });

            // Credit referee
            await admin.from("user_credits").insert({
              user_id: user.id,
              amount: rewardAmount,
              remaining: rewardAmount,
              source: "referral",
              source_id: referral.id,
              expires_at: creditExpiry.toISOString(),
            });
          }
        }
      }
    } catch { /* referral failure must not break booking */ }
  }

  return NextResponse.json({ data: booking }, { status: 201 });
}
