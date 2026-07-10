export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { findQueueEntryByToken } from "@/lib/walkin/authz";

// POST /api/walkin/review — a guest walk-in rates their finished visit, gated ONLY on the
// queue tracking token (the customer is usually a guest, no auth). Submitted from the merged
// done+rate+tip screen: 5-star rating + optional comment. Writes a normal `reviews` row and
// recomputes BOTH the salon's and the barber's average_rating/review_count, so per-staff
// counts grow on every visit (the salon-only recompute in /api/reviews didn't touch staff).
//
// Dedupe: best-effort. barber_walkin_queue has no booking_id, so we can't key on it like
// /api/reviews does; we skip a duplicate when the SAME signed-in customer already reviewed
// this barber today. Robust per-visit dedupe (a reviews.walkin_queue_id unique index) is a
// flagged hardening follow-up — until then the rate-limiter + one-shot UI cover casual cases.
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  const rating = body?.rating; // strict: reject strings/booleans/arrays (no Number() coercion)
  const commentRaw = typeof body?.comment === "string" ? body.comment.trim().slice(0, 600) : "";
  const comment = commentRaw.length > 0 ? commentRaw : null;

  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be an integer 1-5" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // The tracking token is the only authorization (guest walk-in). Resolve via the shared gate.
  const entry = await findQueueEntryByToken<{
    id: string; salon_id: string; status: string;
    assigned_barber_id: string | null; preferred_barber_id: string | null; customer_id: string | null;
  }>(admin, token, "id, salon_id, status, assigned_barber_id, preferred_barber_id, customer_id");
  if (!entry) return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });

  // Only a FINISHED visit can be rated (mirrors /api/reviews' completed-booking gate).
  if (entry.status !== "completed") {
    return NextResponse.json({ error: "Visit is not completed yet" }, { status: 400 });
  }

  let staffId = entry.assigned_barber_id ?? entry.preferred_barber_id;

  // Defense in depth: re-verify the staff id still belongs to this entry's salon before it is
  // written anywhere (the review row's staff_member_id, and the staff_members UPDATE below).
  // A poisoned assigned_barber_id must not be able to mutate another salon's staff row.
  if (staffId) {
    const { data: staffRow } = await admin
      .from("staff_members")
      .select("id")
      .eq("id", staffId)
      .eq("salon_id", entry.salon_id)
      .maybeSingle();
    if (!staffRow) staffId = null;
  }

  // Best-effort moderation (never block the submit on an automod hiccup).
  let mod: { flagged: boolean; hidden: boolean; reason: string | null } = { flagged: false, hidden: false, reason: null };
  if (comment) {
    try {
      const { checkReview } = await import("@/lib/automod");
      const r = await checkReview({ comment, rating, user_id: entry.customer_id ?? "guest", salon_id: entry.salon_id });
      mod = { flagged: !!r.flagged, hidden: !!r.hidden, reason: r.reason ?? null };
    } catch (e) {
      console.error("[walkin/review] automod failed (allowing):", e);
    }
  }

  // UPSERT keyed on walkin_queue_id: one review per visit (the partial unique index from
  // migration 20260610_walkin_review). A re-submit for the same visit updates in place
  // instead of inserting a duplicate — this is the real dedupe (works for guests too).
  const { data: upserted, error: upErr } = await admin
    .from("reviews")
    .upsert({
      walkin_queue_id: entry.id,
      salon_id: entry.salon_id,
      user_id: entry.customer_id ?? null,
      booking_id: null,
      rating,
      comment,
      staff_member_id: staffId,
      is_flagged: mod.flagged,
      is_hidden: mod.hidden,
      flag_reason: mod.reason,
    }, { onConflict: "walkin_queue_id" })
    .select("id")
    .single();

  if (upErr) {
    console.error("[walkin/review] upsert failed:", upErr.message);
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }

  // Recompute averages from VISIBLE reviews. Salon (mirrors /api/reviews) + barber (new —
  // this is what makes per-staff counts real; the staff number drives the tip + status screens).
  try {
    const { data: salonRows } = await admin.from("reviews").select("rating").eq("salon_id", entry.salon_id).eq("is_hidden", false);
    if (salonRows) {
      const savg = salonRows.length > 0 ? salonRows.reduce((s, r) => s + r.rating, 0) / salonRows.length : null;
      await admin.from("salons").update({ average_rating: savg !== null ? Math.round(savg * 100) / 100 : null, review_count: salonRows.length }).eq("id", entry.salon_id);
    }
    if (staffId) {
      // Scope to THIS salon, a barber working at multiple salons must not cross-contaminate ratings.
      const { data: staffRows } = await admin.from("reviews").select("rating").eq("staff_member_id", staffId).eq("salon_id", entry.salon_id).eq("is_hidden", false);
      if (staffRows) {
        const savg = staffRows.length > 0 ? staffRows.reduce((s, r) => s + r.rating, 0) / staffRows.length : null;
        await admin.from("staff_members").update({ average_rating: savg !== null ? Math.round(savg * 100) / 100 : null, review_count: staffRows.length }).eq("id", staffId);
      }
    }
  } catch (e) {
    console.error("[walkin/review] rating recompute failed (review saved):", e);
  }

  return NextResponse.json({ ok: true, id: upserted.id });
}
