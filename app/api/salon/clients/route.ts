export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { requireSalonAccess } from "@/lib/auth/require";
import { createAdminSupabaseClient } from "@/lib/supabase";

// Query/URL chunk sizes, not a cap on the returned client population.
const PAGE_SIZE = 500;
const CLIENT_ID_BATCH_SIZE = 100;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// A short PostgREST page can be its configured row cap, not the end of the population.
// Advance by the actual returned rows and require the exact count before using aggregates.
async function readAllRows<T extends { id: string | null }>(
  readPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
    count: number | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  const seen = new Set<string>();
  let expectedCount: number | null = null;
  do {
    const { data, error, count } = await readPage(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || count == null || !Number.isSafeInteger(count) || count < 0) {
      throw new Error("Client population count unavailable");
    }
    if (expectedCount !== null && count !== expectedCount) {
      throw new Error("Client population changed during read");
    }
    expectedCount = count;
    if ((data.length === 0 && rows.length < count) || rows.length + data.length > count) {
      throw new Error("Client population read incomplete");
    }
    for (const row of data) {
      if (!row.id || seen.has(row.id)) throw new Error("Client population identity changed during read");
      seen.add(row.id);
      rows.push(row);
    }
  } while (rows.length < expectedCount);
  return rows;
}

interface ClientAggregate {
  user_id: string;
  last_visit: string;
  total_bookings: number;
  spent: number;
  completedVisits: number;
  lastCompletedAt: number | null;
  segmentSpendRappen: number;
}

// GET /api/salon/clients?salon_id=xxx: List clients who have booked at this salon
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (clients = clients & CRM) instead of the old
  // owner-or-admin compare. The owner path is unchanged: same owner_id
  // === user.id comparison, just made inside the shared gate.
  const accessResult = await requireSalonAccess(salonId, "clients");
  if (accessResult instanceof NextResponse) return accessResult;

  // P9-2 RLS fix: bookings_select_own is owner-only, so a granted staff
  // caller reading through the session client got silently empty results
  // past the gate. Resource I/O runs on the admin client from here on,
  // every query still scoped to the gated salonId.
  const admin = createAdminSupabaseClient();

  const now = Date.now();
  try {
    const bookings = await readAllRows((from, to) => admin
      .from("bookings")
      .select("id, user_id, starts_at, price_paid, paid_amount, refunded_amount, payment_status, status", { count: "exact" })
      .eq("salon_id", salonId)
      .not("user_id", "is", null)
      .order("id", { ascending: true })
      .range(from, to));

    const clientMap = new Map<string, ClientAggregate>();
    for (const booking of bookings) {
      if (!booking.user_id) continue;
      const visitAt = new Date(booking.starts_at).getTime();
      const client = clientMap.get(booking.user_id) ?? {
        user_id: booking.user_id,
        last_visit: booking.starts_at,
        total_bookings: 0,
        spent: 0,
        completedVisits: 0,
        lastCompletedAt: null,
        segmentSpendRappen: 0,
      };
      // Preserve the existing public count/latest-booking and completed quote-sum fields.
      client.total_bookings++;
      if (visitAt > new Date(client.last_visit).getTime()) client.last_visit = booking.starts_at;
      if (booking.status === "completed") client.spent += Number(booking.price_paid ?? 0);

      if (booking.status === "completed" && visitAt < now) {
        client.completedVisits++;
        client.lastCompletedAt = Math.max(client.lastCompletedAt ?? visitAt, visitAt);
        const settled = ["paid", "refunded", "partially_refunded", "disputed"].includes(booking.payment_status ?? "");
        // paid_amount/refunded_amount are Rappen; price_paid is the stored CHF quote.
        // Unsettled legacy/in-person rows retain the existing recorded-price proxy.
        // A settled row with no recorded amount has unknown value, not a paid quote.
        const grossRappen = booking.paid_amount != null && (booking.paid_amount > 0 || settled)
          ? booking.paid_amount
          : settled ? 0 : Math.round(Number(booking.price_paid ?? 0) * 100);
        client.segmentSpendRappen += Math.max(0, grossRappen - (booking.refunded_amount ?? 0));
      }
      clientMap.set(booking.user_id, client);
    }

    const clientIds = Array.from(clientMap.keys());
    if (clientIds.length === 0) return NextResponse.json({ clients: [] });

    const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    const tagMap = new Map<string, { tag: string; color: string }[]>();
    for (let offset = 0; offset < clientIds.length; offset += CLIENT_ID_BATCH_SIZE) {
      const ids = clientIds.slice(offset, offset + CLIENT_ID_BATCH_SIZE);
      const [profiles, tags] = await Promise.all([
        readAllRows((from, to) => admin.from("public_profiles")
          .select("id, display_name, avatar_url", { count: "exact" })
          .in("id", ids).order("id", { ascending: true }).range(from, to)),
        readAllRows((from, to) => admin.from("client_tags")
          .select("id, customer_id, tag, color", { count: "exact" })
          .eq("salon_id", salonId).in("customer_id", ids)
          .order("id", { ascending: true }).range(from, to)),
      ]);
      for (const profile of profiles) {
        if (profile.id) profileMap.set(profile.id, profile);
      }
      for (const tag of tags) {
        const list = tagMap.get(tag.customer_id) ?? [];
        list.push({ tag: tag.tag, color: tag.color ?? "" });
        tagMap.set(tag.customer_id, list);
      }
    }

    // Thresholds and precedence: 20260328_create_rfm_materialized_view.sql.
    // Segments use completed past visits and retained value, independently of the public fields.
    const clients = Array.from(clientMap.values()).map((client) => {
      const profile = profileMap.get(client.user_id);
      const daysSince = client.lastCompletedAt == null ? null : Math.floor((now - client.lastCompletedAt) / MS_PER_DAY);
      let segmentTag = "Regulär";
      if (client.completedVisits >= 4 && client.segmentSpendRappen >= 50000) segmentTag = "VIP";
      else if (client.completedVisits >= 2 && daysSince != null && daysSince > 90) segmentTag = "Gefährdet";
      else if (client.completedVisits === 1 && daysSince != null && daysSince < 30) segmentTag = "Neu";
      return {
        user_id: client.user_id,
        display_name: profile?.display_name ?? "Unbekannt",
        avatar_url: profile?.avatar_url ?? null,
        last_visit: client.last_visit,
        total_bookings: client.total_bookings,
        tags: tagMap.get(client.user_id) ?? [],
        segment_tag: segmentTag,
        total_spent: client.spent,
      };
    });

    clients.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime());
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("[salon/clients] client population read failed:", error);
    return NextResponse.json({ error: "Could not load clients" }, { status: 500 });
  }
}
