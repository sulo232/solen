export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingConfirmation, salonNewBooking } from "@/lib/email";
import { applyRateLimit, bookingLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createBookingSchema } from "@/lib/validations";
// SP-2 owns guest-access primitives; SP-1 only CALLS them (no parallel token/code scheme).
import { issueAccessToken } from "@/lib/bookings/guest-access";
import { assignReferenceCode } from "@/lib/bookings/reference";

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

  // SP-1: the route is the auth boundary, NOT a hard 401. A logged-in user keeps the verified
  // G1 path (RLS-backed client, user_id = auth.uid()). A logged-out guest is allowed, but its
  // row (user_id IS NULL) is rejected by RLS `bookings_insert_auth`, so the guest write MUST go
  // through the service-role admin client (§10b.6 — guest writes never rely on RLS).
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  const isGuest = !user;
  const db = isGuest ? createAdminSupabaseClient() : supabase;

  if (user) {
    const banned = await checkUserBanned(user.id);
    if (banned) return banned;
  }

  // §10b.12: do NOT leave the money/booking surface unthrottled for anon. The old hard-401
  // doubled as anon throttling; now we rate-limit by userId (logged-in) or client IP (guest).
  const rateLimited = await applyRateLimit(
    bookingLimiter,
    user ? { userId: user.id } : { ip: getClientIp(request) },
  );
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(createBookingSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { slot_id, salon_id, service_id, staff_member_id, starts_at, is_first_visit,
          referral_code, payment_method, guest_name, guest_phone, guest_email } = validated;
  const isOnlinePay = payment_method === "online";

  // Zod cannot see the session, so it keeps guest fields optional. The route enforces them:
  // no session => name + phone are required (the CHECK constraint is the DB-level backstop).
  if (isGuest && (!guest_name || !guest_phone)) {
    return NextResponse.json(
      { message: "Guest bookings require name and phone", code: "GUEST_INFO_REQUIRED" },
      { status: 400 },
    );
  }

  // 1. Resolve + verify the slot. Two entry contracts (G1, 2026-06-01):
  //   - legacy / dashboard: an explicit `slot_id`.
  //   - consumer pay-confirm: `salon_id` + `starts_at` (+ optional staff) -> resolve the
  //     matching available slot server-side. `starts_at` is compared as an instant
  //     (timestamptz), so the UTC ISO string the UI sends matches the stored slot.
  //     When staff is "any" (null), the first available slot at that time wins.
  // SP-1: use `db` so the guest path reads via service-role; slots are public-readable anyway
  // (slots_select_available USING (true)) but a single client keeps the two paths consistent.
  let slotQuery = db
    .from("availability_slots")
    .select("*, salons(*), services(*)")
    .eq("status", "available");

  if (slot_id) {
    slotQuery = slotQuery.eq("id", slot_id);
  } else {
    slotQuery = slotQuery
      .eq("salon_id", salon_id!)
      .eq("service_id", service_id)
      .eq("starts_at", starts_at!);
    if (staff_member_id) slotQuery = slotQuery.eq("staff_member_id", staff_member_id);
  }

  const { data: slotRows, error: slotError } = await slotQuery
    .order("starts_at", { ascending: true })
    .limit(1);
  const slot = slotRows?.[0];

  if (slotError || !slot) {
    return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
  }

  const resolvedSlotId = slot.id as string;

  // 2. Get user profile for is_first_visit (logged-in only — a guest has no profile row).
  let profile: { is_first_visit_default?: boolean | null; locale?: string | null } | null = null;
  if (user) {
    const { data } = await db
      .from("profiles")
      .select("is_first_visit_default, locale")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  // SP-1 / §10b.5: write price exactly as G1 does (no Rappen/CHF conversion here — out of scope).
  const price = slot.price_override ?? slot.services?.price ?? 0;
  const firstVisit = is_first_visit ?? profile?.is_first_visit_default ?? true;

  // T&S §3.1: check booking confirmation mode (instant vs manual_approval)
  const confirmMode = (slot.salons as any)?.booking_confirmation_mode ?? "instant";
  // SP-G2: an online-pay booking starts as "pending" (awaiting payment) with
  // payment_status "none" — the Stripe webhook flips it to "confirmed" + "paid"
  // once the full-prepay PaymentIntent succeeds (and releases the slot on failure).
  // The legacy / in-person path keeps the instant-vs-manual_approval behavior.
  const bookingStatus = isOnlinePay
    ? "pending"
    : confirmMode === "manual_approval" ? "pending_approval" : "confirmed";

  // 3. Mint the guest access token BEFORE the insert (it needs no booking id). SP-2's
  //    issueAccessToken() returns { raw, hash, expiresAt }: persist ONLY the hash + expiry on
  //    the row, return the raw token to the client ONCE (guests only). Logged-in users
  //    authenticate by session and get no token.
  const access = isGuest ? issueAccessToken() : null;

  // SP-AC Lane A consent (REFUND_APPEAL_PLAN §11): freeze the salon's cancellation +
  // no-show terms AS BOOKED and stamp acceptance. This is the LEGAL BASIS the
  // auto-charge paths require — chargeFee's callers (cancel route + no-show cron) refuse
  // to charge a booking with no policy_accepted_at. The no-show cron reads no_show_fee_*
  // straight off this snapshot (what the customer agreed to), not the salon's live row.
  // Defaults mirror the cancel/no-show readers (free_cancel_hours ?? 24; missing fee
  // type => 'free' => never charges).
  const salonForPolicy = slot.salons as any;
  const policySnapshot = {
    cancellation_fee_type: salonForPolicy?.cancellation_fee_type ?? null,
    cancellation_fee_value: salonForPolicy?.cancellation_fee_value ?? null,
    free_cancel_hours: salonForPolicy?.free_cancel_hours ?? 24,
    no_show_fee_type: salonForPolicy?.no_show_fee_type ?? null,
    no_show_fee_value: salonForPolicy?.no_show_fee_value ?? null,
    accepted_via: "booking_create",
  };

  // 4. Create booking. The guest INSERT works ONLY because `db` is the service-role client
  //    (bypasses RLS); the logged-in INSERT uses the RLS client and passes bookings_insert_auth.
  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .insert({
      user_id: user?.id ?? null,                          // NULL for guest (§10b.6)
      guest_name:  isGuest ? guest_name              : null,
      guest_phone: isGuest ? guest_phone             : null,
      guest_email: isGuest ? (guest_email ?? null)   : null,
      access_token_hash:       access?.hash ?? null,
      access_token_expires_at: access?.expiresAt ?? null,
      salon_id: slot.salon_id,
      service_id,
      staff_member_id: staff_member_id ?? slot.staff_member_id,
      slot_id: resolvedSlotId,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      price_paid: price,
      status: bookingStatus,
      payment_status: isOnlinePay ? "none" : undefined,
      is_first_visit: firstVisit,
      // Lane A consent (SP-AC): frozen policy terms + acceptance timestamp, written for
      // EVERY booking (guest + logged-in). Gates the cancellation/no-show auto-charge.
      policy_accepted_at: new Date().toISOString(),
      policy_snapshot: policySnapshot,
    })
    .select()
    .single();

  if (bookingError) return NextResponse.json({ message: bookingError.message, code: "DB_ERROR" }, { status: 500 });

  // 5. Stamp the human order number (SP-2 generator + 23505 retry against the unique index).
  //    Needs the booking id, so it runs post-insert with the service-role client. Failure here
  //    must not orphan the row — log + continue; the code can be backfilled. (assignReferenceCode
  //    is idempotent: a retry won't overwrite an issued code.)
  let referenceCode: string | null = null;
  try {
    const admin = isGuest ? (db as ReturnType<typeof createAdminSupabaseClient>) : createAdminSupabaseClient();
    referenceCode = await assignReferenceCode(admin, booking.id);
  } catch (err) {
    console.error("[bookings] reference_code assignment failed:", err);
  }

  // 6. Mark slot as booked. `booked_by` is the user id or NULL for a guest (column is
  //    ON DELETE SET NULL / nullable). Use `db` so the guest path writes via service-role.
  await db
    .from("availability_slots")
    .update({ status: "booked", booked_by: user?.id ?? null, booking_id: booking.id })
    .eq("id", resolvedSlotId);

  // 7. Send confirmation email to customer.
  // SP-G2: skip for online-pay bookings — they aren't confirmed/paid yet. The
  // Stripe webhook sends the confirmation once the full-prepay PI succeeds.
  // SP-1: a guest has no session email — use guest_email when given, else SKIP (no address).
  const locale = (profile?.locale ?? "de") as "de" | "en";
  const serviceNameKey = locale === "de" ? "name_de" : "name_en";
  const serviceName = slot.services?.[serviceNameKey] ?? "Service";
  const salonName = slot.salons?.name ?? "Salon";
  const bookingDate = new Date(slot.starts_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB");
  const bookingTime = new Date(slot.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  const customerEmail = user?.email ?? guest_email ?? null;
  if (!isOnlinePay && customerEmail) {
    try {
      const emailData = bookingConfirmation(
        customerEmail,
        { service: serviceName, salon: salonName, date: bookingDate, time: bookingTime },
        locale
      );
      await sendEmail(emailData);
    } catch { /* email failure shouldn't break booking */ }
  }

  // 8. Notify salon owner about the new booking (deferred for online-pay until
  //    payment succeeds — the webhook owns the confirmed-booking notifications).
  try {
    const ownerId = (slot.salons as any)?.owner_id;
    if (ownerId && !isOnlinePay) {
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
            // SP-1: guest has no session email — fall back to the guest name, then "Gast".
            customerName: user?.email ?? guest_name ?? "Gast",
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

  // 9. Complete referral on first booking (if a referral_code was provided).
  //    SP-1: referrals reward `referred_user_id = user.id`; a guest has no user id, so this is a
  //    logged-in-only feature. Guarding on `user` leaves the logged-in behavior unchanged.
  if (referral_code && user) {
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

  // Surface the freshly-assigned reference_code on the returned row (the insert ran before the
  // code was stamped, so booking.reference_code is still null in that object).
  if (referenceCode) booking.reference_code = referenceCode;

  // SP-1 response contract: a GUEST also gets the raw access_token (issued once, never persisted)
  // + reference_code so the confirmation screen can show the order number and exchange the token
  // for the httpOnly cookie (SP-2 owns that exchange). A logged-in user gets neither — they
  // authenticate by session (§10b.7: token never returned to / needed by a session user).
  return NextResponse.json(
    {
      data: booking,
      ...(isGuest ? { access_token: access?.raw, reference_code: referenceCode } : {}),
    },
    { status: 201 },
  );
}
