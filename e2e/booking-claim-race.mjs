#!/usr/bin/env node
// ---------------------------------------------------------------------------
// e2e/booking-claim-race.mjs : FUNCTIONAL regression guard for the
// booking / payment path (root-cause plan Phase D). Permanent guardrail for
// the three bugs fixed this session:
//
//   TEST 1  slot-claim race   : N concurrent POST /api/bookings at ONE slot
//                               must yield exactly 1 success + (N-1) x 409,
//                               and the DB must hold exactly 1 booking for
//                               that slot with 0 orphans. Proves the shared
//                               compare-and-swap in lib/bookings/claim-slot.ts
//                               (run with the SERVICE-ROLE client) is the real
//                               guard. The old bug ran the CAS on the customer
//                               RLS session client, which silently matched 0
//                               rows (availability_slots UPDATE is owner-only),
//                               so every claim looked like a lost race.
//   TEST 2  cancel frees slot : cancel a confirmed booking, assert the slot
//                               returns to status='available'. The old bug
//                               freed the slot with the RLS session client
//                               (0 rows updated) so slots stuck at 'booked'.
//   TEST 3  notes IDOR closed : a NON-owner customer session GET on
//                               /api/dashboard/clients/<id>/notes for a salon
//                               they do not own must be 403, not 200. The old
//                               GET was missing the ownership check the
//                               POST/DELETE already enforced.
//
// Self-contained: ESM, global fetch, @supabase/supabase-js for setup/assert/
// teardown via the service-role key (read from .env.local). Creates fully
// THROWAWAY fixtures (owner + salon + service + staff + customer) so it never
// touches real salon data and never emails a real owner. Cleans up EVERYTHING
// on exit (success or failure). Exit 0 iff all assertions pass.
//
// Usage:
//   node e2e/booking-claim-race.mjs              # run all 3 tests (green path)
//   node e2e/booking-claim-race.mjs --red-proof  # prove TEST 1 has teeth:
//        corrupt the slot (pre-book it) so no claim can win, then assert that
//        TEST 1's assertion CORRECTLY FAILS. Exit 0 iff the assertion fired.
//
// Requirements:
//   - A dev server on http://localhost:3000. If it is not up, this script
//     starts `npm run dev` from THIS worktree in the background and waits.
//     NOTE: the dev-login helper (/api/dev/login) is gated to
//     NODE_ENV==='development', so the server MUST be `next dev` (not
//     `next start`). When this script starts the server it neutralizes
//     RESEND_API_KEY (real env vars win over .env.local in Next) so booking
//     confirmation / owner-notification emails are no-ops during the test.
//   - .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const N_CONCURRENT = 6;
const RED_PROOF = process.argv.includes("--red-proof");

// -- env ---------------------------------------------------------------------
function loadDotEnv() {
  const out = {};
  let txt = "";
  try { txt = readFileSync(join(ROOT, ".env.local"), "utf8"); } catch { /* rely on process.env */ }
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
const ENV = { ...loadDotEnv(), ...process.env };
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[e2e] FATAL: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing (.env.local).");
  process.exit(2);
}
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// -- tiny assert / logging ----------------------------------------------------
class AssertionError extends Error {}
function assert(cond, msg) { if (!cond) throw new AssertionError(msg); }
const log = (...a) => console.log("[e2e]", ...a);

// -- dev-server lifecycle -----------------------------------------------------
let startedServer = null;
async function serverUp() {
  try { await fetch(`${BASE}/`, { redirect: "manual" }); return true; } // any HTTP answer = up
  catch { return false; }
}
async function ensureServer() {
  if (await serverUp()) { log(`dev server already up at ${BASE}`); return; }
  log("dev server not up, starting `npm run dev` from", ROOT);
  startedServer = spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    // Real env vars win over .env.local in Next. A syntactically valid but non-working
    // Resend key (passes env zod's `re_` check, fails auth at Resend) makes every booking
    // email a fast wrapped no-op, so the test run delivers zero mail / uses zero quota.
    env: { ...process.env, PORT: "3000", RESEND_API_KEY: "re_e2e_disabled_0000000000000000000000" },
    stdio: "ignore",
    detached: true,
  });
  startedServer.unref();
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    await sleep(2000);
    if (await serverUp()) { log("dev server ready"); await sleep(1500); return; }
  }
  throw new Error("dev server did not become ready within 180s");
}
function stopServerIfStarted() {
  if (!startedServer) return;
  try { process.kill(-startedServer.pid, "SIGTERM"); log("stopped the dev server this script started"); }
  catch { /* already gone */ }
}

