export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("salons")
      .select("quartier")
      .eq("is_active", true);

    if (error) {
      console.error("[api/salons/quartier-counts] error:", error.message);
      return NextResponse.json({ counts: {} });
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.quartier) {
        counts[row.quartier] = (counts[row.quartier] ?? 0) + 1;
      }
    }

    return NextResponse.json(
      { counts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (err) {
    console.error("[api/salons/quartier-counts] error:", err);
    return NextResponse.json({ counts: {} });
  }
}
