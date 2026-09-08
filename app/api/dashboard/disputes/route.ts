export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { salonRespondsByDeadline, salonResponseOverdue, type DisputeStatus } from "@/lib/bookings/dispute-engine";
import { getActiveSalonId } from "@/lib/active-salon";

// SP-5 Endpoint 1 — Salon-scoped refund/complaint REVIEW QUEUE (list only).
//
// The at-a-glance triage view the owner wants: every OPEN case on the salon's
// own bookings, enriched with the reference_code (order number), the Section 11
// eligibility hint, the requested amount + the refundable cap. The DECISION
// itself is NOT here — that already lives in SP-3's salon-review PATCH on
// `/api/bookings/[id]/report` (approve full/partial / reject + reason). Per the
// anti-duplication mandate this endpoint never moves money and never transitions
// a case; it only reads. Money is INTEGER Rappen end-to-end (the FE converts at
// its boundary).
//
// AUTHZ: authenticated SALON OWNER. We resolve the caller's salon(s) via
// salons.owner_id, reject (403) if the caller owns none, then query with the
// service-role client filtered to those salon ids — the same gate shape every
// app/api/dashboard/* route uses, but scoped to ownership, not RLS.

// Default OPEN set surfaced to the salon (active, not-yet-terminal refund cases).
const DEFAULT_OPEN_STATUSES = ["open", "salon_reviewing", "escalated"];
const ALLOWED_STATUSES = new Set([
  "open", "salon_reviewing", "salon_approved", "salon_rejected", "escalated",
  "admin_approved", "admin_rejected", "refunded", "charged", "void", "closed",
]);

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Dedicated money/lookup limiter (§10b.12) — NOT the 30/min generalLimiter.
  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Resolve the caller's salon(s). A user may own more than one. This is a
  // bespoke case for the area-gating sweep (P9-2): the route lists ALL of an
  // OWNER's salons at once (no salon_id param), which requireSalonAccess
  // can't express (it checks exactly one salon id). The owner path is
  // unchanged below; a caller who owns none falls back to the single salon
  // their active staff row grants "finance" on, same refuse-by-default
  // composition getActiveSalonId already does for other routes in this sweep.
  const { data: ownedSalons } = await admin
    .from("salons")
    .select("id, name, slug")
    .eq("owner_id", user.id);
  let salonIds: string[];
  if (ownedSalons && ownedSalons.length > 0) {
    salonIds = ownedSalons.map((s) => s.id);
  } else {
    const staffSalonId = await getActiveSalonId(admin, user.id, "finance");
    if (!staffSalonId) {
      return NextResponse.json({ error: "No salon" }, { status: 403 });
    }
    salonIds = [staffSalonId];
  }

  // Parse filters.
  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get("status");
  let statuses = DEFAULT_OPEN_STATUSES;
  if (statusParam) {
    const requested = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
    const valid = requested.filter((s) => ALLOWED_STATUSES.has(s));
    if (valid.length > 0) statuses = valid;
  }
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 50, 1), 100);
  const cursor = sp.get("cursor"); // created_at keyset (descending)

  // The salon owns the booking, not the dispute directly, scope through the
  // booking. Still fetched (small, salonIds-bound) for the reference_code /
  // starts_at / amount enrichment below, NOT for a booking_id id-list filter
  // anymore, see the fix note on the query below.
  // booking_disputes has no salon_id of its own (single source of truth stays on
  // bookings); the idx_booking_disputes_booking_id + status_created indexes keep
  // this cheap.
  const { data: salonBookings, error: bookingErr } = await admin
    .from("bookings")
    .select("id, reference_code, starts_at, service_id, user_id, guest_name, guest_email, paid_amount, refunded_amount, salon_id")
    .in("salon_id", salonIds);
  if (bookingErr) {
    console.error(
      "[dashboard/disputes] salon bookings query failed:",
      bookingErr.message, bookingErr.details, bookingErr.hint, bookingErr.code,
    );
    return NextResponse.json({ error: bookingErr.message }, { status: 500 });
  }
  if (!salonBookings || salonBookings.length === 0) {
    return NextResponse.json({ cases: [], next_cursor: null });
  }
  const bookingById = new Map(salonBookings.map((b) => [b.id, b]));

  // Cases on those bookings, filtered by status, keyset paginated.
  //
  // FIX 2026-08-21: this used to filter with `.in("booking_id", bookingIds)`,
  // bookingIds being every booking id for the caller's salon(s). A salon that
  // owns many bookings (measured: the dev-fixture owner alone has 997 across
  // 25 salons) serializes that array into the request URL, and the real
  // failure was NOT PostgREST rejecting the query, it was a proxy in front of
  // it answering a bare `400 Bad Request` (text/plain, no PostgREST error
  // body at all, confirmed by hitting the REST endpoint directly) once that
  // URL passed roughly 12-18KB. Known-answer control: the exact same select
  // shape with a 3-id `.in("booking_id", ...)` list returned rows with no
  // error, so the query SHAPE was never the problem, only the id-array size.
  // FIX: filter through the FK-verified `bookings` relationship instead
  // (booking_disputes.booking_id REFERENCES bookings(id), migration
  // 075_booking_disputes.sql:7), so the URL only ever carries `salonIds`
  // (bounded by how many salons one owner has, never by booking volume).
  // Verified same rows both ways for the dev fixture (3/3 disputes, all
  // belonging to the one salon that owns them) and a negative control: a
  // different salon's id in this same filter returns zero of this owner's
  // disputes, so the scoping boundary is unchanged.
  //
  // SORT: oldest-first (ascending) whenever the requested statuses include one
  // still awaiting a salon response (open / salon_reviewing), newest-first
  // otherwise. This is a TRIAGE queue against a live salonRespondsByDeadline()
  // clock: newest-first buried the most-overdue case (oldest created_at, the
  // one closest to auto-escalation) at the bottom of the default "open" view,
  // the one screen this endpoint exists to surface it on (response-deadline-
  // visible review, 2026-08-20). Terminal/resolved views keep recency-first,
  // there is no clock left to triage by there.
  const hasPendingSalonAction = statuses.some((s) => s === "open" || s === "salon_reviewing");
  let query = admin
    .from("booking_disputes")
    .select(
      "id, booking_id, direction, reason_code, issue_type, eligibility, fast_track_recommended, requested_amount, resolved_amount, status, description, reporter_id, created_at, bookings!inner(salon_id)",
    )
    .in("bookings.salon_id", salonIds)
    .in("status", statuses)
    .order("created_at", { ascending: hasPendingSalonAction })
    .limit(limit);
  // Keyset direction must follow the sort direction above, or ascending pages
  // would re-request the same already-seen rows instead of advancing.
  if (cursor) query = hasPendingSalonAction ? query.gt("created_at", cursor) : query.lt("created_at", cursor);

  const { data: disputes, error: disputeErr } = await query;
  if (disputeErr) {
    console.error(
      "[dashboard/disputes] dispute query failed:",
      disputeErr.message, disputeErr.details, disputeErr.hint, disputeErr.code,
    );
    return NextResponse.json({ error: disputeErr.message }, { status: 500 });
  }

  // Resolve customer display names for logged-in reporters in one batch.
  const reporterIds = Array.from(
    new Set((disputes ?? []).map((d) => d.reporter_id).filter(Boolean) as string[]),
  );
  const nameById = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", reporterIds);
    for (const p of profiles ?? []) {
      if (p.display_name) nameById.set(p.id, p.display_name);
    }
  }

  // Resolve service names (name_de fallback name_en) in one batch.
  const serviceIds = Array.from(
    new Set(salonBookings.map((b) => b.service_id).filter(Boolean) as string[]),
  );
  const serviceNameById = new Map<string, string>();
  if (serviceIds.length > 0) {
    const { data: services } = await admin
      .from("services")
      .select("id, name_de, name_en")
      .in("id", serviceIds);
    for (const s of services ?? []) {
      serviceNameById.set(s.id, s.name_de ?? s.name_en ?? "");
    }
  }

  const cases = (disputes ?? []).map((d) => {
    const b = bookingById.get(d.booking_id);
    const customerName = d.reporter_id
      ? nameById.get(d.reporter_id) ?? null
      : b?.guest_name ?? null;
    return {
      id: d.id,
      booking_id: d.booking_id,
      reference_code: b?.reference_code ?? null,
      direction: d.direction,
      reason_code: d.reason_code,
      issue_type: d.issue_type,
      eligibility: d.eligibility,
      fast_track: d.fast_track_recommended,
      requested_amount: d.requested_amount,
      resolved_amount: d.resolved_amount,
      amount_paid: b?.paid_amount ?? 0,
      already_refunded: b?.refunded_amount ?? 0,
      status: d.status,
      description: d.description,
      customer_name: customerName,
      // Same function the customer-facing report route uses (dispute-engine.ts),
      // so the date shown to the salon and the date shown to the customer are
      // computed from the one place, never two copies drifting apart.
      salon_responds_by: d.created_at
        ? salonRespondsByDeadline(d.status as DisputeStatus, d.created_at)?.toISOString() ?? null
        : null,
      // Same status/created_at inputs as salon_responds_by above, so this can
      // never disagree with it about which cases are overdue.
      salon_response_overdue: d.created_at
        ? salonResponseOverdue(d.status as DisputeStatus, d.created_at)
        : false,
      created_at: d.created_at,
      booking: {
        starts_at: b?.starts_at ?? null,
        service_name: b?.service_id ? serviceNameById.get(b.service_id) ?? null : null,
      },
    };
  });

  const nextCursor =
    cases.length === limit ? cases[cases.length - 1].created_at : null;

  return NextResponse.json({ cases, next_cursor: nextCursor });
}
