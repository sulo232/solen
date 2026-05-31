import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/discovery/chip-terms — data-driven quick-chip labels for the Discover filter row (V3-D407, #22).
 * Returns the top style tags by frequency (minus non-style noise), so the chips always lead to populated
 * results and self-update as content grows. Replaces the hardcoded chip list (Skin Fade / Buzz / Bob) that
 * matched zero items. Fails soft → empty list (the row simply shows just the Textur control).
 */
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("discovery_chip_terms", { p_limit: 10 });
    if (error) {
      console.error("[Discover] chip-terms RPC failed:", error);
      return NextResponse.json({ terms: [] });
    }
    const terms = (data ?? [])
      .map((r: { term: string }) => r.term)
      .filter((t: unknown): t is string => typeof t === "string" && t.length > 0);
    return NextResponse.json({ terms });
  } catch (e) {
    console.error("[Discover] chip-terms endpoint error:", e);
    return NextResponse.json({ terms: [] });
  }
}
