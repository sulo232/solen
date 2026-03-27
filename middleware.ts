import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { locales, defaultLocale } from "./i18n";

function getLocaleFromRequest(request: NextRequest): string {
  // 1. Check URL path
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (pathnameLocale) return pathnameLocale;

  // 2. Check cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale as typeof locales[number])) {
    return cookieLocale;
  }

  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get("Accept-Language");
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().slice(0, 2).toLowerCase())
      .find((lang) => locales.includes(lang as typeof locales[number]));
    if (preferred) return preferred;
  }

  // 4. Fallback to default
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // CORS headers for API routes
  if (pathname.startsWith("/api")) {
    const origin = request.headers.get("origin") ?? "";
    const allowedOrigins = [
      "https://solen.ch",
      "https://www.solen.ch",
      ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
    ];

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      if (allowedOrigins.includes(origin)) {
        preflight.headers.set("Access-Control-Allow-Origin", origin);
        preflight.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
        preflight.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        preflight.headers.set("Access-Control-Max-Age", "86400");
      }
      return preflight;
    }

    const response = NextResponse.next();
    if (allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    return response;
  }

  // Step 1: Locale redirect — if no locale prefix, redirect with detected locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!hasLocale) {
    const locale = getLocaleFromRequest(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Step 2: Supabase session refresh on every request
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safety check — if env vars are missing, skip auth but don't crash
  if (!supabaseUrl || !supabaseKey) {
    console.error("[middleware] MISSING ENV VARS:", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session from cookies (no network call — getUser() times out on Vercel Edge)
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    // ── Auth guards for dashboard routes ──
    const currentLocale = locales.find(
      (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
    );

    if (currentLocale && pathname.startsWith(`/${currentLocale}/dashboard`)) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = `/${currentLocale}/auth/login`;
        url.searchParams.set("redirect", pathname);
        const redirect = NextResponse.redirect(url);
        response.cookies.getAll().forEach((cookie) => {
          redirect.cookies.set(cookie.name, cookie.value);
        });
        return redirect;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      let role = profile?.role;

      // If role is not salon_owner/admin, check if user owns a salon anyway
      // (role update may have failed during onboarding)
      if (role !== "salon_owner" && role !== "admin") {
        const { data: ownedSalon } = await supabase
          .from("salons")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1)
          .single();

        if (ownedSalon) {
          // User owns a salon — auto-fix the stale role
          role = "salon_owner";
          await supabase
            .from("profiles")
            .update({ role: "salon_owner" })
            .eq("id", user.id);
        }
      }

      if (role !== "salon_owner" && role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = `/${currentLocale}`;
        const redirect = NextResponse.redirect(url);
        response.cookies.getAll().forEach((cookie) => {
          redirect.cookies.set(cookie.name, cookie.value);
        });
        return redirect;
      }

      const adminOnlyPaths = [
        "/all-salons", "/all-users", "/platform-analytics",
        "/badge-manager", "/content-editor", "/segments",
        "/revenue", "/review-moderation", "/approvals",
        "/editor", "/discovery-admin", "/nail-admin",
      ];
      const dashboardSubpath = pathname.slice(`/${currentLocale}/dashboard`.length);
      const isAdminRoute = adminOnlyPaths.some((p) => dashboardSubpath.startsWith(p));

      if (isAdminRoute && role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = `/${currentLocale}`;
        const redirect = NextResponse.redirect(url);
        response.cookies.getAll().forEach((cookie) => {
          redirect.cookies.set(cookie.name, cookie.value);
        });
        return redirect;
      }
    }
  } catch (err) {
    console.error("[middleware] Auth error:", err);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
