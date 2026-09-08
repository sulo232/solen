export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, dashboardBatchSchema } from "@/lib/validations";
import { requireSalonAccess } from "@/lib/auth/require";
import { hasPermission, type StaffPermissions } from "@/lib/staff-permissions";

/**
 * Dashboard batch endpoint — runs multiple sub-requests in parallel instead of
 * waterfall fetches from the client.
 *
 * POST body: { salonId: string; requests: string[] }
 * where requests is an array of keys like:
 *   "bookings_today" | "revenue_month" | "reviews_pending" | "walkin_queue" | "activity_feed"
 */

// input-abuse-07 (2026-07-27): the key enum + array-length bound now live in
// lib/validations.ts's dashboardBatchSchema (DASHBOARD_BATCH_KEYS), not here.

// P9-2 punch (round 2): the whole call is gated "calendar" below, but
// "revenue_month" is the one key in the switch that returns money
// (booking_revenue_sum). The other four ("bookings_today", "reviews_pending",
// "walkin_queue", "activity_feed") return counts/lists, no CHF amounts, so
// they stay under the calendar gate alone.
const MONEY_KEYS = new Set(["revenue_month"]);

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const rawBody = await request.json();
  const { data: validated, error: validationError } = validateBody(dashboardBatchSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: "salonId and a valid, bounded requests array required" }, { status: 400 });
  }
  const { salonId, requests } = validated;

  // P9-2: gates the WHOLE batch call with "calendar" (the dashboard home is a
  // calendar-area screen); a calendar-only staff member (the "staff" preset,
  // lib/staff-permissions.ts) reaches this point, but see the finance
  // check below for the one key that is not calendar data.
  const accessResult = await requireSalonAccess(salonId, "calendar");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

  // Owner/admin always carry finance (requireSalonAccess's own model: those
  // two "via" values are always full access). A "staff" caller passed the
  // calendar check above but may not have "finance" too, so re-check their
  // permissions row directly (requireSalonAccess doesn't expose it, only
  // staffId) before letting them read revenue_month below.
  let hasFinance: boolean;
  if (accessResult.via === "staff") {
    const { data: staffRow } = await admin
      .from("staff_members")
      .select("permissions")
      .eq("id", accessResult.staffId)
      .maybeSingle<{ permissions: StaffPermissions | null }>();
    hasFinance = hasPermission(staffRow?.permissions, "finance");
  } else {
    hasFinance = true;
  }

  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const results: Record<string, unknown> = {};

  await Promise.all(
    requests.map(async (key) => {
      if (MONEY_KEYS.has(key) && !hasFinance) {
        results[key] = { error: "NOT_AUTHORIZED_FOR_AREA" };
        return;
      }
      try {
        switch (key) {
          case "bookings_today": {
            const { count } = await admin
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("salon_id", salonId)
              .gte("starts_at", `${today}T00:00:00`)
              .lte("starts_at", `${today}T23:59:59`);
            results[key] = { count: count ?? 0 };
            break;
          }
          case "revenue_month": {
            const { data, error } = await admin.rpc("booking_revenue_sum", {
              p_salon_id: salonId,
              p_since: monthStart,
            });
            if (error) console.error("[dashboard/batch] revenue_month rpc error:", error.message);
            // PostgREST returns the scalar numeric as a JSON number in practice, but
            // coerce defensively in case it ever comes back as a numeric string.
            const total = data == null ? 0 : Number(data);
            results[key] = { total };
            break;
          }
          case "reviews_pending": {
            // Round 10 Y3: "pending" = has no row in review_replies (the winning table
            // for owner replies; reviews.salon_response is retired dead weight, see
            // _design-system/REMOVED.md). review_replies.review_id is UNIQUE, so its
            // per-salon row count already equals the number of DISTINCT reviews that
            // have been replied to, no id-list needed.
            const [totalRes, repliedRes] = await Promise.all([
              admin.from("reviews").select("id", { count: "exact", head: true }).eq("salon_id", salonId),
              admin.from("review_replies").select("id", { count: "exact", head: true }).eq("salon_id", salonId),
            ]);
            if (totalRes.error) console.error("[dashboard/batch] reviews_pending total query error:", totalRes.error.message);
            if (repliedRes.error) console.error("[dashboard/batch] reviews_pending replied query error:", repliedRes.error.message);
            results[key] = { count: Math.max(0, (totalRes.count ?? 0) - (repliedRes.count ?? 0)) };
            break;
          }
          case "walkin_queue": {
            const { data } = await admin
              .from("barber_walkin_queue")
              .select("id, status")
              .eq("salon_id", salonId)
              .in("status", ["waiting", "in_chair"]);
            results[key] = { waiting: (data ?? []).filter((r) => r.status === "waiting").length, in_chair: (data ?? []).filter((r) => r.status === "in_chair").length };
            break;
          }
          case "activity_feed": {
            const [bookingsRes, reviewsRes] = await Promise.all([
              admin.from("bookings").select("id, starts_at, status, created_at").eq("salon_id", salonId).order("created_at", { ascending: false }).limit(5),
              admin.from("reviews").select("id, rating, created_at").eq("salon_id", salonId).order("created_at", { ascending: false }).limit(5),
            ]);
            const bookingItems = (bookingsRes.data ?? []).map((b) => ({ type: "booking", ...b }));
            const reviewItems = (reviewsRes.data ?? []).map((r) => ({ type: "review", ...r }));
            const feed = [...bookingItems, ...reviewItems].sort((a, b) =>
              (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0)
            ).slice(0, 8);
            results[key] = { feed };
            break;
          }
        }
      } catch {
        results[key] = { error: "failed" };
      }
    })
  );

  return NextResponse.json({ results });
}
