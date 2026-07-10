export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// SP-5 Endpoint 4 — Admin case detail + the full `case_events` timeline.
//
// Sibling of the existing [id]/action route. Returns one enriched case plus its
// "what happened" event log (ascending), each entry with the resolved actor name
// (profiles.display_name, or the booking's guest_name when the actor is a guest /
// actor_user_id is null). case_events is READ-ONLY here — rows are written only by
// SP-3 transition logic, never by SP-5. Money is INTEGER Rappen.
//
// AUTHZ: admin, same inline gate as every app/api/admin/* route.

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: disputeId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  // bookings/salons are real FKs and embed cleanly. reporter/reported are NOT:
  // reporter_id / reported_id FK auth.users(id), not public.profiles, so an
  // embedded `profiles!reporter_id` join fails at runtime. Resolve those names
  // (and the timeline actor names) with a batched profiles lookup below.
  const { data: dispute, error } = await admin
    .from("booking_disputes")
    .select(`
      *,
      bookings(id, reference_code, starts_at, price_paid, paid_amount, refunded_amount, salon_id, guest_name, guest_email, guest_phone, salons(name, slug))
    `)
    .eq("id", disputeId)
    .maybeSingle();
  if (error) {
    console.error("[admin/booking-disputes/[id]] case query failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!dispute) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  // Timeline — ascending, the chronological "what happened".
  const { data: events, error: evErr } = await admin
    .from("case_events")
    .select("id, action, actor_role, actor_user_id, from_status, to_status, amount, note, created_at")
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: true });
  if (evErr) {
    console.error("[admin/booking-disputes/[id]] timeline query failed:", evErr.message);
    return NextResponse.json({ error: evErr.message }, { status: 500 });
  }

  // One batched display-name lookup covering both the case parties (reporter =
  // customer, reported = salon owner) and the timeline actors. profiles.id IS the
  // auth user id, so all of reporter_id / reported_id / actor_user_id key in.
  const personIds = Array.from(
    new Set(
      [
        (dispute as any).reporter_id,
        (dispute as any).reported_id,
        ...(events ?? []).map((e) => e.actor_user_id),
      ].filter(Boolean) as string[],
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
  const guestName = (dispute as any).bookings?.guest_name ?? null;

  // Build the enriched case row now that names are resolved — reporter/reported
  // under the same keys the queue uses, so a detail view reads consistently.
  const caseRow = {
    ...dispute,
    reporter: {
      display_name: (dispute as any).reporter_id
        ? nameById.get((dispute as any).reporter_id) ?? null
        : null,
    },
    reported: {
      display_name: (dispute as any).reported_id
        ? nameById.get((dispute as any).reported_id) ?? null
        : null,
    },
    reference_code: (dispute as any).bookings?.reference_code ?? null,
    eligibility: (dispute as any).eligibility ?? null,
    fast_track: (dispute as any).fast_track_recommended ?? false,
    amount_paid: (dispute as any).bookings?.paid_amount ?? 0,
    already_refunded: (dispute as any).bookings?.refunded_amount ?? 0,
  };

  const timeline = (events ?? []).map((e) => ({
    id: e.id,
    action: e.action,
    actor_type: e.actor_role,
    actor_id: e.actor_user_id,
    actor_name: e.actor_user_id
      ? nameById.get(e.actor_user_id) ?? null
      : e.actor_role === "guest"
        ? guestName
        : null,
    from_status: e.from_status,
    to_status: e.to_status,
    amount: e.amount,
    note: e.note,
    at: e.created_at,
  }));

  return NextResponse.json({ case: caseRow, timeline });
}