// -- auth: mint a customer session cookie via the dev-login helper ------------
async function loginCookie(email) {
  const res = await fetch(`${BASE}/api/dev/login?email=${encodeURIComponent(email)}&to=/`, { redirect: "manual" });
  if (res.status === 404) {
    throw new Error("/api/dev/login returned 404, server is not in development mode. Run `next dev` (not `next start`).");
  }
  const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const cookie = setCookies.map((c) => c.split(";")[0]).filter(Boolean).join("; ");
  if (!cookie || !/sb-.*-auth-token/.test(cookie)) {
    throw new Error(`dev-login set no auth cookie (status ${res.status}); cookies=${JSON.stringify(setCookies)}`);
  }
  return cookie;
}

// -- HTTP helpers -------------------------------------------------------------
async function postBooking(cookie, body) {
  const r = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-forwarded-for": "127.0.0.1" },
    body: JSON.stringify(body),
  });
  let json = null; try { json = await r.json(); } catch { /* ignore */ }
  return { status: r.status, body: json };
}
async function cancelBooking(cookie, id) {
  const r = await fetch(`${BASE}/api/bookings/${id}/cancel`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-forwarded-for": "127.0.0.1" },
    body: JSON.stringify({}),
  });
  let json = null; try { json = await r.json(); } catch { /* ignore */ }
  return { status: r.status, body: json };
}
async function getNotes(cookie, customerId, salonId) {
  const r = await fetch(`${BASE}/api/dashboard/clients/${customerId}/notes?salon_id=${salonId}`, {
    headers: { cookie, "x-forwarded-for": "127.0.0.1" },
  });
  let json = null; try { json = await r.json(); } catch { /* ignore */ }
  return { status: r.status, body: json };
}

// -- fixtures -----------------------------------------------------------------
const rnd = () => Math.random().toString(36).slice(2, 10);
const RUN = `${Date.now().toString(36)}-${rnd()}`;

