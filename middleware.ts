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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Verify user JWT server-side (secure — unlike getSession which only reads without verification)
  const { data: { user } } = await supabase.auth.getUser();

  // ── Auth guards for dashboard routes ──
  const currentLocale = locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  if (currentLocale && pathname.startsWith(`/${currentLocale}/dashboard`)) {
    // No session → redirect to login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${currentLocale}/auth/login`;
      url.searchParams.set("redirect", pathname);
      const redirect = NextResponse.redirect(url);
      // Carry over any auth cookies that were refreshed
      response.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value);
      });
      return redirect;
    }

    // Fetch user role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Must be salon_owner or admin to access dashboard
    if (role !== "salon_owner" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${currentLocale}`;
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value);
      });
      return redirect;
    }

    // Admin-only routes
    const adminOnlyPaths = [
      "/all-salons", "/all-users", "/platform-analytics",
      "/badge-manager", "/content-editor", "/segments",
      "/revenue", "/review-moderation", "/approvals",
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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
