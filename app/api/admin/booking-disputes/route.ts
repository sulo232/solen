export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// SP-5 Endpoint 3 — Admin unified case queue + search-by-order-code.
//
// EXTENDS the existing admin list (was: select('*') of ALL booking_disputes, no
// filter). Additive query params (an existing no-arg call still returns
// everything, back-compat preserved):
//   - code      exact reference_code lookup (uppercased + trimmed). Resolves the
//               booking by code, returns that booking's case(s) in BOTH
//               directions (refund + upcharge).
//   - status    filter (default: all).
//   - direction refund | upcharge | all (default all).
//   - limit     default 50, max 100.
//   - cursor    created_at keyset (descending).
//
// One queue spans both directions. Money stays INTEGER Rappen. The admin gate is
// the repeated app-wide inline pattern (getSession → profiles.role==='admin' →
// service-role client); no shared helper exists, so it is matched, not invented.

const ALLOWED_STATUSES = new Set([
  "open", "salon_reviewing", "salon_approved", "salon_rejected", "escalated",
  "admin_approved", "admin_rejected", "refunded", "charged", "void", "closed",
  // 075-era generic statuses still readable for back-compat.
  "resolved", "dismissed",
]);

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  const sp = req.nextUrl.searchParams;
  const codeParam = sp.get("code");
  const statusParam = sp.get("status");
  const directionParam = sp.get("direction");
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 50, 1), 100);
  const cursor = sp.get("cursor"); // created_at keyset (descending)

  // ── search-by-order-code: resolve the booking first, then scope to its cases.
  // Exact lookup (codes are exact tokens, e.g. SOL-7K2QX); uppercased + trimmed.
  let bookingIdFilter: string[] | null = null;
  if (codeParam != null) {
    const code = codeParam.trim().toUpperCase();
    if (!code) return NextResponse.json({ disputes: [], next_cursor: null });
    const { data: booking } = await admin
      .from("bookings")
      .select("id")
      .eq("reference_code", code)
      .maybeSingle();
    // Admin path is role-gated, so a precise empty result for a bad code is fine
    // (no enumeration concern here — that posture is for the guest-facing paths).
    if (!booking) return NextResponse.json({ disputes: [], next_cursor: null });
    bookingIdFilter = [booking.id];
  }

  // bookings/salons are real FKs and embed cleanly. reporter/reported are NOT:
  // booking_disputes.reporter_id / reported_id FK auth.users(id), not
  // public.profiles, so an embedded `profiles!reporter_id` join fails at runtime
  // ("Could not find a relationship … in the schema cache"). Resolve those names
  // with a batched profiles lookup below and re-attach under the SAME response
  // keys (reporter / reported) so the existing BookingDisputePanel renders
  // unchanged. reference_code is added to the bookings select for the order column.
  let query = admin
    .from("booking_disputes")
    .select(`
      *,
      bookings(id, reference_code, starts_at, price_paid, paid_amount, refunded_amount, salon_id, salons(name, slug))
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (bookingIdFilter) query = query.in("booking_id", bookingIdFilter);

  if (statusParam && ALLOWED_STATUSES.has(statusParam.trim())) {
    query = query.eq("status", statusParam.trim());
  }

  if (directionParam && directionParam !== "all") {
    const dir = directionParam.trim();
    if (dir === "refund" || dir === "upcharge") query = query.eq("direction", dir);
  }

  if (cursor) query = query.lt("created_at", cursor);

  const { data: disputes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Batched display-name lookup for reporter (customer) + reported (salon owner).
  // profiles.id IS the auth user id, so reporter_id / reported_id key straight in.
  const personIds = Array.from(
    new Set(
      (disputes ?? [])
        .flatMap((d: Record<string, any>) => [d.reporter_id, d.reported_id])
        .filter(Boolean) as string[],
    ),
  );
  const nameById = new Map<string, string>();
  if (personIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", personIds);
    for (const p of profiles ?? []) {
      if (p.display_name) nameById.set(p.id, p.display_name);
    }
  }

  // Enrich each row with the SP-3 reviewer fields at the top level (so the panel
  // doesn't have to dig) + re-attach reporter/reported under their original keys.
  const rows: Record<string, any>[] = (disputes ?? []).map((d: Record<string, any>) => ({
    ...d,
    reporter: { display_name: d.reporter_id ? nameById.get(d.reporter_id) ?? null : null },
    reported: { display_name: d.reported_id ? nameById.get(d.reported_id) ?? null : null },
    reference_code: d.bookings?.reference_code ?? null,
    eligibility: d.eligibility ?? null,
    fast_track: d.fast_track_recommended ?? false,
    amount_paid: d.bookings?.paid_amount ?? 0,
    already_refunded: d.bookings?.refunded_amount ?? 0,
  }));

  const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;

  return NextResponse.json({ disputes: rows, next_cursor: nextCursor });
}
