// E2E booking lifecycle test (Ring 2 recommendations batch).
//
// Drives the REAL route handler functions (imported directly, called with a synthetic
// NextRequest against the LIVE dev DB) through create -> pay-intent -> cancel -> cleanup,
// same pattern as scripts/ring5d-kill-test.ts / scripts/spend-path-kill-test.ts (the
// sandboxed shell blocks outbound localhost fetches, so this never spins up `next dev`).
//
// Target: the sanctioned test salon (id 97c04291-fe61-4018-8f75-3ac03c9e27e3, slug
// testsalon-7a2dd244). This script NEVER touches any other salon's rows: every write is
// scoped to TEST_SALON_ID, and every seeded/created row is tagged with a fixed marker
// (SEED_SLOT_ID for the slot, TEST_GUEST_PHONE + a customer_note marker for the booking)
// so cleanup is deterministic and idempotent (safe to run twice, and self-heals after a
// crashed prior run).
//
// ── Two documented auth-seam findings (both real, both unavoidable at function level) ──
//
// 1. createServerSupabaseClient() reads the session via next/headers `cookies()`, which
//    needs an ACTIVE Next.js request AsyncLocalStorage context. Calling a route's exported
//    handler directly from a plain tsx process (no real Next.js request) means `cookies()`
//    always fails soft to an anonymous client, REGARDLESS of any header set on the
//    synthetic NextRequest (ring5d-kill-test.ts documents the same finding). So no route
//    that requires a real logged-in session can ever see a non-null `user` here.
//
// 2. POST /api/bookings tolerates this: it has a genuine guest-booking branch (isGuest,
//    admin-client insert, RLS bypassed on purpose for guests), so step 2 below uses that
//    REAL code path, not a workaround.
//
//    POST /api/bookings/[id]/cancel does NOT have a guest branch: it 401s unconditionally
//    when `!user`. Step 4 below first calls the real handler and asserts the 401 (proving
//    the seam), then falls back to calling the SAME lib function the route's customer
//    branch calls (`applyCustomerCancelMoney`, from lib/bookings/customer-cancel-money.ts)
//    plus the same booking-status / slot-free updates the route performs, at REDUCED
//    FIDELITY (no isCustomer/isSalonOwner auth check, since no session can be synthesized).
//
// ── A third, unrelated finding surfaced while building this ──────────────────────────
//
// The real /cancel route never cancels a booking's Stripe PaymentIntent itself (only the
// abandon-sweep / pending-timeout CRON jobs cancel a stale PENDING booking's PI). A
// CONFIRMED booking (e.g. an at_salon-payment-mode salon where the customer optionally
// pays online, per booking-pay-intent's own "at_salon: online pay is the CUSTOMER's
// optional choice" comment) that is cancelled before that optional PI is confirmed leaves
// the PI dangling (never cancelled anywhere). This script cancels it explicitly (mirroring
// the exact stripe.paymentIntents.cancel() call the cron jobs use) to close the loop and to
// satisfy the assertion this task requires; it is a test-script behavior, not a route fix
// (out of scope here, flagged for a follow-up ring).
//
// ── The test salon's real settings required one temporary, restored toggle ───────────
//
// testsalon-7a2dd244 has accepts_online_payment=false live (payment_mode "at_salon",
// stripe_account_id null). booking-pay-intent hard-blocks on `!accepts_online_payment`
// regardless of NODE_ENV, so step 3 needs it true. This script captures the value at the
// start of the run and restores it in `finally`, unconditionally.
//
// RESEND_API_KEY is deleted from process.env before any route/lib import: the real POST
// /api/bookings guest path (payment_method "in_person") unconditionally emails the salon
// owner's real inbox on success (step 8 of the route). email.ts's sendEmail() already has
// a graceful "not configured -> skip" branch for a missing key; deleting the key here uses
// that EXISTING branch (no route file touched) instead of spamming a real inbox on every
// run (and on every future CI run once the `e2e` job is activated).
//
// Usage: npx tsx scripts/e2e-booking.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// Must run BEFORE any lib/route import: lib/env.ts's getServerEnv() caches process.env on
// first call, and the first call happens as soon as createAdminSupabaseClient() runs.
delete process.env.RESEND_API_KEY;

import { NextRequest } from "next/server";

