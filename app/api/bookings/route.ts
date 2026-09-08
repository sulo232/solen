export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { effectivePaymentMode } from "@/lib/bookings/payment-mode";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingConfirmation, salonNewBooking } from "@/lib/email";
import { applyRateLimit, bookingLimiter, bearerVerifyLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createBookingSchema } from "@/lib/validations";
// SP-2 owns guest-access primitives; SP-1 only CALLS them (no parallel token/code scheme).
import { issueAccessToken } from "@/lib/bookings/guest-access";
import { assignReferenceCode } from "@/lib/bookings/reference";
import { pickSlotForAnyStaff, countStaffBookingsOnDay } from "@/lib/bookings/auto-assign";
import { claimSlot } from "@/lib/bookings/claim-slot";
import { loadPricedBundle } from "@/lib/pricing/bundle";
import { completeReferralForFirstBooking } from "@/lib/referral/complete-referral";
import { reportError } from "@/lib/error-report";
import { resolveSwissLocale } from "@/lib/format";
import { localizedField } from "@/lib/i18n/localized-field";
import { zurichYmd, zurichCalendarRange } from "@/lib/time/zurich";
import { requireSalonAccess } from "@/lib/auth/require";
import { resolveRequestUser } from "@/lib/auth/request-user";
import { isSalonHidden, isViewerAdmin } from "@/lib/salon-detail";
// Ties a completed booking back to the search that led to it, which is what feeds the personal row.
import { attributeBookingToSearch } from "@/lib/points/attribution";

