import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { locales, defaultLocale } from "./i18n";
import { getPublicEnv } from "@/lib/env";

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

  // A1-html-lang (2026-07-26): stamp the pathname onto a request header so the root
  // layout (app/layout.tsx, which sits ABOVE the [locale] segment and has no route
  // params) can derive the active locale for <html lang>. Mutated in place on the
  // shared `request.headers` instance so every NextResponse.next({ request }) call
  // below (CORS pass-through, the Supabase session refresh, the final pass-through)
  // carries it without touching each call site. Read via headers() in app/layout.tsx.
  request.headers.set("x-pathname", pathname);

  // Skip static files, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // DEV-ONLY, 2026-08-17 (owner: "safari dead"). /terminal is the merchant terminal preview and it
  // deliberately lives OUTSIDE the [locale] segment, so it inherits only the root layout instead of
  // the whole site (header, breadcrumb, footer, fixed bottom nav, cookie provider, PostHog, the
  // page-transition wrapper). All of that renders underneath a full-screen overlay nobody can see it
  // through, and on a phone in dev it is what kills the tab. Without this bypass the locale
  // redirect below sends /terminal to /en/terminal, which does not exist, so the page 404s.
  // Guarded on NODE_ENV so it cannot affect production, where the route itself calls notFound().
  // The guard is `!== "production"` on purpose, to be the exact complement of the page's own
  // `=== "production"` notFound(). `=== "development"` looked equivalent and is not: under a test
  // runner or any custom NODE_ENV the bypass would not fire, /terminal would fall through to the
  // locale redirect below, and /{locale}/terminal does not exist, so the page 404s even though its
  // own guard would have rendered it.
  // `{ request }` matches every other pass-through in this file: NextResponse.next() only forwards
  // the mutated request headers when it is passed, so a bare next() silently drops the x-pathname
  // set above. Checked rather than assumed, and it does NOT change <html lang> here: app/layout.tsx
  // parses a locale PREFIX out of x-pathname, and "/terminal" has none, so it falls back to the
  // default either way. The dev-only terminal therefore renders English under lang="de". Left as is
  // because the route is blocked in production and the alternative is bending the shared root
  // layout around one dev screen.
  if (process.env.NODE_ENV !== "production" && pathname === "/terminal") {
    return NextResponse.next({ request });
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

  // Ghost page redirects → Coming Soon
  const COMING_SOON_ROUTES = ["/vouchers", "/loyalty", "/referral"];
  const pathWithoutLocale = pathname.replace(/^\/(de|en|fr|it)/, "");
  if (COMING_SOON_ROUTES.includes(pathWithoutLocale)) {
    const locale = pathname.match(/^\/(de|en|fr|it)/)?.[1] ?? "de";
    return NextResponse.redirect(new URL(`/${locale}/coming-soon?feature=${pathWithoutLocale.slice(1)}`, request.url));
  }

  // /hilfe → /help redirect
  if (pathWithoutLocale === "/hilfe") {
    const locale = pathname.match(/^\/(de|en|fr|it)/)?.[1] ?? "de";
    return NextResponse.redirect(new URL(`/${locale}/help`, request.url));
  }

  // Step 2: Supabase session refresh on every request
  let response = NextResponse.next({ request });

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    const publicEnv = getPublicEnv();
    supabaseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
    supabaseKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } catch (err) {
    console.error("[middleware] MISSING ENV VARS:", err);
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
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value }: any) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }: any) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // SECURITY: Use getUser() for proper JWT verification, getSession() is not safe for auth decisions.
    // Defensive 4s timeout via Promise.race, guards against any edge runtime network hang.
    // A REJECTED getUser() (thrown, not just slow) must resolve to the same "no user" shape
    // as the timeout branch, otherwise the rejection falls through to the outer catch below
    // and previously fell back to the pass-through response (an auth bypass on a transient error).
    const userPromise = supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const timeoutPromise = new Promise<{ data: { user: null }, error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null }, error: new Error("Auth timeout") }), 4000)
    );
    const { data: { user } } = await Promise.race([userPromise, timeoutPromise]);

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
        .select("role, staff_salon_id")
        .eq("id", user.id)
        .single();

      let role = profile?.role;
      // A staff member accepted an invite from a salon. That flow sets staff_salon_id and never
      // touches role (app/api/staff/accept-invite/route.ts:114), and 'staff' is not even a legal
      // role value in the database, so every invited stylist arrived here as a 'customer' and was
      // bounced to the homepage. The dashboard itself was fully built for them: it reads
      // staff_salon_id, sets isStaff, and shows STAFF_NAV, a restricted four-item menu of their
      // own calendar, breaks, portfolio and profile (DashboardLayout.tsx:106 and :246). Only this
      // gate never learned they exist, so the whole invite flow was a dead end. Nobody has hit it
      // yet, checked live 2026-08-14: zero invites have ever been sent and zero profiles carry a
      // staff_salon_id, so this is fixed before the first stylist is invited rather than after.
      // Admin-only paths stay closed to them: that check below tests role === "admin" separately.
      const isInvitedStaff = Boolean(profile?.staff_salon_id);

      // If role is not salon_owner/admin, check if user owns a salon anyway
      // (role update may have failed during onboarding)
      if (role !== "salon_owner" && role !== "admin" && !isInvitedStaff) {
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

      if (role !== "salon_owner" && role !== "admin" && !isInvitedStaff) {
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
        "/cases", "/commission-admin", "/homepage-admin",
        "/cities-admin", "/admin-sandbox", "/help-editor",
        "/salon-of-month-admin", "/reports",
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

    // Fail CLOSED for dashboard routes: an auth/role check that throws must not let the
    // request through unauthenticated. This previously fell back to the plain pass-through
    // `response`, so any exception inside the try block (DB blip, cookie parse error, etc.)
    // bypassed the entire auth/role gate for /{locale}/dashboard/**. Non-dashboard paths are
    // unaffected (still fall through to the pass-through response below).
    const currentLocale = locales.find(
      (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
    );
    if (currentLocale && pathname.startsWith(`/${currentLocale}/dashboard`)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${currentLocale}/auth/login`;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
