export const dynamic = "force-dynamic";
// runtime = "edge" removed 2026-09-05: this route rate-limits on getClientIp, which trusts
// the Netlify-added x-nf-client-connection-ip header, and Netlify's docs say edge functions
// do not receive Netlify-added headers (docs.netlify.com/build/edge-functions/api/). On edge
// that header is absent and the limiter fell back to the spoofable x-forwarded-for. Nothing
// in this route calls an edge-only API (no request.geo, no EdgeRuntime global), so it runs
// fine on the Node runtime, which does get the trusted header.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { getPublicEnv } from "@/lib/env";
import { isSafeRelativePath } from "@/lib/url-safety";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") ?? searchParams.get("next") ?? "/de";
  // SECURITY: shared guard (lib/url-safety.ts). Only allow internal relative paths.
  const redirect = isSafeRelativePath(rawRedirect) ? rawRedirect : "/de";

  if (code) {
    // Build a Supabase client that sets cookies on the REDIRECT response
    const redirectUrl = new URL(redirect, origin);
    const response = NextResponse.redirect(redirectUrl);

    const publicEnv = getPublicEnv();
    const supabase = createServerClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
            );
          },
        },
      }
    );

    const { data: exch, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // V3-D348: route freshly-authenticated customers into the personalization
      // flow. Salon onboarding redirects are left alone. We only rewrite the
      // Location header — `response` already carries the auth cookies that
      // exchangeCodeForSession set, so the session survives the redirect.
      const isSalonOnboarding = redirect.includes("/onboarding/salon");
      const userId = exch?.user?.id ?? exch?.session?.user?.id ?? null;
      if (!isSalonOnboarding && userId) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", userId)
          .maybeSingle();
        if (!prof?.onboarding_completed) {
          const locale = redirect.match(/^\/(de|en|fr|it)(?:\/|$)/)?.[1] ?? "de";
          const onbUrl = new URL(`/${locale}/onboarding`, origin);
          if (redirect !== `/${locale}` && redirect !== "/de") {
            onbUrl.searchParams.set("redirect", redirect);
          }
          response.headers.set("location", onbUrl.toString());
        }
      }
      return response; // Redirect WITH cookies set (Location may point to /onboarding)
    }
  }

  return NextResponse.redirect(`${origin}/de/auth/login?error=auth_callback_failed`);
}
