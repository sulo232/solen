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
import { pickSlotForAnyStaff, countStaffBookingsOnDay } from "@/lib/bookings/auto-assign";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const salonId = searchParams.get("salon_id");
  const date = searchParams.get("date"); // YYYY-MM-DD — owner "today" filter
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  // ── Owner / salon-scoped mode (G1, 2026-06-03): the dashboard passes ?salon_id.
  //    The default GET below is USER-scoped (the customer "my bookings" view, keyed
  //    `items`). The dashboard needs the SALON's bookings keyed `bookings`, enriched
  //    with customer/service/staff names. Verify the caller owns the salon (or is admin)
  //    first; salon owners can read their salon's bookings under RLS (same policy the
  //    /api/salon/clients reader relies on).
  if (salonId) {
    const [{ data: salon }, { data: prof }] = await Promise.all([
      supabase.from("salons").select("owner_id").eq("id", salonId).single(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    if (salon?.owner_id !== user.id && prof?.role !== "admin") {
      return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    let q = supabase
      .from("bookings")
      .select("*, services(name_de, name_en), staff_members(name)", { count: "exact" })
      .eq("salon_id", salonId)
      .order("starts_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) q = q.eq("status", status);
    if (date) q = q.gte("starts_at", `${date}T00:00:00`).lte("starts_at", `${date}T23:59:59`);

    const { data, error, count } = await q;
    if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

    // Enrich customer_name from public_profiles (logged-in) or guest_name (guest booking).
    const userIds = [...new Set((data ?? []).map((b) => b.user_id).filter(Boolean) as string[])];
    const nameMap = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("public_profiles").select("id, display_name").in("id", userIds);
      (profs ?? []).forEach((p) => nameMap.set(p.id, p.display_name));
    }
    const bookings = (data ?? []).map((b) => ({
      ...b,
      customer_name: (b.user_id ? nameMap.get(b.user_id) : null) ?? b.guest_name ?? "Gast",
      customer_avatar: null as string | null,
      service_name: b.services?.name_de ?? b.services?.name_en ?? "Service",
      staff_name: b.staff_members?.name ?? null,
    }));
    return NextResponse.json({ bookings, total: count ?? 0, page, limit });
  }

  // ── Default: USER-scoped "my bookings" (unchanged contract → { items }).
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
          referral_code, payment_method, guest_name, guest_phone, guest_email, extra_service_ids, customer_note } = validated;
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

  const { data: candidateSlots, error: slotError } = await slotQuery
    .order("starts_at", { ascending: true })
    .limit(30);

  if (slotError || !candidateSlots?.length) {
    return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
  }

  // Phase E: pick the slot. Explicit slot_id or a specifically chosen staff → that one. "Any" staff
  // → auto-assign per the salon's auto_assign_method + per-stylist daily limit. Opt-in: the defaults
  // ('manual' + limit off) keep the previous "first available" behaviour exactly.
  const sched = candidateSlots[0].salons as { auto_assign_method?: string; daily_limit_enabled?: boolean; daily_limit?: number } | null;
  const autoMethod = sched?.auto_assign_method ?? "manual";
  const dailyLimitOn = sched?.daily_limit_enabled === true;
  const dailyLimit = Math.max(1, Number(sched?.daily_limit) || 20);
  const slotSalonId = String((candidateSlots[0] as { salon_id?: string }).salon_id ?? salon_id ?? "");
  const bookingDay = String(candidateSlots[0].starts_at).slice(0, 10);

  let slot = candidateSlots[0];
  if (!slot_id && !staff_member_id && (autoMethod !== "manual" || dailyLimitOn)) {
    const picked = await pickSlotForAnyStaff(db, candidateSlots as never, {
      method: autoMethod, dailyLimitOn, dailyLimit, salonId: slotSalonId, day: bookingDay,
    });
    if (!picked) {
      return NextResponse.json({ message: "Alle Stylist:innen sind an diesem Tag ausgebucht.", code: "STAFF_DAILY_LIMIT" }, { status: 409 });
    }
    slot = picked;
  } else if (dailyLimitOn && slot.staff_member_id) {
    const cnt = await countStaffBookingsOnDay(db, slotSalonId, slot.staff_member_id as string, bookingDay);
    if (cnt >= dailyLimit) {
      return NextResponse.json({ message: "Diese:r Stylist:in ist an diesem Tag ausgebucht.", code: "STAFF_DAILY_LIMIT" }, { status: 409 });
    }
  }

  const resolvedSlotId = slot.id as string;

  // Phase 2 toggle enforcement: a salon can switch OFF online booking (e.g. a walk-in-only
  // shop). Reject online appointment bookings when disabled. `=== false` only (default is
  // true + existing salons backfilled), so a missing/true flag fails OPEN and never blocks.
  if ((slot.salons as any)?.online_booking_enabled === false) {
    return NextResponse.json(
      { message: "This salon is not accepting online bookings.", code: "ONLINE_BOOKING_DISABLED" },
      { status: 403 },
    );
  }

  // Vacation guard: when the salon set a vacation range, reject bookings whose date falls inside it
  // (vacation_start/end are DATE; compare the slot's calendar date). Was decorative before — the
  // settings saved but nothing blocked, so a salon on vacation would still accept appointments.
  {
    const sal = slot.salons as any;
    if (sal?.vacation_start && sal?.vacation_end) {
      const bookingDate = String(slot.starts_at).slice(0, 10); // YYYY-MM-DD (UTC; day-granular guard)
      if (bookingDate >= sal.vacation_start && bookingDate <= sal.vacation_end) {
        return NextResponse.json(
          { message: "This salon is on vacation for the selected date.", code: "SALON_ON_VACATION" },
          { status: 403 },
        );
      }
    }
  }

  // Phase D: a salon on deposit/prepay requires online payment — reject an in-person booking that
  // would bypass the required deposit/prepay. The pay step enforces this; this is the server backstop.
  {
    const salPayMode = (slot.salons as { payment_mode?: string } | null)?.payment_mode;
    if ((salPayMode === "deposit" || salPayMode === "prepay") && payment_method !== "online") {
      return NextResponse.json(
        { message: "This salon requires online payment.", code: "ONLINE_PAYMENT_REQUIRED" },
        { status: 400 },
      );
    }
  }

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
  const primaryPrice = slot.price_override ?? slot.services?.price ?? 0;
  // Multi-service: resolve the extra services' REAL prices server-side (never the client's),
  // store them as extras_addons, and fold their sum into price_paid (which drives the charge).
  const extrasAddons: { id: string; name: string; price: number }[] = [];
  if (extra_service_ids?.length) {
    const uniqueExtras = [...new Set(extra_service_ids)].filter((id) => id !== service_id);
    if (uniqueExtras.length) {
      const { data: extraSvcs } = await db
        .from("services")
        .select("id, name_de, name_en, price, salon_id, is_active")
        .in("id", uniqueExtras)
        .eq("salon_id", slot.salon_id);
      for (const sv of extraSvcs ?? []) {
        if (sv.is_active === false) continue;
        extrasAddons.push({ id: sv.id, name: sv.name_de ?? sv.name_en ?? "Service", price: Number(sv.price) || 0 });
      }
    }
  }
  const extrasTotal = extrasAddons.reduce((s, a) => s + a.price, 0);
  const price = Math.round((Number(primaryPrice) + extrasTotal) * 100) / 100;
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

  // Duplicate guard (owner 2026-06-12: "they can just click back and book as many
  // times as they want"): the same customer re-confirming the same salon+time gets a
  // 409 instead of a second booking (auto-assign would otherwise grab another stylist's
  // slot at the identical time). Keyed on user_id (logged-in) or guest_phone (guest).
  {
    let dupQuery = db
      .from("bookings")
      .select("id")
      .eq("salon_id", slot.salon_id)
      .eq("starts_at", slot.starts_at)
      .in("status", ["pending", "confirmed"])
      .limit(1);
    dupQuery = user ? dupQuery.eq("user_id", user.id) : dupQuery.eq("guest_phone", guest_phone!);
    const { data: dup } = await dupQuery;
    if (dup?.length) {
      return NextResponse.json(
        { message: "Du hast diesen Termin bereits gebucht.", code: "DUPLICATE_BOOKING" },
        { status: 409 },
      );
    }
  }

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
      extras_addons: extrasAddons.length ? JSON.stringify(extrasAddons) : null,
      status: bookingStatus,
      payment_status: isOnlinePay ? "none" : undefined,
      is_first_visit: firstVisit,
      // Lane A consent (SP-AC): frozen policy terms + acceptance timestamp, written for
      // EVERY booking (guest + logged-in). Gates the cancellation/no-show auto-charge.
      customer_note: customer_note?.trim() || null,
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
      // Price + VAT-inclusive breakdown (registered salon → Netto/MWST/Gesamt + UID; else just
      // the total). slot.salons is salons(*), so it already carries vat_registered/vat_rate/vat_number.
      const salonVat = slot.salons as { vat_registered?: boolean; vat_rate?: number; vat_number?: string } | null;
      const grossRappen = Math.round(Number(price ?? 0) * 100);
      const { computeVat } = await import("@/lib/vat");
      const evb = salonVat?.vat_registered && grossRappen > 0
        ? computeVat(grossRappen, { registered: true, ratePercent: salonVat.vat_rate ?? 8.1 })
        : null;
      const emailData = bookingConfirmation(
        customerEmail,
        {
          service: serviceName, salon: salonName, date: bookingDate, time: bookingTime,
          total: `CHF ${Number(price ?? 0).toFixed(2)}`,
          ...(evb ? {
            net: `CHF ${(evb.netRappen / 100).toFixed(2)}`,
            vat: `CHF ${(evb.vatRappen / 100).toFixed(2)}`,
            rate: evb.ratePercent % 1 === 0 ? String(evb.ratePercent) : evb.ratePercent.toFixed(1),
            vatNumber: salonVat?.vat_number ?? undefined,
          } : {}),
        },
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
