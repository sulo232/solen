import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { locales, defaultLocale } from "./i18n";
import { getPublicEnv } from "@/lib/env";

// notfound-404-b (2026-09-04): root cause is app/[locale]/loading.tsx's Suspense boundary
// flushing a 200 shell before any leaf page's notFound() resolves, measured to affect EVERY
// not-found response under app/[locale]/* (a control path with no matching page.tsx at all
// also came back 200). Fixed here, in middleware, which runs BEFORE that render tree starts,
// instead of touching the shared loading.tsx boundary that every other route under
// app/[locale] also depends on for its own skeleton. Two shapes handled below:
//   1. /{locale}/{city}/{category} with an unknown city or category (mirrors the CATEGORIES
//      list and the `cities WHERE is_active` check app/[locale]/[city]/[category]/page.tsx
//      itself uses via lib/cities.ts's getActiveCityBySlug/getActiveCities).
//   2. /{locale}/bookings/{id} bare path: only the report/refund/upcharge subpages ever had a
//      page.tsx under this segment, so this exact shape is always a 404, for every id,
//      existing or not (no page was added here on purpose); no DB lookup needed.
// RESERVED_TOP_SEGMENTS is every OTHER top-level folder under app/[locale] (from `find
// app/[locale] -maxdepth 1 -type d`, 2026-09-04): when the first segment after the locale is
// one of these, the 3-segment path below can never be the [city]/[category] catch-all (Next's
// own router already resolves it to that static/dynamic route first), so the check is skipped
// and the request passes through untouched.
const RESERVED_TOP_SEGMENTS = new Set([
  "account", "agb", "auth", "barbershop", "blog", "booking", "booking-action", "bookings",
  "brand", "coiffeur", "coming-soon", "confirmation", "dashboard", "datenschutz", "dev",
  "help", "impressum", "inspo", "karriere", "kontakt", "legal", "loyalty", "nails",
  "notifications", "onboarding", "partner", "presse", "privacy", "profile", "queue",
  "recently-viewed", "referral", "reviews", "rewards", "salon", "search", "sicherheit",
  "spa", "staff-invite", "termine", "terms", "tip", "tos", "ueber-uns", "unsubscribe",
  "vouchers", "walk-in-join", "walk-in-pay", "walk-in-tip", "warum-solen",
]);

// reinvent-ok: this is NOT the SearchCategory UI list (app/[locale]/_components/homepage/
// searchCategories.ts, which holds display labels like "Spa & Wellness" and icons, no
// lowercase routing slugs) and NOT DISCOVERY_CATEGORIES (lib/discovery-categories.ts, a
// DIFFERENT taxonomy per that file's own header: discovery_items.category != services.category,
// joining them directly is a documented silent no-op). This is the routing-slug set the URL
// segment itself must match, the exact same 4 literal values as
// app/[locale]/[city]/[category]/page.tsx's own (non-exported) CATEGORIES const, duplicated
// here the same way app/sitemap.ts already carries its own separate copy rather than importing
// out of a page.tsx module.
const CITY_CATEGORY_VALUES = new Set(["coiffeur", "nails", "barbershop", "spa"]);

// reinvent-ok: notfound-404-c (2026-09-05) extends the SAME mechanism above to two more
// shapes that still answer 200 with the not-found body on the production copy, both
// measured live before this change: (3) /{locale}/salon/{slug} for a slug absent from the
// salons table (measured: /en/salon/nonexistent-slug-xyz -> 200), and (4)
// /{locale}/bookings/{id}/(report|refund|upcharge) for a malformed (non-UUID) booking id.
// Same render404() helper, same cached-lookup pattern as shape 1's activeCitySlugsCache
// for (3). Shape (4) originally also ran a per-request existence query against the
// `bookings` table on the request's anon Supabase client; removed here (2026-09-05, see
// the comment at that check below) because `bookings` carries row-level security and
// these are the guest refund/report/upcharge pages, so the anon query came back null for
// a real booking and 404'd the exact page a signed-out user is meant to reach. A
// well-formed but nonexistent booking id is therefore no longer caught in middleware;
// only the page itself, running behind the permission wall the user is actually subject
// to, can tell the difference. No new category/taxonomy data introduced here, only
// salon-slug lookups plus the pre-existing UUID-shape check for bookings.

