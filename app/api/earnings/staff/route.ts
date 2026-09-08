export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAuth, requireSalonAccess } from "@/lib/auth/require";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { zurichWallClockToUtc } from "@/lib/time/zurich";

const PAGE_SIZE = 500;
const civilDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
const querySchema = z.object({
  salon_id: z.string().uuid(),
  from: civilDate.nullable(),
  to: civilDate.nullable(),
}).refine(({ from, to }) => !from || !to || from <= to);

// Same counted-read contract as Store CRM: a short REST page may be the server cap.
// This establishes completeness, not transaction snapshot isolation between pages.
async function readAllRows<T extends { id: string }>(
  readPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null; error: { message: string } | null; count: number | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  const seen = new Set<string>();
  let expected: number | null = null;
  do {
    const { data, error, count } = await readPage(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || count == null || !Number.isSafeInteger(count) || count < 0) throw new Error("Earnings count unavailable");
    if (expected !== null && count !== expected) throw new Error("Earnings population changed during read");
    expected = count;
    if ((!data.length && rows.length < count) || rows.length + data.length > count) throw new Error("Earnings population incomplete");
    for (const row of data) {
      if (!row.id || seen.has(row.id)) throw new Error("Earnings population identity changed during read");
      seen.add(row.id);
      rows.push(row);
    }
  } while (rows.length < expected);
  return rows;
}

function chargedRappen(booking: { paid_amount: number | null; price_paid: number; payment_status: string | null }): number {
  if (booking.paid_amount != null) {
    if (!Number.isSafeInteger(booking.paid_amount) || booking.paid_amount < 0) throw new Error("Invalid captured amount");
    return booking.paid_amount;
  }
  // A settled row with missing capture is unknown, never proof of the quoted price.
  if (["paid", "refunded", "partially_refunded", "disputed"].includes(booking.payment_status ?? "")) {
    throw new Error("Captured amount unavailable");
  }
  // Legacy completed pay-at-Store rows retain their stored CHF quote as a proxy.
  // Current service prices cannot establish the historical amount paid.
  const value: unknown = booking.price_paid;
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+(\.\d+)?$/.test(value))) throw new Error("Recorded price unavailable");
  const price = Number(value);
  const cents = Math.round(price * 100);
  if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(cents)) throw new Error("Invalid recorded price");
  return cents;
}

// Gross completed-work estimate at current staff commission rates, before refunds.
// This is separate from the platform's salon_payouts ledger; it does not issue pay.
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const banned = await checkUserBanned(auth.user.id);
  if (banned) return banned;
  const rateLimited = await applyRateLimit(generalLimiter, { userId: auth.user.id });
  if (rateLimited) return rateLimited;

  const parsed = querySchema.safeParse({
    salon_id: req.nextUrl.searchParams.get("salon_id"),
    from: req.nextUrl.searchParams.get("from"),
    to: req.nextUrl.searchParams.get("to"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid earnings query" }, { status: 400 });
  const { salon_id: salonId, from, to } = parsed.data;
  const access = await requireSalonAccess(salonId, "finance", auth);
  if (access instanceof NextResponse) return access;
  const admin = createAdminSupabaseClient();

  try {
    const staffMembers = await readAllRows((start, end) => admin.from("staff_members")
      .select("id, name, avatar_url, commission_rate, is_active", { count: "exact" })
      .eq("salon_id", salonId).order("id", { ascending: true }).range(start, end));
    if (!staffMembers.length) return NextResponse.json({ staff: [] });

    const startAt = from ? zurichWallClockToUtc(from, 0, 0).toISOString() : null;
    let endAt: string | null = null;
    if (to) {
      const nextDate = new Date(`${to}T00:00:00Z`);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      const nextDay = nextDate.toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDay)) return NextResponse.json({ error: "Invalid earnings query" }, { status: 400 });
      endAt = zurichWallClockToUtc(nextDay, 0, 0).toISOString();
    }
    const bookings = await readAllRows((start, end) => {
      let query = admin.from("bookings")
        .select("id, staff_member_id, paid_amount, price_paid, payment_status", { count: "exact" })
        .eq("salon_id", salonId).eq("status", "completed");
      if (startAt) query = query.gte("starts_at", startAt);
      if (endAt) query = query.lt("starts_at", endAt);
      return query.order("id", { ascending: true }).range(start, end);
    });

    const memberIds = new Set(staffMembers.map((member) => member.id));
    const earnings = new Map<string, number>();
    for (const booking of bookings) {
      if (!booking.staff_member_id) continue;
      if (!memberIds.has(booking.staff_member_id)) throw new Error("Completed work staff identity unavailable");
      const total = (earnings.get(booking.staff_member_id) ?? 0) + chargedRappen(booking);
      if (!Number.isSafeInteger(total)) throw new Error("Earnings amount exceeds safe precision");
      earnings.set(booking.staff_member_id, total);
    }
    const staff = staffMembers.filter((member) => member.is_active || earnings.has(member.id)).map((member) => {
      const cents = earnings.get(member.id) ?? 0;
      const rate = member.commission_rate ?? 0;
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error("Invalid staff commission rate");
      const staffCents = Math.round(cents * rate / 100);
      return {
        id: member.id, name: member.name, avatar_url: member.avatar_url,
        commission_rate: rate, gross: cents / 100,
        staff_share: staffCents / 100, house_share: (cents - staffCents) / 100,
        is_active: member.is_active,
      };
    });
    staff.sort((a, b) => b.gross - a.gross);
    return NextResponse.json({ staff });
  } catch (error) {
    console.error("[earnings/staff] completed-work earnings read failed:", error);
    return NextResponse.json({ error: "Could not load staff earnings" }, { status: 500 });
  }
}
