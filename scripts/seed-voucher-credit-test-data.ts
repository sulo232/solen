// Seeds vouchers + a referral-credit balance for the canonical customer test fixture
// (kunde@solen.ch, used by _audits/sweep/agent-booking-flow.mjs and others), scoped to
// Atelier Haarwerk (accepts_online_payment, payment_mode "prepay"). Real rows via the
// real tables the real redemption RPCs read (vouchers, user_credits), never hardcoded
// into a mock, so /profile/vouchers and the booking pay-step voucher entry (#19/#45/#50/
// #52, 2026-07-18) can be demonstrated against real data pre-launch. Idempotent: safe to
// re-run, matches existing rows by their unique code (vouchers) / source_id (user_credits)
// instead of inserting duplicates.
//
// Also seeds a handful of REAL availability_slots rows (the same table + starts_at/ends_at
// convention app/api/cron/generate-slots/route.ts writes, using the same Zurich wall-clock
// helper). Discovered live: this seed environment had ZERO future available slots for any
// salon, so the booking wizard's date grid was entirely disabled end to end, blocking a
// live Playwright proof of this whole feature. The proper route is that cron, but it hard-
// requires CRON_SECRET (not set in this dev env, and .env.local edits need to be asked for
// per project rules), so this seeds the same row shape directly instead.
//
// Usage: npx tsx scripts/seed-voucher-credit-test-data.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const CUSTOMER_EMAIL = "kunde@solen.ch";
const SALON_ID = "dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89"; // Atelier Haarwerk (prepay, accepts_online_payment)
const STAFF_ID = "c8af954b-62bc-434b-9853-27c314797993"; // Lukas, mapped to both seed services
const CREDIT_SOURCE_ID = "seed-voucher-credit-test-data-2026-07-18";
const SLOT_SERVICES: { id: string; durationMin: number }[] = [
  { id: "4ca38c3e-fe11-4efb-a922-f2a05b739d6e", durationMin: 30 }, // Föhnen & Styling
  { id: "02fd4a7a-bd93-414e-a4df-39fc81dd5d7f", durationMin: 45 }, // Herren-Haarschnitt
];

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  const { data: userList, error: userErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (userErr) throw userErr;
  const customer = userList.users.find((u) => u.email === CUSTOMER_EMAIL);
  if (!customer) {
    console.error(`[seed] ${CUSTOMER_EMAIL} not found. This fixture is expected to already exist (used by _audits/sweep scripts).`);
    process.exit(1);
  }
  console.log(`[seed] customer ${CUSTOMER_EMAIL} -> ${customer.id}`);

  const { data: salon, error: salonErr } = await admin
    .from("salons")
    .select("id, name, accepts_online_payment, payment_mode")
    .eq("id", SALON_ID)
    .single();
  if (salonErr || !salon) throw new Error(`seed salon not found: ${salonErr?.message}`);
  console.log(`[seed] salon: ${salon.name} (${salon.payment_mode}, accepts_online_payment=${salon.accepts_online_payment})`);

  // Vouchers: idempotent on the unique `code` column.
  const vouchersToSeed = [
    { code: "TESTV20", amount: 20 },
    { code: "TESTV10", amount: 10 },
  ];
  for (const v of vouchersToSeed) {
    const { data: existing } = await admin.from("vouchers").select("id, remaining_amount, redeemed_at").eq("code", v.code).maybeSingle();
    if (existing) {
      console.log(`[seed] voucher ${v.code} already exists (id=${existing.id}, remaining=${existing.remaining_amount}, redeemed_at=${existing.redeemed_at}), leaving as-is`);
      continue;
    }
    const { data: inserted, error: insErr } = await admin
      .from("vouchers")
      .insert({
        salon_id: SALON_ID,
        buyer_id: customer.id,
        recipient_email: CUSTOMER_EMAIL,
        recipient_name: "Test Kunde",
        amount: v.amount,
        remaining_amount: v.amount,
        code: v.code,
        message: "Seed test voucher (money-wiring #19/#45/#50)",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (insErr) throw insErr;
    console.log(`[seed] created voucher ${v.code} (CHF ${v.amount}) id=${inserted?.id}`);
  }

  // Credit: idempotent on source_id (not a DB-unique column, so check-then-insert).
  const { data: existingCredit } = await admin
    .from("user_credits")
    .select("id, amount, remaining")
    .eq("user_id", customer.id)
    .eq("source_id", CREDIT_SOURCE_ID)
    .maybeSingle();
  if (existingCredit) {
    console.log(`[seed] credit row already exists (id=${existingCredit.id}, remaining=${existingCredit.remaining}), leaving as-is`);
  } else {
    const { data: insertedCredit, error: credErr } = await admin
      .from("user_credits")
      .insert({ user_id: customer.id, amount: 15, remaining: 15, source: "manual", source_id: CREDIT_SOURCE_ID })
      .select("id")
      .single();
    if (credErr) throw credErr;
    console.log(`[seed] created credit row CHF 15 id=${insertedCredit?.id}`);
  }

  // Availability slots: same row shape + Zurich wall-clock helper as
  // app/api/cron/generate-slots/route.ts, idempotent on (salon, staff, service, starts_at).
  const { zurichWallClockToUtc } = await import("@/lib/time/zurich");
  // Wide pool (14 days x 4 times/day x 2 services = up to 112 rows): this shared dev DB
  // has other concurrent activity booking into the same seed salon, so a narrow pool
  // collided (409 SLOT_TAKEN) across repeated Playwright proof runs.
  let slotsCreated = 0;
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const d = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    for (const hour of [8, 10, 13, 16]) {
      for (const svc of SLOT_SERVICES) {
        const startsAt = zurichWallClockToUtc(dateStr, hour, 0);
        const endsAt = new Date(startsAt.getTime() + svc.durationMin * 60000);
        const { data: existingSlot } = await admin
          .from("availability_slots")
          .select("id")
          .eq("salon_id", SALON_ID)
          .eq("staff_member_id", STAFF_ID)
          .eq("service_id", svc.id)
          .eq("starts_at", startsAt.toISOString())
          .maybeSingle();
        if (existingSlot) continue;
        const { error: slotErr } = await admin.from("availability_slots").insert({
          salon_id: SALON_ID,
          staff_member_id: STAFF_ID,
          service_id: svc.id,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "available",
        });
        if (slotErr) throw slotErr;
        slotsCreated++;
      }
    }
  }
  console.log(`[seed] availability_slots: ${slotsCreated} newly created (0 means already seeded from a prior run)`);

  // Report the live state so this doubles as a verification read.
  const { data: finalVouchers } = await admin
    .from("vouchers")
    .select("code, amount, remaining_amount, redeemed_at")
    .eq("buyer_id", customer.id)
    .order("created_at", { ascending: true });
  const { data: finalCredits } = await admin
    .from("user_credits")
    .select("source_id, amount, remaining")
    .eq("user_id", customer.id);
  console.log("[seed] final vouchers for customer:", JSON.stringify(finalVouchers, null, 2));
  console.log("[seed] final credit rows for customer:", JSON.stringify(finalCredits, null, 2));
}

main().catch((e) => {
  console.error("[seed] FAILED:", e);
  process.exit(1);
});
