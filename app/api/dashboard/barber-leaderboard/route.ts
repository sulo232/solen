import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireSalonAccess } from "@/lib/auth/require";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const salonId = url.searchParams.get("salon_id");
  const period = url.searchParams.get("period") || "week";

  if (!salonId) {
    return NextResponse.json({ error: "salon_id is required" }, { status: 400 });
  }

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (finance) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "finance");
  if (accessResult instanceof NextResponse) return accessResult;

  // Get current date range based on period
  const now = new Date();
  const startDate = new Date();
  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "year") {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  const admin = createAdminSupabaseClient();

  // 1. Fetch staff members. P9-2 (2026-09-05): staff_select_public only
  // covers is_active = true rows and staff_manage_owner (the ALL policy
  // covering inactive rows) is owner-only, so a staff member granted
  // "finance" above would see a partial roster (any inactive staff row
  // silently missing) through the session client. Admin client, scoped to
  // the same gated salonId, for the full roster.
  // NOTE: staff_members has no `display_name` column, the real column is `name`
  // (checked lib/database.types.ts); switched below.
  const { data: staffMembers, error: staffError } = await admin
    .from("staff_members")
    .select("id, user_id, name")
    .eq("salon_id", salonId);

  if (staffError || !staffMembers) {
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }

  const staffIds = staffMembers.map(s => s.id);

  if (staffIds.length === 0) {
    return NextResponse.json({ stats: [] });
  }

  // 2. Scheduled bookings within period (price_paid is in CHF francs; no `price`/`is_walkin`
  //    columns exist on bookings, those were phantom). "Bookings completed" and revenue are
  //    both scoped to status "completed" below, matching the salon analytics route's convention
  //    (app/api/analytics/salon/[id]/route.ts), so a cancelled/no-show booking never counts.
  const { data: bookings, error: bookingsError } = await admin
    .from("bookings")
    .select("id, staff_member_id, price_paid, status")
    .eq("salon_id", salonId)
    .gte("starts_at", startDate.toISOString())
    .lte("starts_at", now.toISOString());

  if (bookingsError) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  // 3. Walk-ins within period from the live queue, the real source of walk-in volume and
  //    conversion, keyed to the barber who actually took the chair (assigned_barber_id).
  const { data: walkins, error: walkinsError } = await admin
    .from("barber_walkin_queue")
    .select("assigned_barber_id, status")
    .eq("salon_id", salonId)
    .gte("joined_at", startDate.toISOString())
    .lte("joined_at", now.toISOString());

  if (walkinsError) {
    return NextResponse.json({ error: "Failed to fetch walk-in data" }, { status: 500 });
  }

  // 4. Avg rating per staff member, computed live from `reviews` (staff_member_id, rating,
  //    is_hidden all confirmed live columns). staff_members.average_rating is NOT used here:
  //    it is only kept in sync by the walk-in review flow (app/api/walkin/review/route.ts),
  //    NOT by the normal booking review flow (app/api/reviews/route.ts only recalculates the
  //    SALON average, never the per-staff one), so it silently misses every non-walk-in
  //    review. Computing straight from `reviews` avoids that stale/incomplete source.
  const { data: reviewRows, error: reviewsError } = await admin
    .from("reviews")
    .select("staff_member_id, rating")
    .eq("salon_id", salonId)
    .eq("is_hidden", false)
    .in("staff_member_id", staffIds);

  if (reviewsError) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }

  // 5. All-time completed booking history per staff (unbounded by `period`), rebooking needs
  //    to know whether a customer EVER came back to this staff member, not just within the
  //    selected week/month/year window. Same "completed" scoping as #2.
  const { data: history, error: historyError } = await admin
    .from("bookings")
    .select("staff_member_id, user_id, status")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .not("user_id", "is", null);

  if (historyError) {
    return NextResponse.json({ error: "Failed to fetch booking history" }, { status: 500 });
  }

  // 6. Aggregate stats per staff member, real values only.
  const stats = staffMembers.map(staff => {
    const staffCompletedBookings = (bookings || []).filter(
      b => b.staff_member_id === staff.id && b.status === "completed"
    );
    const bookingsCount = staffCompletedBookings.length;
    const revenue = staffCompletedBookings.reduce((sum, b) => sum + (Number(b.price_paid) || 0), 0);

    // Real avg rating, computed live from this staff member's non-hidden reviews.
    const staffReviews = (reviewRows || []).filter(r => r.staff_member_id === staff.id);
    const reviewCount = staffReviews.length;
    const avgRating = reviewCount > 0
      ? Math.round((staffReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : 0;

    // Real rebooking rate: of the unique customers this staff member has EVER completed a
    // booking with, what percent came back for a second (or more) completed booking with the
    // SAME staff member. Mirrors the salon-level retention_rate calc in
    // app/api/analytics/salon/[id]/route.ts, scoped per-staff instead of per-salon.
    const staffHistory = (history || []).filter(b => b.staff_member_id === staff.id);
    const visitsPerCustomer = new Map<string, number>();
    for (const b of staffHistory) {
      const uid = b.user_id as string;
      visitsPerCustomer.set(uid, (visitsPerCustomer.get(uid) || 0) + 1);
    }
    const uniqueCustomers = visitsPerCustomer.size;
    const repeatCustomers = [...visitsPerCustomer.values()].filter(v => v > 1).length;
    const rebookingPct = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

    // Real walk-in conversion: of the walk-ins this barber was assigned, how many completed.
    const staffWalkins = (walkins || []).filter(w => w.assigned_barber_id === staff.id);
    const walkinCount = staffWalkins.length;
    const walkinCompleted = staffWalkins.filter(w => w.status === "completed").length;
    const walkinConversionPct = walkinCount > 0 ? Math.round((walkinCompleted / walkinCount) * 100) : 0;

    return {
      staff_id: staff.id,
      staff_name: staff.name || "Unbekannt",
      bookings_count: bookingsCount,
      revenue: revenue,
      avg_rating: avgRating,
      review_count: reviewCount,
      rebooking_pct: rebookingPct,
      walkin_conversion_pct: walkinConversionPct,
    };
  });

  // Sort by revenue descending
  stats.sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({ stats });
}
