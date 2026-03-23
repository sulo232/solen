export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  // Extract locale from referer or fallback to "de"
  const referer = request.headers.get("referer") ?? "";
  const localeMatch = referer.match(/\/(de|en|fr|it)(?:\/|$)/);
  const locale = localeMatch?.[1] ?? "de";

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/${locale}`, { status: 302 });
}
