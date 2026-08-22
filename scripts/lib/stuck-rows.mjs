// scripts/lib/stuck-rows.mjs
//
// STUCK ROWS: rows sitting in a transient state (waiting / pending / unresolved) well past the
// point they should have moved on. Built 2026-08-22 after two live incidents of the same shape:
// a homepage walk-in wait computed from queue rows nobody ever finalized (joined in June, never
// completed or cancelled), and 7 real bookings still `pending` from a 2026-06-12 appointment.
// A count/rate built over rows like these is arithmetic over people long gone.
//
// READ-ONLY. Every query below is a SELECT. Nothing here writes, updates or deletes a row.
//
// Talks to Supabase LIVE via the service-role key from .env.local, the same mechanism
// scripts/backup-local.mjs already uses. There is no direct Postgres connection anywhere in
// this repo (see scripts/check-migrations.mjs's header note: no `pg` dependency, no
// DATABASE_URL/POSTGRES_URL env var), so PostgREST via @supabase/supabase-js is the only route.
//
// `@supabase/supabase-js` is imported LAZILY (inside computeStuckRows, not at module top level)
// on purpose: scripts/inventory.mjs runs in CI (.github/workflows/inventory-freshness.yml) via
// `node scripts/inventory.mjs --check` with no `npm ci` step, because the rest of the scanner is
// dependency-free. A top-level import here would break that CI job. --check mode never calls
// computeStuckRows, so the import is never reached there.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const WALKIN_WAITING_MINUTES = 45;
const BOOKINGS_PENDING_DAYS = 2;
const VOUCHERS_UNRESOLVED_DAYS = 7;
const BOOKINGS_CONFIRMED_PAST_APPOINTMENT_HOURS = 24;
const WALKIN_IN_CHAIR_HOURS = 12;

/** How old a stuck-rows report is allowed to get before a reader should be told not to trust it. */
export const STUCK_ROWS_MAX_AGE_DAYS = 2;

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

function daysAgo(iso) {
  return Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
}

/** One stuck-state check: count + the single oldest row + its salon, read-only. */
async function checkStuck(db, { table, eq = {}, isNull = [], dateCol, cutoffIso, label }) {
  let countQuery = db.from(table).select("id", { count: "exact", head: true });
  let rowsQuery = db
    .from(table)
    .select(`id, salon_id, ${dateCol}`)
    .order(dateCol, { ascending: true })
    .limit(1);

  for (const [col, val] of Object.entries(eq)) {
    countQuery = countQuery.eq(col, val);
    rowsQuery = rowsQuery.eq(col, val);
  }
  for (const col of isNull) {
    countQuery = countQuery.is(col, null);
    rowsQuery = rowsQuery.is(col, null);
  }
  countQuery = countQuery.lt(dateCol, cutoffIso);
  rowsQuery = rowsQuery.lt(dateCol, cutoffIso);

  const [{ count, error: countErr }, { data: oldestRows, error: rowsErr }] = await Promise.all([
    countQuery,
    rowsQuery,
  ]);

  if (countErr) {
    console.error(`[stuck-rows] ${table} count query failed:`, countErr.message);
    return { label, table, error: countErr.message };
  }
  if (rowsErr) {
    console.error(`[stuck-rows] ${table} oldest-row query failed:`, rowsErr.message);
    return { label, table, error: rowsErr.message };
  }

  const oldest = oldestRows?.[0] ?? null;
  let salonName = null;
  if (oldest?.salon_id) {
    const { data: salonRow, error: salonErr } = await db
      .from("salons")
      .select("name")
      .eq("id", oldest.salon_id)
      .maybeSingle();
    if (salonErr) console.error(`[stuck-rows] salon lookup for ${table} failed:`, salonErr.message);
    else salonName = salonRow?.name ?? null;
  }

  return {
    label,
    table,
    count: count ?? 0,
    oldest: oldest
      ? {
          id: oldest.id,
          date: oldest[dateCol],
          daysOld: daysAgo(oldest[dateCol]),
          salonId: oldest.salon_id ?? null,
          salonName,
        }
      : null,
  };
}

/**
 * Runs the five live stuck-row checks and returns { generatedAt, checks } on success, or
 * { generatedAt, error } if the DB could not be reached (missing credentials, network, etc).
 * Never throws, so a failed live query cannot take down the rest of `npm run inventory`.
 */
export async function computeStuckRows(repoRoot) {
  const generatedAt = new Date().toISOString();
  const env = loadEnv(repoRoot);
  const url = env?.NEXT_PUBLIC_SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const msg = "no NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY found in .env.local";
    console.error(`[stuck-rows] ${msg}, skipping live query`);
    return { generatedAt, error: msg };
  }

  let createClient;
  try {
    ({ createClient } = await import("@supabase/supabase-js"));
  } catch (err) {
    const msg = `@supabase/supabase-js not installed (${err?.message || err})`;
    console.error(`[stuck-rows] ${msg}`);
    return { generatedAt, error: msg };
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const now = Date.now();
  const walkinCutoff = new Date(now - WALKIN_WAITING_MINUTES * 60_000).toISOString();
  const bookingsCutoff = new Date(now - BOOKINGS_PENDING_DAYS * 86_400_000).toISOString();
  const vouchersCutoff = new Date(now - VOUCHERS_UNRESOLVED_DAYS * 86_400_000).toISOString();
  const bookingsConfirmedCutoff = new Date(
    now - BOOKINGS_CONFIRMED_PAST_APPOINTMENT_HOURS * 3_600_000,
  ).toISOString();
  const walkinInChairCutoff = new Date(now - WALKIN_IN_CHAIR_HOURS * 3_600_000).toISOString();

  try {
    const checks = await Promise.all([
      checkStuck(db, {
        table: "barber_walkin_queue",
        eq: { status: "waiting" },
        dateCol: "joined_at",
        cutoffIso: walkinCutoff,
        label: `barber_walkin_queue still "waiting" more than ${WALKIN_WAITING_MINUTES} minutes after joined_at`,
      }),
      checkStuck(db, {
        table: "bookings",
        eq: { status: "pending" },
        dateCol: "created_at",
        cutoffIso: bookingsCutoff,
        label: `bookings still "pending" more than ${BOOKINGS_PENDING_DAYS} days after created_at`,
      }),
      checkStuck(db, {
        table: "vouchers",
        isNull: ["remaining_amount"],
        dateCol: "created_at",
        cutoffIso: vouchersCutoff,
        label: `vouchers with remaining_amount still null more than ${VOUCHERS_UNRESOLVED_DAYS} days after created_at`,
      }),
      checkStuck(db, {
        table: "bookings",
        eq: { status: "confirmed" },
        dateCol: "starts_at",
        cutoffIso: bookingsConfirmedCutoff,
        label: `bookings still "confirmed" more than ${BOOKINGS_CONFIRMED_PAST_APPOINTMENT_HOURS} hours after their appointment time (starts_at)`,
      }),
      checkStuck(db, {
        table: "barber_walkin_queue",
        eq: { status: "in_chair" },
        dateCol: "joined_at",
        cutoffIso: walkinInChairCutoff,
        label: `barber_walkin_queue still "in_chair" more than ${WALKIN_IN_CHAIR_HOURS} hours after joined_at`,
      }),
    ]);
    return { generatedAt, checks };
  } catch (err) {
    console.error("[stuck-rows] live query failed:", err?.message || err);
    return { generatedAt, error: err?.message || String(err) };
  }
}