async function createUser(kind) {
  const email = `e2e-${kind}-${RUN}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: `E2E ${kind} ${RUN}` },
  });
  if (error) throw new Error(`createUser(${kind}) failed: ${error.message}`);
  return { id: data.user.id, email };
}

async function setup() {
  const fx = { slotIds: [], bookingIds: [] };

  // Throwaway OWNER + a salon they own (so no real owner is ever emailed, and the
  // IDOR test targets a salon the CUSTOMER provably does not own).
  fx.owner = await createUser("owner");
  const slug = `e2e-salon-${RUN}`;
  {
    const { data, error } = await admin.from("salons").insert({
      owner_id: fx.owner.id,
      name: `E2E Salon ${RUN}`,
      slug,
      address: "Teststrasse 1, 8000 Zurich",
      latitude: 47.3769,
      longitude: 8.5417,
      online_booking_enabled: true,
      payment_mode: "at_salon",              // not deposit/prepay, so in-person booking is allowed
      booking_confirmation_mode: "instant",  // booking lands 'confirmed' (cancellable in TEST 2)
    }).select("id").single();
    if (error) throw new Error(`create salon failed: ${error.message}`);
    fx.salonId = data.id;
  }
  {
    const { data, error } = await admin.from("services").insert({
      salon_id: fx.salonId,
      name_de: "E2E Haarschnitt",
      name_en: "E2E Haircut",
      category: "coiffeur",
      duration_minutes: 30,
      price: 50,
      is_active: true,
    }).select("id").single();
    if (error) throw new Error(`create service failed: ${error.message}`);
    fx.serviceId = data.id;
  }
  {
    const { data, error } = await admin.from("staff_members").insert({
      salon_id: fx.salonId,
      name: `E2E Stylist ${RUN}`,
    }).select("id").single();
    if (error) throw new Error(`create staff failed: ${error.message}`);
    fx.staffId = data.id;
  }

  // Throwaway CUSTOMER + a session cookie.
  fx.customer = await createUser("customer");
  fx.cookie = await loginCookie(fx.customer.email);

  log(`fixtures: salon=${fx.salonId} service=${fx.serviceId} staff=${fx.staffId} customer=${fx.customer.id}`);
  return fx;
}

// A fresh far-future available slot for the (salon,service,staff) triple. A unique
// timestamp per slot means it is the ONLY available slot at that instant, so the
// pick (and therefore the race) is deterministic.
let slotCounter = 0;
async function createSlot(fx) {
  const startMs = Date.UTC(2035, 0, 1, 8, 0, 0) + (slotCounter++ * 3600_000) + Math.floor(Math.random() * 3000) * 1000;
  const startsAt = new Date(startMs).toISOString();
  const endsAt = new Date(startMs + 30 * 60_000).toISOString();
  const { data, error } = await admin.from("availability_slots").insert({
    salon_id: fx.salonId,
    service_id: fx.serviceId,
    staff_member_id: fx.staffId,
    starts_at: startsAt,
    ends_at: endsAt,
    status: "available",
    price_override: 50,
  }).select("id, starts_at").single();
  if (error) throw new Error(`create slot failed: ${error.message}`);
  fx.slotIds.push(data.id);
  return data;
}

async function slotRow(slotId) {
  const { data } = await admin.from("availability_slots").select("id, status, booking_id, booked_by").eq("id", slotId).single();
  return data;
}
async function countBookingsForSlot(slotId) {
  const { count } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("slot_id", slotId);
  return count ?? 0;
}

// -- TESTS --------------------------------------------------------------------
async function fireRaceAndAssert(fx, slot, label = "TEST 1") {
  const bodies = Array.from({ length: N_CONCURRENT }, () => ({ slot_id: slot.id, service_id: fx.serviceId }));
  const results = await Promise.all(bodies.map((b) => postBooking(fx.cookie, b)));
  const statuses = results.map((r) => r.status);
  const successes = results.filter((r) => r.status === 200 || r.status === 201);
  const rejected = results.filter((r) => r.status >= 400);
  const n409 = results.filter((r) => r.status === 409).length;
  const n500 = results.filter((r) => r.status === 500).length;

  // record any created booking ids for teardown (winner + any not-yet-rolled-back row)
  for (const r of successes) if (r.body?.data?.id) fx.bookingIds.push(r.body.data.id);

  const detail = () => `statuses=${JSON.stringify(statuses)} codes=${JSON.stringify(results.map((r) => r.body?.code ?? r.body?.error ?? null))}`;

  // HTTP-level invariant. The concurrent losers are rejected two ways, BOTH of which
  // prove the guard held:
  //   409 SLOT_TAKEN / DUPLICATE_BOOKING  : the CAS or the duplicate guard rejected them.
  //   500 DB_ERROR                        : the partial UNIQUE index bookings_one_active_
  //     per_slot (slot_id WHERE status IN pending/pending_approval/confirmed) rejected the
  //     concurrent INSERT with a 23505. The route currently surfaces that as a raw 500
  //     instead of mapping it to 409 (a known secondary rough edge, flagged separately).
  // The load-bearing assertion is: EXACTLY ONE request wins, and every other request is
  // rejected (never a second success). That is what discriminates the FIXED code (1 win)
  // from the old RLS-client no-op bug (0 wins) and from a double-book (2 wins).
  assert(successes.length === 1, `${label}: expected exactly 1 success (200/201), got ${successes.length}. ${detail()}`);
  assert(rejected.length === N_CONCURRENT - 1, `${label}: expected ${N_CONCURRENT - 1} rejected requests, got ${rejected.length}. ${detail()}`);
  const unexpected = results.filter((r) => ![200, 201, 409, 500].includes(r.status));
  assert(unexpected.length === 0, `${label}: losers must be 409 (slot taken) or 500 (unique-index race), saw an unexpected status. ${detail()}`);

  // DB-level invariant (service-role): exactly 1 booking references the slot, the slot
  // is 'booked' by that same booking, and there are no orphans / no double-book.
  const winnerId = successes[0].body?.data?.id ?? null;
  const bookingCount = await countBookingsForSlot(slot.id);
  assert(bookingCount === 1, `${label}: expected exactly 1 booking row for slot ${slot.id}, found ${bookingCount} (double-book / orphan).`);
  const srow = await slotRow(slot.id);
  assert(srow?.status === "booked", `${label}: slot ${slot.id} should be 'booked', is '${srow?.status}'.`);
  assert(winnerId && srow?.booking_id === winnerId,
    `${label}: slot.booking_id (${srow?.booking_id}) should equal the winning booking id (${winnerId}).`);

  log(`${label} PASS: 1 success + ${n409}x409 + ${n500}x500 (all losers rejected); slot booked by ${winnerId}; 1 booking row, 0 double-books.`);
  return winnerId;
}

async function test1(fx) {
  const slot = await createSlot(fx);
  await fireRaceAndAssert(fx, slot, "TEST 1 (claim race)");
}

async function test2(fx) {
  const slot = await createSlot(fx);
  const created = await postBooking(fx.cookie, { slot_id: slot.id, service_id: fx.serviceId });
  assert(created.status === 201, `TEST 2: booking create expected 201, got ${created.status} (${JSON.stringify(created.body)})`);
  const bookingId = created.body?.data?.id;
  assert(bookingId, "TEST 2: no booking id returned on create");
  fx.bookingIds.push(bookingId);

  const before = await slotRow(slot.id);
  assert(before?.status === "booked", `TEST 2: slot should be 'booked' after create, is '${before?.status}'`);

  const cancelled = await cancelBooking(fx.cookie, bookingId);
  assert(cancelled.status === 200, `TEST 2: cancel expected 200, got ${cancelled.status} (${JSON.stringify(cancelled.body)})`);
  assert(cancelled.body?.data?.status === "cancelled", `TEST 2: cancel body status should be 'cancelled', got '${cancelled.body?.data?.status}'`);

  const after = await slotRow(slot.id);
  assert(after?.status === "available", `TEST 2: slot should return to 'available' after cancel, is '${after?.status}' (RLS-client free-slot no-op regression).`);
  assert(after?.booking_id === null && after?.booked_by === null, `TEST 2: freed slot should clear booking_id/booked_by, got booking_id=${after?.booking_id} booked_by=${after?.booked_by}`);

  const { data: brow } = await admin.from("bookings").select("status").eq("id", bookingId).single();
  assert(brow?.status === "cancelled", `TEST 2: booking row status should be 'cancelled', is '${brow?.status}'`);

  log(`TEST 2 (cancel frees slot) PASS: booking ${bookingId} cancelled, slot back to 'available'.`);
}

async function test3(fx) {
  // As the NON-owner customer, request notes for a salon they do not own.
  // customerId can be any id (the ownership check runs BEFORE any note read);
  // use the customer's own id. Must be 403 (IDOR closed), never 200.
  const res = await getNotes(fx.cookie, fx.customer.id, fx.salonId);
  assert(res.status === 403,
    `TEST 3 (notes IDOR): non-owner GET on a salon they do not own must be 403, got ${res.status} (${JSON.stringify(res.body)}). A 200 means the GET ownership check regressed.`);
  log("TEST 3 (notes IDOR closed) PASS: non-owner notes read is 403.");
}

// -- RED PROOF: corrupt the slot (pre-book it) so no claim can win, then assert
//    that TEST 1's assertion CORRECTLY FAILS. This mirrors the OLD-bug symptom
//    (claim silently matches 0 rows, so 0 successful claims). Exit 0 iff the
//    assertion fires; exit 1 if the corrupted run somehow "passes" (toothless).
async function redProofTest1(fx) {
  const slot = await createSlot(fx);
  // Simulate the old bug's observable outcome: the slot can never be claimed.
  const { error } = await admin.from("availability_slots").update({ status: "booked" }).eq("id", slot.id);
  if (error) throw new Error(`red-proof: could not corrupt slot: ${error.message}`);
  log(`red-proof: slot ${slot.id} forced to 'booked' before the race (no claim can win).`);

  let fired = false, caught = null;
  try {
    await fireRaceAndAssert(fx, slot, "TEST 1 (RED PROOF)");
  } catch (e) {
    if (e instanceof AssertionError) { fired = true; caught = e.message; }
    else throw e;
  }
  if (fired) {
    log("RED PROOF CONFIRMED: TEST 1's assertion correctly FAILED on a slot that cannot be claimed:");
    log("   ->", caught);
    return true;
  }
  log("RED PROOF FAILED: TEST 1 'passed' on an unclaimable slot; the assertion has no teeth.");
  return false;
}

// -- teardown: remove EVERYTHING this run created (best-effort, always runs) ---
// supabase-js returns { error } instead of throwing, so `del` inspects BOTH the
// returned error and any thrown exception, and logs either. That visibility is
// what makes a leak obvious instead of silent.
let teardownHadError = false;
async function del(label, builder) {
  try {
    const res = await builder();
    if (res && res.error) { teardownHadError = true; log(`teardown ${label}: ${res.error.message}`); }
  } catch (e) { teardownHadError = true; log(`teardown ${label}: ${e.message}`); }
}

async function teardown(fx) {
  if (!fx) return;

  // Detach slots first so booking deletes do not fight the slot<->booking FKs.
  if (fx.slotIds?.length) {
    await del("detach slots", () => admin.from("availability_slots").update({ status: "available", booking_id: null, booked_by: null }).in("id", fx.slotIds));
    await del("delete bookings by slot", () => admin.from("bookings").delete().in("slot_id", fx.slotIds));
  }
  if (fx.bookingIds?.length) await del("delete bookings by id", () => admin.from("bookings").delete().in("id", fx.bookingIds));
  if (fx.slotIds?.length) await del("delete slots", () => admin.from("availability_slots").delete().in("id", fx.slotIds));
  if (fx.staffId) await del("delete staff", () => admin.from("staff_members").delete().eq("id", fx.staffId));
  if (fx.serviceId) await del("delete service", () => admin.from("services").delete().eq("id", fx.serviceId));
  if (fx.salonId) await del("delete salon", () => admin.from("salons").delete().eq("id", fx.salonId));

  const userIds = [fx.customer, fx.owner].filter(Boolean).map((u) => u.id);
  if (userIds.length) {
    // Per-user rows that block the auth-user delete (referrals.referrer_id has a
    // NO ACTION FK to the user; a referral code row is auto-created per user). Also
    // clear credits / notifications / any leftover bookings for the user.
    await del("delete referrals (referrer)", () => admin.from("referrals").delete().in("referrer_id", userIds));
    await del("delete referrals (referred)", () => admin.from("referrals").delete().in("referred_user_id", userIds));
    await del("delete user_credits", () => admin.from("user_credits").delete().in("user_id", userIds));
    await del("delete notifications", () => admin.from("notifications").delete().in("user_id", userIds));
    await del("delete bookings by user", () => admin.from("bookings").delete().in("user_id", userIds));
    for (const id of userIds) {
      await del(`delete profile ${id}`, () => admin.from("profiles").delete().eq("id", id));
      await del(`delete user ${id}`, () => admin.auth.admin.deleteUser(id)); // GoTrue admin delete also drops auth.identities
    }
  }

  // Self-verify: nothing this run created may remain (leave the DB exactly as found).
  const { count: leftSalons } = await admin.from("salons").select("id", { count: "exact", head: true }).eq("slug", `e2e-salon-${RUN}`);
  const { count: leftProfiles } = await admin.from("profiles").select("id", { count: "exact", head: true }).like("display_name", `E2E %${RUN}`);
  if ((leftSalons ?? 0) + (leftProfiles ?? 0) > 0 || teardownHadError) {
    log(`WARNING: teardown may have leaked (salons=${leftSalons ?? "?"}, profiles=${leftProfiles ?? "?"}). Inspect e2e-salon-${RUN} / E2E %${RUN}.`);
  } else {
    log("teardown complete: fixtures removed, DB verified clean.");
  }
}

// -- main ---------------------------------------------------------------------
async function main() {
  await ensureServer();
  let fx = null;
  let ok = false;
  try {
    fx = await setup();
    if (RED_PROOF) {
      ok = await redProofTest1(fx);
    } else {
      await test1(fx);
      await test2(fx);
      await test3(fx);
      ok = true;
    }
  } catch (e) {
    console.error(`\n[e2e] ${e instanceof AssertionError ? "ASSERTION FAILED" : "ERROR"}: ${e.message}`);
    if (!(e instanceof AssertionError) && e.stack) console.error(e.stack);
    ok = false;
  } finally {
    await teardown(fx);
    stopServerIfStarted();
  }

  if (RED_PROOF) {
    console.log(ok ? "\nPASS: RED PROOF PASSED, the test has teeth (assertion fired on the corrupted slot)."
                   : "\nFAIL: RED PROOF FAILED, the assertion did not fire.");
  } else {
    console.log(ok ? "\nPASS: ALL TESTS PASSED (claim race, cancel frees slot, notes IDOR closed)."
                   : "\nFAIL: TESTS FAILED, see the assertion above.");
  }
  process.exit(ok ? 0 : 1);
}

main();
