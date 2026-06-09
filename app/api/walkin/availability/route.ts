export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getWalkinAvailability } from "@/lib/barber/walkin-availability";

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
  const availability = await getWalkinAvailability(admin, salonIds);
  return NextResponse.json({ availability });
}
