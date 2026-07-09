import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
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

