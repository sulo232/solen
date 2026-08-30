// scripts/seed-guest-names.mjs
//
// BACKFILL, not fabrication, same authority as scripts/seed-review-text.mjs's own header
// (CLAUDE.md taste rule 1, amended 2026-08-02): Solen is pre-launch, every row is already seed
// data, a row the UI reads through its normal query is a live source whoever inserted it.
//
// THE DEFECT this feeds: components-legacy/salon/SalonReviews.tsx only ever reads
// rev.profiles?.display_name for the reviewer name, so a guest who books and leaves a review
// (no account, bookings.user_id null) is permanently "Anonym" no matter what the booking says,
// because the booking's own guest_name is never read. That render-side fix is a separate,
// scoped change (not this file). This script only cleans the SOURCE column so that fix has
// something real to read: 499 of 531 guest_name values in `bookings` are junk placeholders
// ("Sara Test", "Gast 6715", "Gast feea", confirmed live), not a person's name.
//
// Rewrites bookings.guest_name ONLY where the current value matches one of the two junk
// shapes named for this job:
//   1. contains "Test" (case-insensitive) anywhere, e.g. "Sara Test", "C1 Verify Test"
//   2. matches exactly "Gast " followed by digits/hex, e.g. "Gast 6715", "Gast feea"
// Anything else (a name that already looks like a person, e.g. "Pascal Meier", "Aylin Yildiz",
// even an odd one like "C1 Verify" which matches neither shape) is left completely alone, per
// instruction: the shape test is positive and exact, not a guess at what else might be junk.
//
// ENV + CLIENT PATTERN: same as scripts/seed-review-text.mjs (itself copied from
// scripts/lib/stuck-rows.mjs): hand-rolled .env.local read, service-role key,
// @supabase/supabase-js imported LAZILY inside the async function.
//
// COMPARE-AND-SET: same discipline as scripts/seed-review-text.mjs and
// app/api/cron/walkin-no-show/route.ts. The UPDATE's own WHERE clause re-asserts
// guest_name = <the exact junk value just read>, so a row edited by someone else between the
// SELECT and this script's UPDATE is left alone rather than clobbered. A zero-row match is a
// silent skip, not a failure.
//
// Writes ONLY the guest_name column. rating/salon_id/user_id/staff_member_id/status/dates on
// bookings, and everything on `reviews`, is untouched: this script never opens the reviews
// table at all.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BACKUP_PATH = "/private/tmp/claude-501/bookings-guestname-backup.json";

function loadEnv(repoRoot) {
  for (const p of [
    join(repoRoot, ".env.local"),
    join(process.cwd(), ".env.local"),
    "/Users/sulo/Documents/solen/.env.local",
  ]) {
    if (!existsSync(p)) continue;
    const out = {};
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const i = line.indexOf("=");
      if (i < 1 || line.trim().startsWith("#")) continue;
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
    return out;
  }
  return null;
}

// Two junk shapes, named exactly as specified. Nothing else is treated as junk.
function isJunkGuestName(name) {
  if (typeof name !== "string") return false;
  if (/test/i.test(name)) return true;
  if (/^Gast\s+[0-9a-fA-F]+$/.test(name)) return true;
  return false;
}

