// Ring 5b kill test: CDN caching headers on the anon hot endpoints
// (app/api/salons/route.ts GET, app/api/discovery/feed/route.ts GET,
// app/api/salons/[slug]/route.ts GET).
//
// Four sections, matching the ring's close conditions:
//   A. GET /api/salons: a REAL function-level invocation (no cookie) proves the
//      response ships the exact ANON_CACHE_HEADERS values, AND a source-grep proves
//      the handler has no auth/cookie read at all (so blanket caching is sound: there
//      is no personalization seam to poison).
//   B. GET /api/discovery/feed: REAL function-level invocations (no cookie) for both
//      the search branch and the general neutral-browse branch prove cacheable headers
//      ship. The PERSONALIZED variant cannot be produced by a real invocation outside a
//      live Next.js request (userId resolution routes through next/headers' cookies(),
//      which only works inside an actual Next request/render, not a standalone script,
//      see the comment in lib/salon-detail.ts and the identical one in the feed route)
//      so it is proven instead by calling the REAL exported `feedCacheHeaders()` pure
//      decision function directly with a synthetic userId, the exact function the route
//      itself calls at every return site (source-grepped below to confirm that wiring).
//   C. GET /api/salons/[slug]: a REAL function-level invocation against a real active
//      salon slug (no cookie -> anonymous, isOwnerView proven false) proves cacheable
//      headers ship for the public PDP. The owner-preview variant is proven the same
//      way as B: the REAL exported `salonDetailCacheHeaders()` function, called
//      directly with isOwnerView=true, must return the no-store headers, and a
//      source-grep proves the route actually calls this function with the real
//      isOwnerView flag from loadSalonDetailWithAccess.
//   D. Regression: scripts/api-smoke.ts (10 cases) is still green after this ring's
//      edits to app/api/salons/route.ts, app/api/discovery/feed/route.ts,
//      app/api/salons/[slug]/route.ts and lib/salon-detail.ts.
//
// Usage: npx tsx scripts/ring5b-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { NextRequest } from "next/server";

const REPO_ROOT = process.cwd();

type Row = { scenario: string; pass: boolean; details: Record<string, unknown> };
const rows: Row[] = [];
let allPass = true;

function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
  rows.push({ scenario, pass, details });
  if (!pass) allPass = false;
}

const ANON_CACHE_VALUES = {
  cdn: "public, s-maxage=60, stale-while-revalidate=300",
  browser: "public, max-age=0, must-revalidate",
};
const NO_STORE_VALUES = {
  cdn: "private, no-store",
  browser: "no-store, no-cache, must-revalidate",
};

function headersMatch(h: Headers, expected: { cdn: string; browser: string }) {
  return (
    h.get("Netlify-CDN-Cache-Control") === expected.cdn &&
    h.get("Cache-Control") === expected.browser
  );
}

