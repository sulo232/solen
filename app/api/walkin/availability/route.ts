export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";

// GET /api/walkin/availability?salon_ids=id1,id2,... — Public.
// Returns live walk-in wait per BARBERSHOP salon (others omitted). Batched: a fixed
// number of queries regardless of how many salon_ids are passed. Used by search/listings
// to render "Frei in ~X Min" on barbershop cards.
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return NextResponse.json({ availability: {} });

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const idsParam = req.nextUrl.searchParams.get("salon_ids");
  const salonIds = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  if (salonIds.length === 0) return NextResponse.json({ availability: {} });

  const admin = createAdminSupabaseClient();

  // Restrict to barbershops — walk-in is barber-only.
  const { data: salons } = await admin.from("salons").select("id, categories").in("id", salonIds);
  const barbershopIds = (salons ?? [])
    .filter((s) => (s.categories as string[] | null)?.includes("barbershop"))
    .map((s) => s.id);
  if (barbershopIds.length === 0) return NextResponse.json({ availability: {} });

  const [{ data: queue }, { data: staff }, { data: services }] = await Promise.all([
    admin.from("barber_walkin_queue").select("salon_id").in("salon_id", barbershopIds).eq("status", "waiting"),
    admin.from("staff_members").select("salon_id").in("salon_id", barbershopIds).eq("is_active", true),
    admin.from("services").select("salon_id, duration_minutes").in("salon_id", barbershopIds).eq("is_active", true),
  ]);

  const waitingBySalon = new Map<string, number>();
  for (const q of queue ?? []) waitingBySalon.set(q.salon_id, (waitingBySalon.get(q.salon_id) ?? 0) + 1);

  const barbersBySalon = new Map<string, number>();
  for (const s of staff ?? []) barbersBySalon.set(s.salon_id, (barbersBySalon.get(s.salon_id) ?? 0) + 1);

  const durSum = new Map<string, { total: number; count: number }>();
  for (const sv of services ?? []) {
    const cur = durSum.get(sv.salon_id) ?? { total: 0, count: 0 };
    cur.total += sv.duration_minutes ?? 30;
    cur.count += 1;
    durSum.set(sv.salon_id, cur);
  }

  const availability: Record<string, { waitMinutes: number; queueLength: number }> = {};
  for (const id of barbershopIds) {
    const waiting = waitingBySalon.get(id) ?? 0;
    const barbers = barbersBySalon.get(id) ?? 1;
    const d = durSum.get(id);
    const avgDuration = d && d.count > 0 ? Math.round(d.total / d.count) : 30;
    availability[id] = { waitMinutes: estimateWaitMinutes(waiting, avgDuration, barbers), queueLength: waiting };
  }

  return NextResponse.json({ availability });
}