// Swiss-realistic first names, the same demographic mix already visible in the real
// (non-junk) guest_name rows (Pascal Meier, Aylin Yildiz, Bruno Caruso, Kerem Aslan, Deniz
// Kaya...) and in the real profiles (Samir B, Nico W, Elias R). "Firstname + one capital
// initial" is the exact grammar those profile rows already use.
const FIRST_NAMES = [
  "Noah", "Liam", "Matteo", "Luca", "Nico", "Elias", "David", "Samir", "Timo", "Julian",
  "Fabio", "Silvan", "Dario", "Kevin", "Marc", "Yannick", "Pascal", "Bruno", "Andrin", "Kerem",
  "Deniz", "Mert", "Lorenzo", "Mia", "Emma", "Lea", "Nina", "Sara", "Laura", "Anja",
  "Aylin", "Selina", "Fabienne", "Melanie", "Jasmin", "Chiara", "Elena", "Livia", "Noemi", "Vanessa",
  "Priska", "Celine", "Aurora", "Jonas", "Simon", "Reto", "Michelle", "Sandra", "Corinne", "Ramona",
];
const INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// One shuffled, self-refilling deck PER SALON so a salon cannot repeat a generated name until
// every combination in the deck has been used once by that salon. Same technique as
// scripts/seed-review-text.mjs's makeCycler, scoped the same way after that script's own
// same-salon-repeat bug was found and fixed.
function makeCycler(items) {
  let pool = [];
  function refill() {
    pool = [...items];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  return function next() {
    if (pool.length === 0) refill();
    return pool.pop();
  };
}

const ALL_COMBOS = FIRST_NAMES.flatMap((name) => INITIALS.map((initial) => `${name} ${initial}`));

async function main() {
  const repoRoot = process.cwd();
  const env = loadEnv(repoRoot);
  const url = env?.NEXT_PUBLIC_SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[seed-guest-names] STOP: no NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY found in .env.local");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, key, { auth: { persistSession: false } });

  // ---- Load every booking with a guest_name, classify junk vs not -------------------
  const allRows = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const to = from + PAGE - 1;
    const { data, error } = await db
      .from("bookings")
      .select("*")
      .not("guest_name", "is", null)
      .order("id", { ascending: true })
      .range(from, to);
    if (error) {
      console.error("[seed-guest-names] STOP: could not load bookings:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`[seed-guest-names] total bookings with a non-null guest_name: ${allRows.length}`);

  const junkRows = allRows.filter((b) => isJunkGuestName(b.guest_name));
  console.log(`[seed-guest-names] matched the junk shapes (will be rewritten): ${junkRows.length}`);
  console.log(`[seed-guest-names] left alone (already person-shaped or unmatched): ${allRows.length - junkRows.length}`);

  // ---- Step 5-equivalent safety: back up the affected rows BEFORE any write --------
  if (junkRows.length === 0) {
    console.log("[seed-guest-names] nothing to rewrite, no backup needed, exiting.");
    return;
  }
  writeFileSync(BACKUP_PATH, JSON.stringify(junkRows, null, 2));
  if (!existsSync(BACKUP_PATH)) {
    console.error(`[seed-guest-names] STOP: backup write to ${BACKUP_PATH} did not land. Not touching the database.`);
    process.exit(1);
  }
  const verifyBackup = JSON.parse(readFileSync(BACKUP_PATH, "utf8"));
  if (!Array.isArray(verifyBackup) || verifyBackup.length === 0) {
    console.error(`[seed-guest-names] STOP: backup at ${BACKUP_PATH} is empty after write. Not touching the database.`);
    process.exit(1);
  }
  console.log(`[seed-guest-names] backup confirmed: ${verifyBackup.length} rows at ${BACKUP_PATH}.`);

  // ---- Rewrite, per-salon cycler, compare-and-set -----------------------------------
  const cyclersBySalon = new Map();
  function cyclerFor(salonId) {
    let cycler = cyclersBySalon.get(salonId);
    if (!cycler) {
      cycler = makeCycler(ALL_COMBOS);
      cyclersBySalon.set(salonId, cycler);
    }
    return cycler;
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of junkRows) {
    const cycler = cyclerFor(row.salon_id);
    const newName = cycler();

    const { data: updated, error: updErr } = await db
      .from("bookings")
      .update({ guest_name: newName })
      .eq("id", row.id)
      .eq("guest_name", row.guest_name) // re-assert: still the exact junk value we read
      .select("id")
      .maybeSingle();

    if (updErr) {
      console.error(`[seed-guest-names] booking ${row.id}: update failed:`, updErr.message);
      failed++;
      continue;
    }
    if (!updated) {
      // 0 rows matched: guest_name changed between our SELECT and this UPDATE. Not an
      // error, just a lost race, same treatment as the review-text and no-show scripts.
      skipped++;
      continue;
    }
    written++;
  }

  console.log(`[seed-guest-names] wrote ${written}, skipped (raced) ${skipped}, failed ${failed}.`);

  // ---- Sanity check: no salon repeats a generated name ------------------------------
  const { data: after } = await db
    .from("bookings")
    .select("id, guest_name, salon_id")
    .in("id", junkRows.map((r) => r.id));
  const bySalon = new Map();
  for (const b of after ?? []) {
    if (!bySalon.has(b.salon_id)) bySalon.set(b.salon_id, new Map());
    const names = bySalon.get(b.salon_id);
    names.set(b.guest_name, (names.get(b.guest_name) ?? 0) + 1);
  }
  let maxRepeatAtOneSalon = 1;
  for (const names of bySalon.values()) {
    for (const count of names.values()) maxRepeatAtOneSalon = Math.max(maxRepeatAtOneSalon, count);
  }
  console.log(`[seed-guest-names] largest number of times one generated name repeats within a single salon: ${maxRepeatAtOneSalon}.`);
}

main().catch((err) => {
  console.error("[seed-guest-names] unexpected error:", err?.message || err);
  process.exit(1);
});