// 5-minute in-memory TTL cache of active city slugs, mirrors lib/cities.ts's own
// getActiveCities() cache. NOT reused directly: getActiveCities() calls
// createServerSupabaseClient(), which awaits next/headers cookies() internally, a
// route-handler/Server-Component API that is not available in middleware. This queries the
// same `cities WHERE is_active` table with the client already constructed below for the auth
// check instead. Cost: one extra DB query per city/category-shaped request, at most once per
// 5 minutes per running server instance (cache hit otherwise); falls back to the last-good
// cached set (or an empty set, passing the request through unblocked) on a DB error.
let activeCitySlugsCache: { slugs: Set<string>; fetchedAt: number } | null = null;
const ACTIVE_CITY_SLUGS_TTL_MS = 5 * 60 * 1000;

async function getActiveCitySlugsForMiddleware(supabase: any): Promise<Set<string>> {
  if (activeCitySlugsCache && Date.now() - activeCitySlugsCache.fetchedAt < ACTIVE_CITY_SLUGS_TTL_MS) {
    return activeCitySlugsCache.slugs;
  }
  const { data, error } = await supabase.from("cities").select("slug").eq("is_active", true);
  if (error) {
    console.error("[middleware] active-city lookup failed:", error.message);
    return activeCitySlugsCache?.slugs ?? new Set<string>();
  }
  const slugs = new Set<string>((data ?? []).map((row: { slug: string }) => row.slug));
  activeCitySlugsCache = { slugs, fetchedAt: Date.now() };
  return slugs;
}

// notfound-404-c: same 5-minute in-memory TTL cache pattern as activeCitySlugsCache above,
// for the salon PDP's slug. app/[locale]/salon/[slug]/page.tsx resolves a slug via
// lib/salon-detail.ts's loadSalonDetailWithAccess, which ALSO gates on
// is_active/listed_on_marketplace/frozen (isSalonHidden) after the row is found, returning
// null (today rendered as a 200 not-found body via the same Suspense-boundary bug this
// file's module comment describes) for a hidden-but-existing salon. This cache
// deliberately holds EVERY row's slug regardless of that visibility gate, so a hidden
// salon's slug still passes this check and falls through to the page's own (still-buggy)
// notFound() unchanged; only a slug ABSENT from the table gets the new hard 404 here.
// Live count checked 2026-09-05 (_inventory/_db-snapshot.json): 28 rows in `salons`.
let salonSlugsCache: { slugs: Set<string>; fetchedAt: number } | null = null;

async function getSalonSlugsForMiddleware(supabase: any): Promise<Set<string>> {
  if (salonSlugsCache && Date.now() - salonSlugsCache.fetchedAt < ACTIVE_CITY_SLUGS_TTL_MS) {
    return salonSlugsCache.slugs;
  }
  const { data, error } = await supabase.from("salons").select("slug");
  if (error) {
    console.error("[middleware] salon-slug lookup failed:", error.message);
    return salonSlugsCache?.slugs ?? new Set<string>();
  }
  const slugs = new Set<string>(
    (data ?? [])
      .map((row: { slug: string | null }) => row.slug)
      .filter((slug: string | null): slug is string => Boolean(slug))
  );
  salonSlugsCache = { slugs, fetchedAt: Date.now() };
  return slugs;
}

// notfound-404-c: bookings.id is a UUID column (same format check
// lib/salon-detail.ts's loadSalonDetailWithAccess already uses for its own slug-or-uuid
// branch), so a malformed id on the report/refund/upcharge shape is answered 404 with no
// DB round trip at all.
const BOOKING_ID_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Self-fetches the SAME URL to get Next's own rendered not-found body (which today answers
 * 200 due to app/[locale]/loading.tsx's Suspense boundary), then re-wraps that body as a real
 * 404 response, so the customer still sees the real app/[locale]/not-found.tsx UI. The
 * `x-notfound-bypass` header stops the self-fetch from re-entering this same check (infinite
 * loop): it is read at the top of `middleware()` and short-circuits to a plain pass-through
 * before anything else in this file runs.
 */
