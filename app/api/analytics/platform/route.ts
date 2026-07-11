import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// This route is public, non-personalized aggregate data (no auth/session read anywhere
// below), so it uses createAdminSupabaseClient instead of createServerSupabaseClient.
// createServerSupabaseClient calls cookies(), which forces the route dynamic and silently
// DEFEATS `export const revalidate` below; createAdminSupabaseClient reads no cookies, so
// ISR actually works. Precedent: app/api/metrics/global/route.ts (revalidate=86400, same
// pattern). Response is category head-counts only (no rows selected), so there is no
// column-allowlist concern here.
export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // We fetch category counts using basic pattern
    const [c1, c2, c3, c4] = await Promise.all([
      supabase.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["coiffeur"]),
      supabase.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["barbershop"]),
      supabase.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["nails"]),
      supabase.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["spa"])
    ]);

    for (const res of [c1, c2, c3, c4]) {
      if (res.error) console.error("[analytics/platform] category count query error:", res.error.message);
    }

    return NextResponse.json({
      categories: {
        coiffeur: c1.count ?? 0,
        barbershop: c2.count ?? 0,
        nails: c3.count ?? 0,
        spa: c4.count ?? 0
      }
    }, { status: 200 });
  } catch (err) {
    console.error("Platform Analytics API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

