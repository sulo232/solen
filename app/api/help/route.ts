export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/help?category=customers&locale=de&q=search — Public help articles
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const locale = searchParams.get("locale") || "de";
  const q = searchParams.get("q");

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("help_articles")
    .select("id, slug, title, category, locale, sort_order, created_at")
    .eq("published", true)
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  if (category) query = query.eq("category", category);
  if (q && q.length <= 100) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ articles: data ?? [] });
}
