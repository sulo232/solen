export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";

// exists-check: net-new vs app/api/cron/abandon-sweep/route.ts, app/api/cron/no-show/route.ts
// (ran `npm run exists walkin-no-show`, 0 matches). Also, this route was already built once on
// branch claude/cranky-bose-5621bf (commit 710b76126, 2026-07-08) and never merged, verified
// with `git merge-base --is-ancestor`; brought across from there and adapted to the current
// cron conventions (see notes below), not written fresh.
// Mirrors abandon-sweep's shape (select stale rows -> bounded batch -> update with a
// re-asserted WHERE guard -> error-check each write) but targets barber_walkin_queue
// instead of bookings; no existing route sweeps abandoned walk-in queue entries.

// Cron: walk-in queue no-show sweeper. Every 15 min.
//
// A `barber_walkin_queue` row sits in status:"waiting" from the moment the customer
// joins (`joined_at`) until staff calls them in ("in_chair") or they cancel. If the
// customer just leaves without cancelling, the row never expires, it stays "waiting"
// forever. lib/barber/walkin-availability.ts (the "Frei in ~X Min" card + homepage
// walk-in band) counts EVERY "waiting" row with no time bound, so an abandoned entry
// inflates queueLength + the wait estimate for that salon permanently.
//
// This marks any "waiting" row older than the grace period as "no_show", then
// re-sequences the remaining waiting entries for each affected salon (same atomic RPC
// the operator PATCH / self-cancel DELETE routes use) so positions + ETAs close up
// behind them.
//
// Scope: this does NOT touch a pay-first hold's PaymentIntent (payment_intent_id).
// The operator-driven no-show path (PATCH /api/walkin/queue/[id]) captures a no-show
// fee out of the held card because a human confirmed the no-show; an automatic sweep
// has no such confirmation, so it leaves the manual-capture auth alone (Stripe expires
// an uncaptured auth on its own after ~7 days, no money moves either way).
//
// Grace period: 45 minutes by default (correct for a live shop), overridable via
// WALKIN_NO_SHOW_GRACE_MINUTES so the owner can widen it without a code change.
const DEFAULT_GRACE_MINUTES = 45;

function getGraceMinutes(): number {
  const raw = process.env.WALKIN_NO_SHOW_GRACE_MINUTES;
  if (!raw) return DEFAULT_GRACE_MINUTES;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GRACE_MINUTES;
}

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("walkin-no-show", async () => {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - getGraceMinutes() * 60 * 1000).toISOString();

  const { data: stale, error: selErr } = await admin
    .from("barber_walkin_queue")
    .select("id, salon_id")
    .eq("status", "waiting")
    .lt("joined_at", cutoff)
    .limit(200);

  if (selErr) {
    console.error("[cron/walkin-no-show] failed to load stale queue entries:", selErr);
    return { errors: [`Query failed: ${selErr.message}`] };
  }

  let noShowed = 0;
  const errors: string[] = [];
  const affectedSalonIds = new Set<string>();

  for (const entry of stale ?? []) {
    // Re-assert the guard in the WHERE clause: only flip a row that is STILL waiting.
    // If staff called it in between our SELECT and now, this matches 0 rows. PostgREST
    // returns error:null on a zero-row update, so the CAS is proven by chaining
    // .select().maybeSingle() and checking the result, not by the absence of an error
    // (same pattern as abandon-sweep and the operator PATCH/DELETE routes).
    const { data: updatedEntry, error: updErr } = await admin
      .from("barber_walkin_queue")
      .update({ status: "no_show", completed_at: new Date().toISOString() })
      .eq("id", entry.id)
      .eq("status", "waiting")
      .select("id")
      .maybeSingle();

    if (updErr) {
      console.error(`[cron/walkin-no-show] failed to mark entry ${entry.id} no_show:`, updErr);
      errors.push(`entry ${entry.id}: no_show update failed: ${updErr.message}`);
      continue;
    }

    if (!updatedEntry) {
      // 0 rows matched: staff called this entry in between our SELECT and now.
      // Not an error, just a lost race, don't count it and don't resequence for it.
      continue;
    }

    noShowed++;
    affectedSalonIds.add(entry.salon_id);
  }

  // Re-sequence once per affected salon so the remaining waiting entries' positions
  // + ETAs self-heal (same atomic RPC as the operator PATCH / self-cancel DELETE).
  for (const salonId of affectedSalonIds) {
    const { error: reseqErr } = await admin.rpc("resequence_walkin_queue", { p_salon_id: salonId });
    if (reseqErr) {
      console.error(`[cron/walkin-no-show] resequence failed for salon ${salonId}:`, reseqErr);
      errors.push(`salon ${salonId}: resequence failed: ${reseqErr.message}`);
    }
  }

  return {
    processed: (stale ?? []).length,
    noShowed,
    resequencedSalons: affectedSalonIds.size,
    errors,
  };
  });
}
