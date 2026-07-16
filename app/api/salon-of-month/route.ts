// exists-check: net-new vs app/api/admin/salon-of-month/route.ts (that route is
// admin-only, candidate-suggest + pick; this is the PUBLIC reader nothing else
// calls yet, per npm run exists "api/salon-of-month" = 0 matches). Reuses
// lib/ratelimit.ts's generalLimiter/getClientIp/applyRateLimit as-is, no new
// rate-limit mechanism.
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSalonOfMonth } from "@/lib/salon-of-month";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/salon-of-month
 *
 * Public reader. Returns the current salon-of-the-month, gated by the
 * `salon_of_month` feature_flags toggle (lib/salon-of-month.ts's
 * getCurrentSalonOfMonth() owns the gating + fallback logic, shared with the
 * homepage section so the two never disagree). No auth required, this is
 * public marketing content, same class as the /api/salons browse endpoint.
 *
 * `{ winner: null }` covers three cases the caller doesn't need to tell
 * apart: toggle off, no winner ever picked, or the picked salon since went
 * inactive. Never fabricates a fallback winner.
 */
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  try {
    const winner = await getCurrentSalonOfMonth();
    return NextResponse.json(
      { winner },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (err) {
    console.error("[GET /api/salon-of-month] failed:", err);
    return NextResponse.json({ error: "Failed to load salon of the month" }, { status: 500 });
  }
}