export async function GET(request: NextRequest) {
  // resolveRequestUser (lib/auth/request-user.ts) resolves the caller from EITHER the web
  // session cookie, unchanged, or an iOS `Authorization: Bearer <token>` header, itself
  // verified server-side against the Supabase Auth server. Without this an app customer
  // listing their own bookings hit a hard 401 (see POST below for the fuller writeup and
  // the same identical ordering: the round trip a Bearer token costs to verify is throttled
  // by IP BEFORE the resolve, and only when a header is actually present).
  if (request.headers.get("Authorization")) {
    const authFlood = await applyRateLimit(bearerVerifyLimiter, { ip: getClientIp(request) });
    if (authFlood) return authFlood;
  }
  const resolvedUser = await resolveRequestUser(request);
  if (resolvedUser instanceof NextResponse) return resolvedUser;
  const { user, supabase } = resolvedUser;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const salonId = searchParams.get("salon_id");
  const date = searchParams.get("date"); // YYYY-MM-DD — owner "today" filter
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;
  const calendar = searchParams.get("calendar") === "1";
  const calendarRange = calendar ? zurichCalendarRange(searchParams.get("from"), searchParams.get("to")) : null;
  const calendarOffset = Number(searchParams.get("offset") ?? "0");
  if (calendar && (!salonId || !calendarRange || !Number.isSafeInteger(calendarOffset) || calendarOffset < 0 || !Number.isFinite(limit) || !Number.isSafeInteger(calendarOffset + limit - 1))) {
    return NextResponse.json({ message: "Invalid calendar interval or offset", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // ── Owner / salon-scoped mode (G1, 2026-06-03): the dashboard passes ?salon_id.
  //    The default GET below is USER-scoped (the customer "my bookings" view, keyed
  //    `items`). The dashboard needs the SALON's bookings keyed `bookings`, enriched
  //    with customer/service/staff names. Verify the caller owns the salon (or is admin)
  //    first; salon owners can read their salon's bookings under RLS (same policy the
  //    /api/salon/clients reader relies on).
  if (salonId) {
    const access = await requireSalonAccess(salonId, "calendar", { user, supabase });
    if (access instanceof NextResponse) return access;
    const admin = createAdminSupabaseClient();

    // Ring 2d: `*` shipped all ~63 booking columns (Stripe ids, access tokens, fee-charge
    // internals, VAT/tier-discount breakdowns, reschedule/price-increase workflow fields) to
    // the salon dashboard. List ONLY what the 4 dashboard consumers actually read (grepped:
    // dashboard/page.tsx, dashboard/bookings/page.tsx, dashboard/clients/page.tsx,
    // dashboard/upcharge/page.tsx) plus the server's own enrichment reads (user_id, guest_name
    // below) and a small id/status/times/price/payment safety margin. No mobile consumer (the
    // iOS app queries `bookings` directly via Supabase, never this route).
    let q = admin
      .from("bookings")
      .select(
        "id, user_id, service_id, staff_member_id, slot_id, starts_at, ends_at, status, price_paid, paid_amount, payment_status, is_first_visit, is_recurring, cancellation_reason, fee_charge_status, guest_name, reference_code, services(name_de, name_en, name_fr, name_it), staff_members(name)",
        { count: "exact" },
      )
      .eq("salon_id", salonId)
      .order("starts_at", { ascending: false })
      .range(calendar ? calendarOffset : offset, (calendar ? calendarOffset : offset) + limit - 1);
    if (calendarRange) q = q.lt("starts_at", calendarRange.end).gt("ends_at", calendarRange.start).order("id", { ascending: true });
    if (status) q = q.eq("status", status);
    if (date) q = q.gte("starts_at", `${date}T00:00:00`).lte("starts_at", `${date}T23:59:59`);

    const { data, error, count } = await q;
    if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
    if (calendar && count == null) return NextResponse.json({ message: "Calendar population unavailable", code: "DB_ERROR" }, { status: 500 });

    // Enrich customer_name from public_profiles (logged-in) or guest_name (guest booking).
    const userIds = [...new Set((data ?? []).map((b) => b.user_id).filter(Boolean) as string[])];
    const nameMap = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profs, error: profileError } = await admin.from("public_profiles").select("id, display_name").in("id", userIds);
      if (calendar && profileError) {
        console.error("[bookings] calendar customer names unavailable:", profileError.message);
        return NextResponse.json({ message: "Calendar customer names unavailable", code: "DB_ERROR" }, { status: 500 });
      }
      (profs ?? []).forEach((p) => { if (p.id) nameMap.set(p.id, p.display_name); });
    }
    // Ring 2d: the explicit multi-column select above (vs the old `*, services(...)`) makes
    // PostgREST's TS inference type the embedded services/staff_members as arrays even though
    // this is a to-one relation at runtime (same widening the POST handler's LooseSlot comment
    // documents for the identical select-shape change there).
    const bookings = (data ?? []).map((b) => ({
      ...b,
      customer_name: (b.user_id ? nameMap.get(b.user_id) : null) ?? b.guest_name ?? "Gast",
      customer_avatar: null as string | null,
      service_name: (b.services as any)?.name_de ?? (b.services as any)?.name_en ?? "Service",
      staff_name: (b.staff_members as any)?.name ?? null,
    }));
    return NextResponse.json({ bookings, total: count ?? 0, page, limit }, calendar ? { headers: { "Cache-Control": "private, no-store" } } : undefined);
  }

  // ── Default: USER-scoped "my bookings" (unchanged contract → { items }).
  // Ring 10 hygiene follow-up from ring 2d: `*` shipped every bookings column (Stripe/access-token
  // internals included) here too. Trimmed to the same canonical Booking shape BookingCard.tsx /
  // the sibling /api/bookings/user route already use for a user's own bookings (id through
  // review_prompt_sent), same-user data so this is a payload-only change, not an access change.
  // Fresh Ring 10 grep (web + solen-mobile) found ZERO live callers of this branch today: the
  // actual Termine/"my bookings" page (profile/bookings, BookingsList.tsx) calls
  // /api/bookings/user?tab=..., which already got this exact trim in an earlier ring. Trimming
  // here anyway for defense in depth (an unused branch still leaks select("*") if ever re-wired).
  let query = supabase
    .from("bookings")
    .select(
      "id, user_id, salon_id, service_id, slot_id, starts_at, ends_at, price_paid, status, is_first_visit, is_recurring, sms_sent_24h, sms_sent_1h, review_prompt_sent, salons(name, slug, cover_photo_url), services(name_de, name_en, duration_minutes), staff_members(name)",
      { count: "exact" },
    )
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
  // through the service-role admin client (§10b.6, guest writes never rely on RLS).
  // resolveRequestUser (lib/auth/request-user.ts) resolves the caller from EITHER the web
  // session cookie or an iOS `Authorization: Bearer <token>` header, verifying the token
  // against the Supabase Auth server rather than trusting it; an invalid/expired Bearer token
  // returns its own 401 here (`instanceof NextResponse`), never falling through to guest.
  // Verifying a Bearer token costs an outbound round trip to the Supabase Auth server, and the
  // caller needs no credentials to make us spend it: any non-empty `Authorization: Bearer x`
  // reaches it. The cookie path never had this exposure, because `getUser()` with no session
  // cookie short-circuits without a network call, so the Bearer branch introduced it and it lands
  // BEFORE `bookingLimiter` below, which is the throttle §10b.12 put on this surface precisely so
  // it would not sit unbounded for anon. Found by the security review of this change, 2026-08-14.
  // So bound the round trip first, by IP, and only when there is a header to verify.
  // `bearerVerifyLimiter` is 30/min and is registered ABUSE_PRONE, so it fails CLOSED if Upstash
  // is ever unset in production. `generalLimiter` was the first choice and would have been wrong
  // for exactly that reason: it is not in that set, so the guard would have passed everything
  // silently on a misconfigured production boot.
  if (request.headers.get("Authorization")) {
    const authFlood = await applyRateLimit(bearerVerifyLimiter, { ip: getClientIp(request) });
    if (authFlood) return authFlood;
  }

  const resolvedUser = await resolveRequestUser(request);
  if (resolvedUser instanceof NextResponse) return resolvedUser;
  const { user, supabase } = resolvedUser;
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
          referral_code, payment_method, guest_name, guest_phone, guest_email, extra_service_ids, customer_note,
          promo_code, gift_card_code, bundle_id } = validated;
  const isOnlinePay = payment_method === "online";

  // gift_card_code is accepted by the schema (so the FE field is not a 400) but the
  // booking-charge gift-card redemption path is intentionally NOT wired here: gift cards are
  // owner-HIDDEN (2026-06-14, in favour of the Solen-wide loyalty card), and no booking-charge
  // gift-card redemption exists. Log it for visibility and drop it (no silent strip).
  if (gift_card_code) {
    console.warn("[bookings] gift_card_code received but gift-card redemption is not wired (gift cards hidden 2026-06-14); ignoring:", gift_card_code);
  }

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
  // Slot-validation select trimmed (2026-06-30): was `*, salons(*), services(*)` (every slot
  // column + the full ~98-col salon row + full service row). List ONLY the fields this handler
  // reads: slot identity / time / staff / price; the salon's scheduling, payment, vacation,
  // confirmation, policy, VAT and owner fields; the service price + names. Same data, fewer bytes.
  // Kept as ONE string literal (not concatenated) so PostgREST's TS types infer the embedded shape.
  let slotQuery = db
    .from("availability_slots")
    .select("id, salon_id, service_id, starts_at, ends_at, staff_member_id, price_override, status, salons(id, owner_id, name, address, is_active, listed_on_marketplace, is_test, auto_assign_method, daily_limit_enabled, daily_limit, online_booking_enabled, vacation_start, vacation_end, payment_mode, payment_mode_admin, payment_mode_enforced, booking_confirmation_mode, cancellation_fee_type, cancellation_fee_value, free_cancel_hours, no_show_fee_type, no_show_fee_value, vat_registered, vat_rate, vat_number), services(price, name_de, name_en, name_fr, name_it)")
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

  // Hidden-salon gate (security review, 2026-09-04): this route never checked
  // salons.is_active / listed_on_marketplace / is_test at all, so a raw API call could book
  // (and, on an online-pay salon, charge a card at) an unlisted or test salon. Same
  // three-column gate + owner/admin bypass as loadSalonDetailWithAccess (lib/salon-detail.ts),
  // reused via isSalonHidden/isViewerAdmin rather than a third copy of the check. Runs BEFORE
  // any side effect: no auto-assign pick, no duplicate-booking read, no bookings insert, no
  // slot-status update, and no Stripe call has happened yet at this point in the handler.
  const slotSalonForGate = candidateSlots[0].salons as {
    owner_id?: string;
    is_active?: boolean | null;
    listed_on_marketplace?: boolean | null;
    is_test?: boolean | null;
  } | null;
  if (slotSalonForGate && isSalonHidden(slotSalonForGate)) {
    const isSalonOwnerCaller = user?.id === slotSalonForGate.owner_id;
    const isAdminCaller = !isSalonOwnerCaller && user?.id ? await isViewerAdmin(user.id) : false;
    if (!isSalonOwnerCaller && !isAdminCaller) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }
  }

  // Phase E: pick the slot. Explicit slot_id or a specifically chosen staff → that one. "Any" staff
  // → auto-assign per the salon's auto_assign_method + per-stylist daily limit. Opt-in: the defaults
  // ('manual' + limit off) keep the previous "first available" behaviour exactly.
  const sched = candidateSlots[0].salons as { auto_assign_method?: string; daily_limit_enabled?: boolean; daily_limit?: number } | null;
  const autoMethod = sched?.auto_assign_method ?? "manual";
  const dailyLimitOn = sched?.daily_limit_enabled === true;
  const dailyLimit = Math.max(1, Number(sched?.daily_limit) || 20);
  const slotSalonId = String((candidateSlots[0] as { salon_id?: string }).salon_id ?? salon_id ?? "");
  // Zurich-local calendar day, not a raw UTC slice: a slot whose Zurich-local start is
  // between 00:00 and 02:00 sits on the previous UTC day, so a startsWith/slice prefix
  // would silently bucket it (and its daily-limit count) onto the wrong day.
  const bookingDay = zurichYmd(new Date(candidateSlots[0].starts_at as string));

  // Loose row type: the trimmed select (2026-06-30) makes PostgREST type the embedded
  // salons/services as arrays, but this is a to-one relation so the rest of the handler reads
  // them as single objects (as the `*` select implicitly allowed). Widen once here so the
  // existing object-style access (slot.salons?.name, slot.services?.price) stays valid, and so
  // the auto-assign `picked` (SlotRow) is assignable. Mirrors the file's existing `as any` style.
  type LooseSlot = Record<string, any> & { id: string; salon_id: string; starts_at: string; ends_at: string; staff_member_id: string | null; services?: { price?: number; name_de?: string; name_en?: string; name_fr?: string; name_it?: string } | null; salons?: Record<string, any> | null };
  let slot = candidateSlots[0] as unknown as LooseSlot;
  // SP-1 fix: auto-assign counting MUST use the admin (service-role) client, not `db`. For a
  // logged-in customer `db` is the RLS session client, and bookings SELECT under RLS is
  // restricted to the caller's own rows, so least_busy/round_robin balancing and the daily
  // cap would silently see only the customer's own bookings instead of the salon's real load
  // (mirrors the service-role mandate documented in lib/bookings/claim-slot.ts). Both helpers
  // are read-only counters/pickers (no INSERT/UPDATE), so the admin client here is safe.
  // 2026-09-04: this same client is now also reused below for the slot-claim UPDATE and its
  // rollback DELETEs (step 6). That write is privileged for the identical reason: the only
  // UPDATE policy on availability_slots is owner-only, and bookings has no DELETE policy at
  // all, so `db` (the customer's own session client) silently matches 0 rows on both.
  const adminForAssign = createAdminSupabaseClient();
  if (!slot_id && !staff_member_id && (autoMethod !== "manual" || dailyLimitOn)) {
    const picked = await pickSlotForAnyStaff(adminForAssign, candidateSlots as never, {
      method: autoMethod, dailyLimitOn, dailyLimit, salonId: slotSalonId, day: bookingDay,
    });
    if (!picked) {
      return NextResponse.json({ message: "Alle Stylist:innen sind an diesem Tag ausgebucht.", code: "STAFF_DAILY_LIMIT" }, { status: 409 });
    }
    slot = picked as unknown as LooseSlot;
  } else if (dailyLimitOn && slot.staff_member_id) {
    const cnt = await countStaffBookingsOnDay(adminForAssign, slotSalonId, slot.staff_member_id as string, bookingDay);
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
    // Resolved through effectivePaymentMode so an admin override that is actually enforced is the
    // authority here, not just the salon's own setting. Landed 2026-08-14: the two columns it reads
    // went live in July with no code that reads them.
    const salForMode = slot.salons as {
      payment_mode?: string | null;
      payment_mode_admin?: string | null;
      payment_mode_enforced?: boolean | null;
    } | null;
    const salPayMode = effectivePaymentMode({
      payment_mode: salForMode?.payment_mode ?? null,
      payment_mode_admin: salForMode?.payment_mode_admin ?? null,
      payment_mode_enforced: salForMode?.payment_mode_enforced ?? null,
    });
    if ((salPayMode === "deposit" || salPayMode === "prepay") && payment_method !== "online") {
      return NextResponse.json(
        { message: "This salon requires online payment.", code: "ONLINE_PAYMENT_REQUIRED" },
        { status: 400 },
      );
    }
  }

  // 2. Get user profile for is_first_visit (logged-in only — a guest has no profile row).
  // seo-comms-05: also select notification_email so step 7 below can honor the
  // customer's own "E-Mail-Benachrichtigungen" toggle before sending the confirmation.
  let profile: { is_first_visit_default?: boolean | null; locale?: string | null; notification_email?: boolean | null } | null = null;
  if (user) {
    const { data } = await db
      .from("profiles")
      .select("is_first_visit_default, locale, notification_email")
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
  let price = Math.round((Number(primaryPrice) + extrasTotal) * 100) / 100;
  const firstVisit = is_first_visit ?? profile?.is_first_visit_default ?? true;

  // A5 B-4: bundle-aware price + duration (net-new). When a bundle_id is present the server OWNS
  // the price (recomputed from pricing_mode) and the reserved duration (summed over the bundle's
  // services incl. buffer). The client value is never trusted: it only selects which bundle to
  // price against, and every constraint is re-verified against the LIVE tables.
  //   price   : replaces the standard primary+extras sum (B-4b).
  //   ends_at : widened to slot.starts_at + total bundle duration (B-4a), which arms the GIST
  //             exclusion constraint (prevent_double_booking) over the wider window when the slot
  //             flips to 'booked' (the SAME conflict mechanism the calendar PATCH relies on).
  let bundleEndsAt: string | null = null;
  let validBundleId: string | null = null;
  if (bundle_id) {
    // A5 FIX-2: load + guard + price the bundle via the shared util (admin client: RLS hides
    // is_active=false bundles, and the bundle must be re-checkable regardless of read scope).
    // The util runs Guards 1-4 (exists+active+salon, >=2 items, exact selected-set match, every
    // item live+active+in-salon) and recomputes the price from pricing_mode; same numbers as the
    // display endpoint + pay-intent by construction. Its typed error code maps to the same 400s.
    const admin = createAdminSupabaseClient();
    const selectedIds = [...new Set([service_id, ...(extra_service_ids ?? [])])];
    const result = await loadPricedBundle(admin, {
      bundleId: bundle_id,
      salonId: slot.salon_id,
      selectedServiceIds: selectedIds,
    });
    if (!result.ok) {
      // FIX-3: machine error code + message, matching EVERY other 400 in this route's
      // { message, code } shape (the client translates by `code`; `message` is the
      // English fallback, same convention as GUEST_INFO_REQUIRED / SLOT_TAKEN above).
      // BUNDLE_MISMATCH = selected services != the bundle's item set; BUNDLE_UNAVAILABLE =
      // stale/inactive/<2-items/missing bundle.
      const message = result.code === "BUNDLE_MISMATCH"
        ? "Selected services do not match the bundle"
        : "Bundle not available";
      return NextResponse.json({ message, code: result.code }, { status: 400 });
    }
    const pricedBundle = result.bundle;

    // B-4b PRICE: the util already recomputed from pricing_mode (CHF, 2dp). services.price +
    // custom_price are CHF DECIMAL; the Stripe boundary converts *100, not here.
    price = pricedBundle.priceChf;

    // B-4a DURATION: reserve the SUMMED duration (duration_minutes + buffer_minutes) of every
    // bundle service. Today extras never extend time (by design for add-ons); a bundle does.
    const startMs = new Date(slot.starts_at as string).getTime();
    bundleEndsAt = new Date(startMs + pricedBundle.totalMinutes * 60_000).toISOString();
    validBundleId = pricedBundle.id;

    // AVAILABILITY (B-4a): the primary slot only covers the single-service window; a bundle needs
    // the WIDENED window free for this staff member. Reuse the EXISTING conflict mechanism
    // (prevent_double_booking GIST over booked/blocked slots per staff, 20260328_...gist.sql) by
    // pre-checking any booked/blocked slot for the same staff whose [starts_at, ends_at) overlaps
    // the widened window. Two ranges [a,b) and [c,d) overlap iff a < d AND c < b. This is a
    // fail-fast pre-check; the constraint itself is the hard backstop when the slot flips to booked.
    const conflictStaffId = (staff_member_id ?? slot.staff_member_id) as string | null;
    if (conflictStaffId) {
      const { data: overlaps } = await admin
        .from("availability_slots")
        .select("id")
        .eq("salon_id", slot.salon_id)
        .eq("staff_member_id", conflictStaffId)
        .in("status", ["booked", "blocked"])
        .lt("starts_at", bundleEndsAt)            // existing.starts_at < window.ends_at
        .gt("ends_at", slot.starts_at as string)  // existing.ends_at   > window.starts_at
        .neq("id", resolvedSlotId)                // the slot we are about to book is not a conflict
        .limit(1);
      if (overlaps?.length) {
        return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
      }
    }
  }

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
  // Includes "pending_approval" (manual-approval salons, migration 075) alongside
  // pending/confirmed, otherwise clicking back repeatedly on a manual-approval salon
  // slips past this guard entirely (audit finding #13).
  {
    let dupQuery = db
      .from("bookings")
      .select("id")
      .eq("salon_id", slot.salon_id)
      .eq("starts_at", slot.starts_at)
      .in("status", ["pending", "pending_approval", "confirmed"])
      .limit(1);
    dupQuery = user ? dupQuery.eq("user_id", user.id) : dupQuery.eq("guest_phone", guest_phone!);
    const { data: dup } = await dupQuery;
    if (dup?.length) {
      return NextResponse.json(
        { message: "Sie haben diesen Termin bereits gebucht.", code: "DUPLICATE_BOOKING" },
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
      // A5 B-4a: a bundle reserves the SUMMED duration, so ends_at is widened past the single
      // slot's end. The non-bundle path is unchanged (ends_at = the primary slot's end).
      ends_at: bundleEndsAt ?? slot.ends_at,
      // A5 B-4: tag the booking with the bundle it was priced against (null for a normal booking).
      bundle_id: validBundleId,
      price_paid: price,
      extras_addons: extrasAddons.length ? JSON.stringify(extrasAddons) : null,
      status: bookingStatus,
      payment_status: isOnlinePay ? "none" : undefined,
      is_first_visit: firstVisit,
      // Lane A consent (SP-AC): frozen policy terms + acceptance timestamp, written for
      // EVERY booking (guest + logged-in). Gates the cancellation/no-show auto-charge.
      customer_note: customer_note?.trim() || null,
      // Promo fix (2026-06-30): persist the code the customer applied so booking-pay-intent
      // (which only receives booking_id) can RE-VALIDATE it server-side and subtract the
      // discount, reserving the use atomically at checkout (reserve_promo_use), not via a
      // later webhook increment. Stored uppercased (schema normalizes). Its presence here
      // grants NO discount: every constraint
      // (active / expiry / usage / min-spend / applicability / min_tier) is re-checked at charge.
      promo_code: promo_code || null,
      // Referral fix: persist the code ON the booking (referral completion now only
      // runs once THIS booking is actually confirmed, see step 9 below and the
      // payment_intent.succeeded branch of app/api/stripe/webhook/route.ts, which
      // reads it back off the row for the online-pay path).
      referral_code: referral_code || null,
      policy_accepted_at: new Date().toISOString(),
      policy_snapshot: policySnapshot,
    })
    .select()
    .single();

  if (bookingError) {
    // enforce_staff_daily_limit trigger (ring 16, race-CAS): a concurrent request filled the
    // last slot for this stylist/day between our pre-check above and this INSERT. Map the
    // trigger's RAISE to a clean 409 for the race loser instead of a 500 (the trigger is live
    // but dormant today, 0 salons use the daily cap, so this is cheap race-loser politeness).
    if (bookingError.message?.includes("staff_daily_limit_reached")) {
      return NextResponse.json(
        { error: "Diese:r Stylist:in ist an diesem Tag ausgebucht.", message: "Diese:r Stylist:in ist an diesem Tag ausgebucht.", code: "STYLIST_FULLY_BOOKED" },
        { status: 409 },
      );
    }
    // Race-loser unique violation (bookings_one_active_per_slot, Postgres 23505): two requests
    // both passed the pre-insert availability read above for the identical slot, and the loser's
    // own INSERT (not claimSlot below, which only runs after this succeeds) hit the index. That
    // used to fall through to the generic DB_ERROR 500 below, leaking the raw Postgres constraint
    // text ("duplicate key value violates unique constraint ...") to the client. Same 409 shape as
    // every other lost-the-race response in this route (SLOT_TAKEN, reused verbatim); the raw
    // constraint text stays server-side in the console.error only.
    if (bookingError.code === "23505" || bookingError.message?.includes("bookings_one_active_per_slot")) {
      console.error("[bookings] insert lost the race on bookings_one_active_per_slot:", bookingError);
      return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ message: bookingError.message, code: "DB_ERROR" }, { status: 500 });
  }

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
  //    ON DELETE SET NULL / nullable).
  //    SECURITY FIX (2026-09-04): this write is privileged and MUST go through the service-role
  //    client, never `db`. For a logged-in customer `db` is the RLS session client, and the only
  //    UPDATE policy on availability_slots is owner-only (`salons.owner_id = auth.uid()`), so a
  //    customer's own UPDATE matches 0 rows and returns no Postgres error: the slot silently
  //    never flips to 'booked' and a second customer can book the identical time. `bookings` has
  //    no DELETE policy at all either, so every rollback below has the same silent-no-op failure
  //    mode and must run through the same privileged client. `claimSlot()`
  //    (lib/bookings/claim-slot.ts) is THE single place this CAS pattern lives (already used by
  //    the reschedule route) and its own doc comment already named this exact requirement, so it
  //    is reused here rather than a second hand-rolled update. `adminForAssign` (declared above)
  //    is the service-role client guest bookings already write through via `db`.
  //    A5 B-4a: for a bundle, WIDEN the slot's ends_at to the summed bundle window as it flips
  //    to 'booked'. This makes the prevent_double_booking GIST exclusion constraint the HARD
  //    backstop over the wider [starts_at, bundleEndsAt) range (the pre-check above is fail-fast;
  //    the constraint closes any race). A 23P01 here means the window was taken between the
  //    pre-check and this write: undo the just-inserted booking and return the route's 409.
  const slotClaimFields: Record<string, unknown> = { booked_by: user?.id ?? null, booking_id: booking.id };
  if (bundleEndsAt) slotClaimFields.ends_at = bundleEndsAt;
  // claimSlot() is the TOCTOU guard (audit fix B): its UPDATE only matches the slot if it is
  // STILL 'available', so two concurrent requests that both passed the read-time check above
  // cannot both win here.
  const { claimed: slotClaimed, error: slotUpdateError } = await claimSlot(adminForAssign, resolvedSlotId, slotClaimFields);
  if (slotUpdateError) {
    if (slotUpdateError.code === "23P01") {
      // Widened window collided with another booked/blocked slot for this staff. Roll back the
      // booking row we just wrote (no slot was flipped) so no orphan/unheld booking remains.
      console.error("[bookings] slot claim GIST conflict on widened bundle window, rolling back booking:", booking.id, slotUpdateError);
      await adminForAssign.from("bookings").delete().eq("id", booking.id);
      return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
    }
    // Audit finding #14: any OTHER slot-flip error was previously logged and swallowed, letting
    // the route fall through to a 201 with the booking created but the slot never marked booked
    // (re-bookable by anyone). Fail safe: roll back the just-inserted booking on ANY slot-flip
    // error, mirroring the 23P01 branch above.
    console.error("[bookings] slot booking update failed:", booking.id, slotUpdateError);
    await adminForAssign.from("bookings").delete().eq("id", booking.id);
    return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
  } else if (!slotClaimed) {
    // 0 rows matched: the slot was claimed by another request between the read and this write
    // (or is otherwise no longer 'available'). This is a FAILURE, not a quiet miss, log it
    // loudly, this exact case used to be invisible when it ran through the RLS session client.
    // Roll back the booking row we just inserted so no orphan/unheld booking remains.
    console.error("[bookings] slot claim matched 0 rows (lost race or already booked), rolling back booking:", booking.id, "slot:", resolvedSlotId);
    await adminForAssign.from("bookings").delete().eq("id", booking.id);
    return NextResponse.json({ message: "Slot not available", code: "SLOT_TAKEN" }, { status: 409 });
  }

  // 7. Send confirmation email to customer.
  // SP-G2: skip for online-pay bookings — they aren't confirmed/paid yet. The
  // Stripe webhook sends the confirmation once the full-prepay PI succeeds.
  // SP-1: a guest has no session email — use guest_email when given, else SKIP (no address).
  const locale = (profile?.locale ?? "de") as "de" | "en" | "fr" | "it";
  // Shared de->en fallback picker (lib/i18n/localized-field.ts), not a de/en-only ternary:
  // that ternary showed fr/it customers the German name with no fr/it branch to notice.
  const serviceName = localizedField(slot.services as Record<string, unknown> | null, "name", locale) || "Service";
  const salonName = slot.salons?.name ?? "Salon";
  const bookingDate = new Date(slot.starts_at).toLocaleDateString(resolveSwissLocale(locale));
  const bookingTime = new Date(slot.starts_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" });

  const customerEmail = user?.email ?? guest_email ?? null;
  // seo-comms-05: profile.notification_email defaults to true (matches the ?? true fallback
  // used everywhere else this column is read); a guest has no profile row and always gets
  // the confirmation, since a guest has no toggle to have set in the first place.
  const customerWantsEmail = profile?.notification_email !== false;
  if (!isOnlinePay && customerEmail && customerWantsEmail) {
    try {
      // Price + VAT-inclusive breakdown (registered salon → Netto/MWST/Gesamt + UID; else just
      // the total). slot.salons carries vat_registered/vat_rate/vat_number (selected explicitly above).
      const salonVat = slot.salons as { vat_registered?: boolean; vat_rate?: number; vat_number?: string } | null;
      const grossRappen = Math.round(Number(price ?? 0) * 100);
      const { computeVat } = await import("@/lib/vat");
      const evb = salonVat?.vat_registered && grossRappen > 0
        ? computeVat(grossRappen, { registered: true, ratePercent: salonVat.vat_rate ?? 8.1 })
        : null;
      // seo-comms-09: manage link differs for a logged-in customer (their own bookings
      // list) vs. a guest (the code-based lookup page, they have no account to log into).
      const manageUrl = user
        ? `https://solen.ch/${locale}/profile/bookings`
        : `https://solen.ch/${locale}/booking/lookup`;
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
          address: (slot.salons as { address?: string } | null)?.address ?? undefined,
          manageUrl,
          icsStartsAt: slot.starts_at,
          icsEndsAt: slot.ends_at,
          bookingId: booking.id,
        },
        locale
      );
      await sendEmail(emailData);
    } catch (err) {
      console.error("[bookings] customer confirmation email failed:", err);
      await reportError("booking-confirmation-email", err, { bookingId: booking.id });
    }
  }

  // 8. Notify salon owner about the new booking (deferred for online-pay until
  //    payment succeeds — the webhook owns the confirmed-booking notifications).
  try {
    const ownerId = (slot.salons as any)?.owner_id;
    if (ownerId && !isOnlinePay) {
      const admin = createAdminSupabaseClient();
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("id, locale")
        .eq("id", ownerId)
        .single();
      // Fetch the owner's auth email via admin auth API
      const { data: ownerAuthUser } = await admin.auth.admin.getUserById(ownerId);
      const ownerEmail = ownerAuthUser?.user?.email;
      if (ownerEmail && ownerProfile) {
        // Fixed 2026-07-27 (A9-email-locale): the owner's own profile.locale is now fetched
        // (was id-only), replacing the hardcoded "de" default so a non-German salon owner
        // gets the new-booking notification in their own language.
        const ownerLocale = (ownerProfile.locale ?? "de") as "de" | "en" | "fr" | "it";
        const ownerEmailData = salonNewBooking(
          ownerEmail,
          {
            // SP-1: guest has no session email, fall back to the guest name, then "Gast".
            customerName: user?.email ?? guest_name ?? "Gast",
            service: serviceName,
            date: bookingDate,
            time: bookingTime,
            price,
          },
          ownerLocale
        );
        await sendEmail(ownerEmailData);
      }
    }
  } catch (err) { console.error("[bookings] owner notification email failed:", err); }

  // 9. Complete referral on a CONFIRMED first booking, instant / in-person only.
  //    SP-1: referrals reward `referred_user_id = user.id`; a guest has no user id, so this is a
  //    logged-in-only feature. Guarding on `user` leaves the logged-in behavior unchanged.
  //    Reward-farming fix: this used to run (and pay out CHF 10/CHF 10) at booking CREATE
  //    time, gated on a COUNT that excluded the just-created pending/pending_approval row,
  //    so isFirstBooking was always true and the credits were issued before any payment.
  //    Now gated on bookingStatus === "confirmed" (instant confirm or in-person, see step
  //    T&S above), which is the ONLY status this route ever inserts a booking as WITHOUT a
  //    pending payment/approval step in between. The online-pay path (bookingStatus
  //    "pending") completes the referral later, in the Stripe webhook's
  //    payment_intent.succeeded handler, once payment has actually succeeded.
  if (referral_code && user && bookingStatus === "confirmed") {
    try {
      const admin = createAdminSupabaseClient();
      await completeReferralForFirstBooking(admin, user.id, referral_code);
    } catch (err) {
      console.error("[bookings] referral completion failed:", err);
    }
  }

  // 10. Search→book attribution (points/affinity funnel). Best-effort, must NEVER break a booking.
  //     /api/search/event sets an httpOnly solen_se_sid cookie (path "/") on every search; if a
  //     recent click in that session led to THIS salon, flip search_events.booked + stamp the
  //     booking (last-touch, 60-min window). No-op without a session/consent or a matching click.
  try {
    const searchSid = request.cookies.get("solen_se_sid")?.value;
    if (searchSid) {
      const admin = createAdminSupabaseClient();
      await attributeBookingToSearch(admin, { sessionId: searchSid, salonId: slot.salon_id as string, bookingId: booking.id });
    }
  } catch (err) {
    console.error("[bookings] search→book attribution failed:", err);
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
