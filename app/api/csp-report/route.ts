// app/api/csp-report/route.ts
//
// exists-check: net-new vs lib/supabase.ts, lib/ratelimit.ts, lib/error-report.ts,
// lib/posthog-server.ts because none of those receive CSP violation reports, this is the first
// endpoint that does (npm run exists csp-report / csp_violation_reports both returned zero
// matches this session, and a repo-wide grep for report-uri|report-to|Reporting-Endpoints|
// csp-report found nothing). It DOES extend lib/ratelimit.ts (generalLimiter, getClientIp) and
// lib/supabase.ts (createAdminSupabaseClient) rather than re-declaring either.
//
// Receives CSP violation reports from the Report-Only header shipped in netlify.toml (both
// report-uri and report-to point here). Exists to make the documented rollout plan runnable:
// "watch real reports for a normal traffic week, fix what they name, THEN enforce" needs
// somewhere to actually receive those reports, before this endpoint there was nowhere.
//
// Deliberately SILENT to the caller: it always returns 204, including on a malformed body or a
// DB failure. A browser sending a report does not read or care about the response, and echoing
// anything back would only leak internals to whatever triggered the violation.
//
// Aggregates by ORIGIN (see lib/csp-report.ts toBlockedOrigin), not by full URL, because an
// origin is the thing you would actually add to the CSP allowlist, and collapsing to origin is
// also what keeps csp_violation_reports bounded.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { normalizeCspReports, toBlockedOrigin, isIgnorableSource } from "@/lib/csp-report";

// Reports over this size are dropped unparsed. A real CSP report batch is a handful of small
// JSON objects, anything this large is either abuse or noise, not worth spending a JSON.parse on.
const MAX_BODY_LENGTH = 50_000;

// generalLimiter (fails OPEN on a Redis outage), not an abuse-prone limiter: dropping a report
// is harmless (the whole endpoint is best-effort and silent already), and the real bound on
// damage is the 500-row cap inside record_csp_violation, not the rate limiter.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
    if (rateLimited) return rateLimited;

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_LENGTH) {
      return new NextResponse(null, { status: 204 });
    }

    const contentType = req.headers.get("content-type");
    const reports = normalizeCspReports(contentType, rawBody).filter((report) => !isIgnorableSource(report.blockedUri));

    // De-dupe within the batch by (directive, origin) so one payload writes at most a few rows
    // instead of one RPC per individual report. JSON.stringify of the pair, not a joined string:
    // a plain "${directive} ${origin}" join collides when either field itself contains the
    // separator (e.g. directive "A B" + origin "C" would collide with directive "A" + origin
    // "B C"), silently dropping one of the two distinct keys.
    const byKey = new Map<string, { directive: string; origin: string; sample: string; disposition: string | null }>();
    for (const report of reports) {
      const origin = toBlockedOrigin(report.blockedUri);
      const key = JSON.stringify([report.directive, origin]);
      if (byKey.has(key)) continue;
      const sample = report.blockedUri.split(/[?#]/)[0].slice(0, 200);
      byKey.set(key, { directive: report.directive, origin, sample, disposition: report.disposition });
    }

    if (byKey.size > 0) {
      const admin = createAdminSupabaseClient();
      for (const { directive, origin, sample, disposition } of byKey.values()) {
        // `as any` on the function name only: lib/database.types.ts is generated from the live
        // DB (supabase gen types) and this migration has not been applied yet (out of scope for
        // this change, the reviewer/owner applies it), so record_csp_violation is not in the
        // generated RPC name union. Narrow, intentional, removable in one line once the
        // migration is applied and types are regenerated. Same pattern as
        // app/api/discovery/feed/route.ts's discovery_feed_v2 call.
        const { error } = await admin.rpc("record_csp_violation" as any, {
          p_directive: directive,
          p_origin: origin,
          p_sample: sample,
          p_disposition: disposition,
        });
        if (error) {
          console.error("[csp-report] record_csp_violation failed:", error);
        }
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[csp-report] unexpected error handling report:", err);
    return new NextResponse(null, { status: 204 });
  }
}
