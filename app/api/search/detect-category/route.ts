export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Gemini SDK crashes on Edge

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { detectCategory } from "@/lib/search/category-detect";

export async function GET(req: NextRequest) {
  // Rate limit (public route, IP-based)
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 200) {
    return NextResponse.json({ category: null });
  }

  const category = await detectCategory(q);
  return NextResponse.json({ category });
}