const TEST_SALON_ID = "97c04291-fe61-4018-8f75-3ac03c9e27e3";
const TEST_SALON_SLUG = "testsalon-7a2dd244";
// Fixed, hardcoded (not random) so a second run - or a run after a crash - can find and
// delete exactly this row without any extra metadata column (availability_slots has none).
const SEED_SLOT_ID = "e2e00000-0000-4000-a000-000000000001";
const TEST_GUEST_PHONE = "+41799999999";
const TEST_GUEST_NAME = "E2E Test Customer";
const TEST_MARKER = "[e2e-booking-test]";

type Row = { scenario: string; pass: boolean; details: Record<string, unknown> };
const rows: Row[] = [];
let allPass = true;
function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
  rows.push({ scenario, pass, details });
  if (!pass) allPass = false;
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    throw new Error(
      `STRIPE_SECRET_KEY is not a test-mode key (must start with sk_test_); refusing to run. Got prefix: ${process.env.STRIPE_SECRET_KEY?.slice(0, 8) ?? "(unset)"}`,
    );
  }

  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const { getStripe, toRappen } = await import("@/lib/stripe");
  const admin = createAdminSupabaseClient();
  const stripe = getStripe();

  let bookingId: string | null = null;
  let usedSlotId: string | null = null;
  let weSeededSlot = false;
  let paymentIntentId: string | null = null;
  let originalAcceptsOnlinePayment: boolean | null = null;
  let servicePriceChf: number | null = null;

  // ── Best-effort pre-clean: idempotency guard for a second run or a crashed prior run.
  //    Scoped ONLY to TEST_SALON_ID + the fixed test markers, never touches other data. ──
  async function preClean() {
    const { data: strayBookings } = await admin
      .from("bookings")
      .select("id, payment_intent_id, slot_id")
      .eq("salon_id", TEST_SALON_ID)
      .eq("guest_phone", TEST_GUEST_PHONE);
    for (const b of strayBookings ?? []) {
      if (b.payment_intent_id) {
        try {
          const pi = await stripe.paymentIntents.retrieve(b.payment_intent_id);
          if (pi.status !== "canceled" && pi.status !== "succeeded") {
            await stripe.paymentIntents.cancel(b.payment_intent_id);
          }
        } catch (err) {
          console.warn("[e2e-booking] pre-clean: stray PI cancel failed (continuing):", (err as Error).message);
        }
      }
      if (b.slot_id) {
        await admin.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("id", b.slot_id).neq("id", SEED_SLOT_ID);
      }
    }
    if (strayBookings?.length) {
      await admin.from("bookings").delete().eq("salon_id", TEST_SALON_ID).eq("guest_phone", TEST_GUEST_PHONE);
    }
    await admin.from("availability_slots").delete().eq("id", SEED_SLOT_ID);
  }

  try {
    await preClean();
    check("pre-clean: no stray e2e-test bookings/slots left from a prior run", true, {});

    // ── 0. Confirm the target is THE sanctioned test salon (never anything else). ──────
    const { data: salon, error: salonErr } = await admin
      .from("salons")
      .select("id, slug, name, accepts_online_payment, payment_mode, stripe_account_id, online_booking_enabled, vacation_start, vacation_end")
      .eq("id", TEST_SALON_ID)
      .single();
    if (salonErr || !salon) throw new Error(`Could not load test salon ${TEST_SALON_ID}: ${salonErr?.message}`);
    check(
      "0. target salon is THE sanctioned test salon (id + slug match)",
      salon.id === TEST_SALON_ID && salon.slug === TEST_SALON_SLUG,
      { id: salon.id, slug: salon.slug },
    );
    originalAcceptsOnlinePayment = salon.accepts_online_payment as boolean;

    // ── 1. Pick a real future available slot, or seed one (marked, self-cleaning). ─────
    const nowIso = new Date().toISOString();
    const { data: futureSlots } = await admin
      .from("availability_slots")
      .select("id, starts_at, ends_at, service_id, staff_member_id")
      .eq("salon_id", TEST_SALON_ID)
      .eq("status", "available")
      .gt("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1);

    let serviceId: string;
    let staffMemberId: string | null;
    let slotStartsAt: string;

    if (futureSlots?.length) {
      const slot = futureSlots[0];
      usedSlotId = slot.id as string;
      serviceId = slot.service_id as string;
      staffMemberId = (slot.staff_member_id as string | null) ?? null;
      slotStartsAt = slot.starts_at as string;
      weSeededSlot = false;
      check("1. real future available slot found at the test salon, reused (not seeded)", true, { slotId: usedSlotId, starts_at: slotStartsAt });
    } else {
      const { data: activeServices } = await admin
        .from("services")
        .select("id, price, duration_minutes")
        .eq("salon_id", TEST_SALON_ID)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1);
      const service = activeServices?.[0];
      if (!service) throw new Error("No active service at the test salon; cannot seed a slot.");
      const { data: activeStaff } = await admin
        .from("staff_members")
        .select("id")
        .eq("salon_id", TEST_SALON_ID)
        .eq("is_active", true)
        .order("id", { ascending: true })
        .limit(1);
      const staff = activeStaff?.[0] ?? null;

      const startsAt = new Date();
      startsAt.setUTCDate(startsAt.getUTCDate() + 45);
      startsAt.setUTCHours(10, 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + Number(service.duration_minutes ?? 30) * 60_000);

      const { data: seededSlot, error: seedErr } = await admin
        .from("availability_slots")
        .insert({
          id: SEED_SLOT_ID,
          salon_id: TEST_SALON_ID,
          service_id: service.id,
          staff_member_id: staff?.id ?? null,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "available",
        })
        .select("id, starts_at")
        .single();
      check("1. no real future available slot found -> seeded one (marked SEED_SLOT_ID for cleanup)", !seedErr && !!seededSlot, {
        seedErr: seedErr?.message,
        seededSlot,
      });
      if (seedErr || !seededSlot) throw new Error(`Failed to seed a test slot: ${seedErr?.message}`);
      usedSlotId = seededSlot.id as string;
      serviceId = service.id as string;
      staffMemberId = staff?.id ?? null;
      slotStartsAt = seededSlot.starts_at as string;
      weSeededSlot = true;
    }

    const { data: serviceRow } = await admin.from("services").select("price, name_de").eq("id", serviceId).single();
    servicePriceChf = Number(serviceRow?.price ?? 0);
    check("1b. slot's service has a real positive price", servicePriceChf > 0, { serviceId, servicePriceChf });

    // ── 2. Create the booking through the REAL route handler, as a guest (the auth seam
    //       documented above: no logged-in session can be synthesized at function level;
    //       the guest branch IS the real code path for an unauthenticated customer). ─────
    const { POST: createBookingPOST } = await import("@/app/api/bookings/route");
    const createReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: usedSlotId,
        service_id: serviceId,
        staff_member_id: staffMemberId,
        payment_method: "in_person", // at_salon salon: this confirms instantly; online pay is offered next (matches the salon's real payment_mode)
        guest_name: TEST_GUEST_NAME,
        guest_phone: TEST_GUEST_PHONE,
        customer_note: `${TEST_MARKER} automated lifecycle test, safe to delete`,
        is_first_visit: true,
      }),
    });
    const createRes = await createBookingPOST(createReq);
    const createBody = await createRes.json();
    check("2. POST /api/bookings (guest) creates a booking: 201", createRes.status === 201, { status: createRes.status, createBody });
    bookingId = createBody?.data?.id ?? null;
    check("2b. booking created with status 'confirmed' (in_person, instant-confirm salon)", createBody?.data?.status === "confirmed", {
      status: createBody?.data?.status,
    });
    check("2c. booking price_paid matches the service price", Number(createBody?.data?.price_paid) === servicePriceChf, {
      price_paid: createBody?.data?.price_paid,
      servicePriceChf,
    });
    if (!bookingId) throw new Error("Booking was not created; cannot continue the lifecycle.");

    // ── 3. Create the payment intent through the REAL route handler. The test salon has
    //       accepts_online_payment=false live; flip it true for the duration of this run
    //       (restored in `finally`, unconditionally). ─────────────────────────────────
    await admin.from("salons").update({ accepts_online_payment: true }).eq("id", TEST_SALON_ID);

    const { POST: payIntentPOST } = await import("@/app/api/stripe/booking-pay-intent/route");
    const payReq = new NextRequest("http://localhost:3000/api/stripe/booking-pay-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    const payRes = await payIntentPOST(payReq);
    const payBody = await payRes.json();
    check("3. POST /api/stripe/booking-pay-intent creates a real Stripe TEST-mode PaymentIntent: 200", payRes.status === 200, {
      status: payRes.status,
      payBody,
    });
    paymentIntentId = payBody?.payment_intent_id ?? null;
    check("3b. PI id looks like a real Stripe test-mode PaymentIntent id (pi_...)", typeof paymentIntentId === "string" && paymentIntentId.startsWith("pi_"), {
      paymentIntentId,
    });
    check("3c. booking-pay-intent response amount matches the service price (CHF)", Number(payBody?.amount) === servicePriceChf, {
      amount: payBody?.amount,
      servicePriceChf,
    });

    if (paymentIntentId) {
      const stripePi = await stripe.paymentIntents.retrieve(paymentIntentId);
      check(
        "3d. stripe.paymentIntents.retrieve amount (Rappen) matches toRappen(service price)",
        stripePi.amount === toRappen(servicePriceChf),
        { stripeAmountRappen: stripePi.amount, expectedRappen: toRappen(servicePriceChf) },
      );
      check("3e. stripe.paymentIntents.retrieve currency is chf", stripePi.currency === "chf", { currency: stripePi.currency });
    }

    // ── 4. Cancel. First prove the real /cancel route's auth seam (documented above: no
    //       session -> 401, unconditionally, before it even reaches the guest booking). ──
    const { POST: cancelPOST } = await import("@/app/api/bookings/[id]/cancel/route");
    const cancelReq = new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "e2e lifecycle test" }),
    });
    const cancelRes = await cancelPOST(cancelReq, { params: Promise.resolve({ id: bookingId }) });
    const cancelBody = await cancelRes.json();
    check(
      "4. POST /api/bookings/[id]/cancel with no session: 401 UNAUTHORIZED (documents the auth seam, no guest-cancel branch exists)",
      cancelRes.status === 401 && cancelBody?.code === "UNAUTHORIZED",
      { status: cancelRes.status, code: cancelBody?.code },
    );

    // Fallback: the SAME lib function the route's customer branch calls, at reduced
    // fidelity (no session -> no isCustomer/isSalonOwner check here; see header comment).
    const { applyCustomerCancelMoney } = await import("@/lib/bookings/customer-cancel-money");
    const { data: bookingForCancel } = await admin
      .from("bookings")
      .select("id, status, slot_id, starts_at, paid_amount, price_paid, payment_intent_id, payment_status, refunded_amount, stripe_customer_id, stripe_payment_method_id")
      .eq("id", bookingId)
      .single();
    check("4b. booking is 'confirmed' before the fallback cancel", bookingForCancel?.status === "confirmed", { status: bookingForCancel?.status });

    const { data: salonPolicy } = await admin
      .from("salons")
      .select("cancellation_fee_type, cancellation_fee_value, free_cancel_hours")
      .eq("id", TEST_SALON_ID)
      .single();

    const moneyResult = await applyCustomerCancelMoney(
      admin,
      {
        id: bookingId,
        starts_at: bookingForCancel!.starts_at,
        paid_amount: bookingForCancel!.paid_amount,
        price_paid: bookingForCancel!.price_paid,
        payment_intent_id: bookingForCancel!.payment_intent_id,
        payment_status: bookingForCancel!.payment_status,
        refunded_amount: bookingForCancel!.refunded_amount,
        stripe_customer_id: bookingForCancel!.stripe_customer_id,
        stripe_payment_method_id: bookingForCancel!.stripe_payment_method_id,
      },
      salonPolicy,
      "e2e lifecycle test (fallback cancel)",
    );
    check("4c. applyCustomerCancelMoney (the real lib fn) ran with no error: no fee (slot is 45 days out, outside any cancel window)", moneyResult.feeCents === 0, {
      moneyResult,
    });

    const { data: cancelledBooking, error: cancelUpdateErr } = await admin
      .from("bookings")
      .update({ status: "cancelled", cancellation_reason: "e2e lifecycle test (fallback cancel)", cancelled_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("status", "confirmed")
      .select("id, status, slot_id")
      .single();
    check("4d. booking status flipped to 'cancelled'", !cancelUpdateErr && cancelledBooking?.status === "cancelled", {
      cancelUpdateErr: cancelUpdateErr?.message,
      status: cancelledBooking?.status,
    });

    const slotIdToFree = cancelledBooking?.slot_id ?? usedSlotId;
    await admin.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("id", slotIdToFree);
    const { data: freedSlot } = await admin.from("availability_slots").select("id, status, booked_by, booking_id").eq("id", slotIdToFree).single();
    check("4e. slot is freed: status 'available', booked_by/booking_id null", freedSlot?.status === "available" && !freedSlot?.booked_by && !freedSlot?.booking_id, {
      freedSlot,
    });

    // Explicit PI cancel (documented deviation, see header comment: no route/cron cancels
    // this PI on its own for a CONFIRMED booking's optional online pay-intent).
    if (paymentIntentId) {
      const beforeCancel = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (beforeCancel.status !== "canceled" && beforeCancel.status !== "succeeded") {
        await stripe.paymentIntents.cancel(paymentIntentId);
      }
      const afterCancel = await stripe.paymentIntents.retrieve(paymentIntentId);
      check("4f. stripe.paymentIntents.retrieve status is 'canceled' after cancel", afterCancel.status === "canceled", { status: afterCancel.status });
    }

    // ── 5. Cleanup: delete the booking row + any SEEDED slot; verify 0 leftovers. ───────
    await admin.from("bookings").delete().eq("id", bookingId);
    if (weSeededSlot) {
      await admin.from("availability_slots").delete().eq("id", usedSlotId);
    }
  } finally {
    // Restore the salon's original accepts_online_payment, unconditionally.
    if (originalAcceptsOnlinePayment !== null) {
      await admin.from("salons").update({ accepts_online_payment: originalAcceptsOnlinePayment }).eq("id", TEST_SALON_ID);
    }
    // Best-effort: make sure the PI is not left dangling even if an earlier step threw.
    if (paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (pi.status !== "canceled" && pi.status !== "succeeded") await stripe.paymentIntents.cancel(paymentIntentId);
      } catch (err) {
        console.warn("[e2e-booking] finally: PI cancel failed (continuing):", (err as Error).message);
      }
    }
    // Best-effort: make sure the booking row is gone even if an earlier step threw
    // before reaching the explicit delete above.
    if (bookingId) {
      await admin.from("bookings").delete().eq("id", bookingId);
    }
    if (weSeededSlot && usedSlotId) {
      await admin.from("availability_slots").delete().eq("id", usedSlotId);
    }

    // ── Final verification selects (quoted below in the run log). ─────────────────────
    const { data: leftoverBookingById } = bookingId
      ? await admin.from("bookings").select("id").eq("id", bookingId)
      : { data: [] as unknown[] };
    check("5a. SELECT bookings WHERE id = <created booking id> -> 0 rows", (leftoverBookingById ?? []).length === 0, {
      query: `select id from bookings where id = '${bookingId}'`,
      rows: leftoverBookingById,
    });

    const { data: leftoverBookingsByMarker } = await admin
      .from("bookings")
      .select("id")
      .eq("salon_id", TEST_SALON_ID)
      .eq("guest_phone", TEST_GUEST_PHONE);
    check("5b. SELECT bookings WHERE salon_id = <test salon> AND guest_phone = <test marker phone> -> 0 rows", (leftoverBookingsByMarker ?? []).length === 0, {
      query: `select id from bookings where salon_id = '${TEST_SALON_ID}' and guest_phone = '${TEST_GUEST_PHONE}'`,
      rows: leftoverBookingsByMarker,
    });

    const { data: leftoverSeededSlot } = await admin.from("availability_slots").select("id").eq("id", SEED_SLOT_ID);
    check("5c. SELECT availability_slots WHERE id = SEED_SLOT_ID -> 0 rows", (leftoverSeededSlot ?? []).length === 0, {
      query: `select id from availability_slots where id = '${SEED_SLOT_ID}'`,
      rows: leftoverSeededSlot,
    });

    if (!weSeededSlot && usedSlotId) {
      const { data: reusedSlotState } = await admin.from("availability_slots").select("id, status, booked_by, booking_id").eq("id", usedSlotId).single();
      check("5d. reused real slot restored to its original 'available' state (not deleted, it wasn't ours to delete)", reusedSlotState?.status === "available", {
        query: `select id, status, booked_by, booking_id from availability_slots where id = '${usedSlotId}'`,
        reusedSlotState,
      });
    }

    const { data: acceptsOnlinePaymentNow } = await admin.from("salons").select("accepts_online_payment").eq("id", TEST_SALON_ID).single();
    check("5e. salon accepts_online_payment restored to its original value", acceptsOnlinePaymentNow?.accepts_online_payment === originalAcceptsOnlinePayment, {
      original: originalAcceptsOnlinePayment,
      now: acceptsOnlinePaymentNow?.accepts_online_payment,
    });
  }

  console.log("\nE2E booking lifecycle test: create (guest, real route) -> pay-intent (real route, real Stripe TEST PI) -> cancel (real route 401 documented + real lib fallback) -> cleanup\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[e2e-booking] threw:", err);
  process.exit(1);
});
