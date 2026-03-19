export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generalLimiter, applyRateLimit, getClientIp } from "@/lib/ratelimit";

const DEFAULT_LIMIT = 12;

// GET /api/directory?category=coiffeur&quartier=Gundeldingen&search=...&page=1&limit=12
// Public route — no auth required. Excludes claimed entries.
// Uses anon client (salon_directory is public data — no service_role key needed).
export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
    if (rateLimited) return rateLimited;

    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const quartier = searchParams.get("quartier");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10));
    const offset = (page - 1) * limit;

    const admin = await createServerSupabaseClient();

    let query = admin
      .from("salon_directory")
      .select(
        "id, name, address, postal_code, quartier, phone, website, google_maps_url, google_rating, google_review_count, categories, photo_url",
        { count: "exact" }
      )
      .eq("is_claimed", false)
      .order("google_review_count", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.contains("categories", [category]);
    }

    if (quartier) {
      query = query.eq("quartier", quartier);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("[api/directory GET] query error:", error.message);
      return NextResponse.json({ items: [], total: 0, page, limit });
    }

    return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error("[api/directory GET] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