async function render404(request: NextRequest): Promise<NextResponse> {
  const headers = new Headers(request.headers);
  headers.set("x-notfound-bypass", "1");
  const upstream = await fetch(request.nextUrl, { method: request.method, headers });
  const body = await upstream.arrayBuffer();
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  return new NextResponse(body, { status: 404, headers: responseHeaders });
}

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

  // notfound-404-b: short-circuit render404()'s own self-fetch before anything else in this
  // file runs, otherwise it would recurse into itself forever.
  if (request.headers.get("x-notfound-bypass") === "1") {
    return NextResponse.next({ request });
  }

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

  // notfound-404-b, shape 2: /{locale}/bookings/{id} bare path is always a 404 (see the
  // module comment above RESERVED_TOP_SEGMENTS). Pure path-shape check, no DB needed.
  if (/^\/(de|en|fr|it)\/bookings\/[^/]+$/.test(pathname)) {
    return render404(request);
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

    // notfound-404-b, shape 1: /{locale}/{city}/{category} with an unknown city or category.
    // Only fires when the first segment isn't a known static route (RESERVED_TOP_SEGMENTS),
    // i.e. only when Next's own router would otherwise fall through to the [city]/[category]
    // catch-all.
    const cityCategoryMatch = pathname.match(/^\/(de|en|fr|it)\/([^/]+)\/([^/]+)$/);
    if (cityCategoryMatch) {
      const [, , citySeg, categorySeg] = cityCategoryMatch;
      if (!RESERVED_TOP_SEGMENTS.has(citySeg)) {
        const activeCitySlugs = await getActiveCitySlugsForMiddleware(supabase);
        if (!activeCitySlugs.has(citySeg) || !CITY_CATEGORY_VALUES.has(categorySeg)) {
          return await render404(request);
        }
      }
    }

    // notfound-404-c, shape 3: /{locale}/salon/{slug} for a slug absent from the salons
    // table entirely. See the comment above getSalonSlugsForMiddleware for what "absent"
    // does and does not cover (a hidden-but-existing salon is left untouched here).
    const salonSlugMatch = pathname.match(/^\/(de|en|fr|it)\/salon\/([^/]+)$/);
    if (salonSlugMatch) {
      const [, , salonSlug] = salonSlugMatch;
      const salonSlugs = await getSalonSlugsForMiddleware(supabase);
      if (!salonSlugs.has(salonSlug)) {
        return await render404(request);
      }
    }

    // notfound-404-c, shape 4: /{locale}/bookings/{id}/(report|refund|upcharge). Only a
    // malformed (non-UUID) id is answered 404 here, with no DB call at all. A per-request
    // existence query against `bookings` used to run here too; removed 2026-09-05 because
    // `bookings` has row-level security and this middleware runs on the request's anon
    // Supabase client (no session for a guest), so the query came back null for a real
    // booking and 404'd the exact guest refund/report/upcharge page it was built for
    // (app/[locale]/bookings/[id]/refund/page.tsx). Switching to a privileged key here is
    // not the fix: it would ship the service key into the edge bundle and turn this check
    // into an unauthenticated probe for which booking ids exist. RESIDUAL, stated plainly:
    // a well-formed but nonexistent booking id still answers 200 with the not-found body
    // on this exact path shape, because the row is invisible to a guest behind the
    // permission wall, and only the page itself, once it actually queries with the
    // request's real (possibly signed-in) auth context, can tell the two cases apart.
    const bookingSubpageMatch = pathname.match(
      /^\/(de|en|fr|it)\/bookings\/([^/]+)\/(report|refund|upcharge)$/
    );
    if (bookingSubpageMatch) {
      const [, , bookingId] = bookingSubpageMatch;
      if (!BOOKING_ID_UUID_RE.test(bookingId)) {
        return await render404(request);
      }
    }

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
        "/editor", "/discovery-admin",
        "/cases", "/commission-admin", "/homepage-admin",
        "/cities-admin", "/admin-sandbox", "/help-editor",
        "/salon-of-month-admin", "/reports",
        "/ai-limits-admin", "/feature-flags-admin",
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
