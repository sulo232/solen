import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/help/[slug]?locale=de — Single help article
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const locale = new URL(req.url).searchParams.get("locale") || "de";

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("help_articles")
    .select("*")
    .eq("slug", params.slug)
    .eq("locale", locale)
    .eq("published", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ article: data });
}