async function main() {
  // ─── A. GET /api/salons (anon, no personalization seam at all) ────────────────────
  {
    const routePath = join(REPO_ROOT, "app/api/salons/route.ts");
    const src = readFileSync(routePath, "utf8");

    // Source-proof: the GET handler never reads auth/cookies (task item 1 -- "any
    // user-dependent output? owner-preview? cookies?"). We check the GET function body
    // specifically (up to the "// POST /api/salons" marker) so this doesn't false-fail
    // on the POST handler below, which legitimately calls auth.getUser() for onboarding.
    const getBody = src.slice(src.indexOf("export async function GET"), src.indexOf("// POST /api/salons"));
    const noAuthSeam = !getBody.includes("auth.getUser") && !getBody.includes("cookies()");
    check(
      "app/api/salons GET: no auth.getUser()/cookies() read anywhere in the handler (no personalization seam)",
      noAuthSeam,
      { noAuthSeam },
    );

    check(
      "app/api/salons GET: netlify.toml precedence documented with a line reference",
      /lines 31-35/.test(src),
      { found: /lines 31-35/.test(src) },
    );

    const { GET } = await import(join(REPO_ROOT, "app/api/salons/route.ts"));
    const req1 = new NextRequest("http://localhost:3000/api/salons?limit=1");
    const res1 = await GET(req1);
    const body1 = await res1.json();
    check(
      "GET /api/salons (anon, default listing): ships ANON_CACHE_HEADERS",
      res1.status === 200 && headersMatch(res1.headers, ANON_CACHE_VALUES),
      {
        status: res1.status,
        cdn: res1.headers.get("Netlify-CDN-Cache-Control"),
        browser: res1.headers.get("Cache-Control"),
        itemCount: Array.isArray(body1?.items) ? body1.items.length : "not-an-array",
      },
    );

    // A second, differently-filtered query string is a DIFFERENT cache key on Netlify
    // by default (task item 3): prove the two URLs are non-identical strings (the
    // actual per-URL cache-key behavior itself is a Netlify platform fact, not
    // something this sandbox can observe directly, so this checks the URL distinctness
    // this behavior depends on, and documents the platform fact in the comment above).
    const req2 = new NextRequest("http://localhost:3000/api/salons?limit=1&sort=newest");
    const res2 = await GET(req2);
    check(
      "GET /api/salons: a distinct query string also ships ANON_CACHE_HEADERS (still cacheable, distinct cache key by URL)",
      res2.status === 200 && headersMatch(res2.headers, ANON_CACHE_VALUES) && req1.url !== req2.url,
      { url1: req1.url, url2: req2.url, res2Status: res2.status },
    );
  }

  // ─── B. GET /api/discovery/feed ────────────────────────────────────────────────────
  {
    const routePath = join(REPO_ROOT, "app/api/discovery/feed/route.ts");
    const src = readFileSync(routePath, "utf8");

    // Source-proof: every return site in GET uses the real feedCacheHeaders() decision
    // function (not an inline/duplicated header literal that could drift from it).
    const returnCount = (src.match(/return NextResponse\.json\(/g) ?? []).length;
    const wiredCount = (src.match(/headers:\s*feedCacheHeaders\(/g) ?? []).length;
    check(
      "app/api/discovery/feed GET: every success return site is wired through feedCacheHeaders() (3 branches: search, for-you, general)",
      wiredCount === 3,
      { wiredCount, totalJsonReturns: returnCount },
    );

    const { GET, feedCacheHeaders, FEED_CACHE_HEADERS, FEED_NO_STORE_HEADERS } = await import(
      join(REPO_ROOT, "app/api/discovery/feed/route.ts")
    );

    // B1. Real anon invocation, neutral browse (no cookie -> userId resolves null).
    const req1 = new NextRequest("http://localhost:3000/api/discovery/feed?page=1&limit=3");
    const res1 = await GET(req1);
    check(
      "GET /api/discovery/feed (anon, neutral browse, no cookie): ships FEED_CACHE_HEADERS",
      res1.status === 200 && headersMatch(res1.headers, ANON_CACHE_VALUES),
      { status: res1.status, cdn: res1.headers.get("Netlify-CDN-Cache-Control"), browser: res1.headers.get("Cache-Control") },
    );

    // B2. Real anon invocation, search branch (always cacheable, proven userId-independent).
    const req2 = new NextRequest("http://localhost:3000/api/discovery/feed?search=fade&page=1&limit=3");
    const res2 = await GET(req2);
    check(
      "GET /api/discovery/feed?search=fade (anon): search branch ships FEED_CACHE_HEADERS",
      res2.status === 200 && headersMatch(res2.headers, ANON_CACHE_VALUES),
      { status: res2.status, cdn: res2.headers.get("Netlify-CDN-Cache-Control") },
    );

    // B3. Personalized variant via the REAL decision function (userId resolution can't
    // be simulated outside a live Next.js request -- see the header comment).
    const fakeUserId = "11111111-1111-4111-8111-111111111111";
    const forYouHeaders = feedCacheHeaders({ isSearchBranch: false, userId: fakeUserId });
    check(
      "feedCacheHeaders({isSearchBranch:false, userId:<real>}): returns FEED_NO_STORE_HEADERS (for-you / gender-biased branch, personalized)",
      forYouHeaders === FEED_NO_STORE_HEADERS &&
        forYouHeaders["Netlify-CDN-Cache-Control"] === NO_STORE_VALUES.cdn &&
        forYouHeaders["Cache-Control"] === NO_STORE_VALUES.browser,
      { forYouHeaders },
    );

    const searchWithUser = feedCacheHeaders({ isSearchBranch: true, userId: fakeUserId });
    check(
      "feedCacheHeaders({isSearchBranch:true, userId:<real>}): still returns FEED_CACHE_HEADERS (search branch is userId-independent, never poisoned)",
      searchWithUser === FEED_CACHE_HEADERS,
      { searchWithUser },
    );

    const anonGeneral = feedCacheHeaders({ isSearchBranch: false, userId: null });
    check(
      "feedCacheHeaders({isSearchBranch:false, userId:null}): returns FEED_CACHE_HEADERS (genuinely anon, no session)",
      anonGeneral === FEED_CACHE_HEADERS,
      { anonGeneral },
    );

    check(
      "FEED_CACHE_HEADERS and FEED_NO_STORE_HEADERS are distinct objects (no accidental aliasing)",
      FEED_CACHE_HEADERS !== FEED_NO_STORE_HEADERS &&
        FEED_CACHE_HEADERS["Cache-Control"] !== FEED_NO_STORE_HEADERS["Cache-Control"],
      { cacheable: FEED_CACHE_HEADERS, noStore: FEED_NO_STORE_HEADERS },
    );
  }

  // ─── C. GET /api/salons/[slug] (owner-preview seam) ────────────────────────────────
  {
    const routePath = join(REPO_ROOT, "app/api/salons/[slug]/route.ts");
    const src = readFileSync(routePath, "utf8");
    const libPath = join(REPO_ROOT, "lib/salon-detail.ts");
    const libSrc = readFileSync(libPath, "utf8");

    check(
      "app/api/salons/[slug] GET: wires salonDetailCacheHeaders(result.isOwnerView) (real flag, not a hardcoded value)",
      /salonDetailCacheHeaders\(result\.isOwnerView\)/.test(src),
      { found: /salonDetailCacheHeaders\(result\.isOwnerView\)/.test(src) },
    );
    check(
      "lib/salon-detail.ts: loadSalonDetailWithAccess returns isOwnerView derived from the real isOwner check",
      /isOwnerView:\s*isOwner/.test(libSrc),
      { found: /isOwnerView:\s*isOwner/.test(libSrc) },
    );

    const { createServerSupabaseClient } = await import(join(REPO_ROOT, "lib/supabase.ts"));
    const supabase = await createServerSupabaseClient();
    const { data: anySlug } = await supabase
      .from("salons")
      .select("slug")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!anySlug?.slug) {
      check("GET /api/salons/[slug] (anon, real active salon): headers", false, { reason: "no active salon found to probe" });
    } else {
      const { GET, salonDetailCacheHeaders, PDP_CACHE_HEADERS, PDP_NO_STORE_HEADERS } = await import(
        join(REPO_ROOT, "app/api/salons/[slug]/route.ts")
      );
      const req = new NextRequest(`http://localhost:3000/api/salons/${anySlug.slug}`);
      const res = await GET(req, { params: Promise.resolve({ slug: anySlug.slug }) });
      check(
        `GET /api/salons/${anySlug.slug} (anon, real active salon, no cookie): ships PDP_CACHE_HEADERS`,
        res.status === 200 && headersMatch(res.headers, ANON_CACHE_VALUES),
        { status: res.status, cdn: res.headers.get("Netlify-CDN-Cache-Control"), browser: res.headers.get("Cache-Control"), slug: anySlug.slug },
      );

      // Owner-preview variant via the REAL decision function (owner auth can't be
      // simulated outside a live Next.js request -- next/headers cookies() only works
      // inside an actual request/render).
      const ownerHeaders = salonDetailCacheHeaders(true);
      check(
        "salonDetailCacheHeaders(true) [owner-preview]: returns PDP_NO_STORE_HEADERS",
        ownerHeaders === PDP_NO_STORE_HEADERS &&
          ownerHeaders["Netlify-CDN-Cache-Control"] === NO_STORE_VALUES.cdn &&
          ownerHeaders["Cache-Control"] === NO_STORE_VALUES.browser,
        { ownerHeaders },
      );
      const publicHeaders = salonDetailCacheHeaders(false);
      check(
        "salonDetailCacheHeaders(false) [public visitor]: returns PDP_CACHE_HEADERS",
        publicHeaders === PDP_CACHE_HEADERS,
        { publicHeaders },
      );
    }
  }

  // ─── D. Regression: scripts/api-smoke.ts still 10/10 after this ring's edits ──────
  {
    const result = spawnSync("npx", ["tsx", "scripts/api-smoke.ts"], { cwd: REPO_ROOT, encoding: "utf8" });
    const stdout = result.stdout ?? "";
    const summaryLine = /(\d+)\/(\d+) smoke cases passed/.exec(stdout);
    const passed = summaryLine ? Number(summaryLine[1]) : -1;
    const total = summaryLine ? Number(summaryLine[2]) : -1;
    check(
      "scripts/api-smoke.ts: exits 0, all smoke cases pass",
      result.status === 0 && passed === total && total > 0,
      { status: result.status, passed, total, stderr: result.status === 0 ? undefined : result.stderr, stdout: result.status === 0 ? undefined : stdout },
    );
  }

  console.log("Ring 5b kill test: CDN caching headers on /api/salons, /api/discovery/feed, /api/salons/[slug]\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring5b-kill-test] threw:", err);
  process.exit(1);
});
