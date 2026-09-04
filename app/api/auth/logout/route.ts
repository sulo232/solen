export const dynamic = "force-dynamic";
// runtime = "edge" removed 2026-09-05: this route rate-limits on getClientIp, which trusts
// the Netlify-added x-nf-client-connection-ip header, and Netlify's docs say edge functions
// do not receive Netlify-added headers (docs.netlify.com/build/edge-functions/api/). On edge
// that header is absent and the limiter fell back to the spoofable x-forwarded-for. Nothing
// in this route calls an edge-only API (no request.geo, no EdgeRuntime global), so it runs
// fine on the Node runtime, which does get the trusted header.
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
