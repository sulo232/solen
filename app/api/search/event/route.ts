export const dynamic = "force-dynamic";
// nodejs (NOT edge, unlike the sibling search routes): this route mints a
// server-issued opaque session token with node:crypto (`randomBytes`) and uses
// the service-role admin client. Node's crypto module is unavailable on Edge.
// Same justification shape as app/api/search/smart/route.ts ("...crashes on Edge").
export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * Search-event logging endpoint (the learning-loop sink).
 *
 * PUBLIC-FACING and ABUSE-RESISTANT BY DESIGN. The reason this is a Next route
 * and not a public Supabase RPC: a public RPC would let anyone POST fabricated
 * impressions/clicks straight into the ranking signal. Every defence below
 * (IP rate-limit, server-issued session, click-membership check, owner
 * exclusion, server-verified `booked`) only exists because we control the
 * insert here. Inserts use the SERVICE-ROLE client; never expose this table to
 * anon writes.
 *
 * Contract (POST JSON), two kinds:
 *   (a) impression: { kind:'impression', query, locale, city_id?, results_count }
 *   (b) click:      { kind:'click', query, locale, city_id?,
 *                     clicked_type:'service'|'salon'|'stylist', clicked_id, clicked_position }
 *   Optional on either: { consent_given?: boolean } — see CONSENT below.
 *
 * Responses:
 *   204 — accepted OR silently dropped (anti-manipulation drops look identical
 *         to accepts on purpose, so a prober can't tell which events "count").
 *   400 — malformed body.
 *   429 — emitted by applyRateLimit (the limiter owns this status + headers).
 *
 * `booked` is NOT a request kind in v1. It defaults to false in the DB and is
 * never trusted from the client. A real booked-signal must be written by the
 * booking pipeline against a verified `bookings` row (there is no session_id on
 * `bookings` to join on yet), so we defer it rather than accept a spoofable flag.
 */

// ── Limits / caps ───────────────────────────────────────────────────────────
const MAX_QUERY_LEN = 200; // matches search_events.query intent; hard cap on insert
const MAX_LOCALE_LEN = 12; // e.g. "de" / "de-CH"; generous but bounded
const VALID_LOCALES = new Set(["de", "en", "fr", "it"]); // app i18n set
const CLICKED_TYPES = new Set(["service", "salon", "stylist"]);

// ── Session cookie ──────────────────────────────────────────────────────────
// Server-issued + rotating. We NEVER trust a client-supplied session id — the
// only accepted source is this httpOnly cookie, and we re-Set-Cookie it (sliding
// rotation of the max-age window) on every accepted event so the identifier is
// always server-controlled and self-expiring.
const SESSION_COOKIE = "solen_se_sid";
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 days sliding window
const SESSION_BYTES = 32; // 256-bit opaque token (mirrors lib/bookings/guest-access.ts)

/**
 * Mint a fresh opaque session token. 256-bit random via node:crypto.
 *
 * NOTE on HMAC: the env schema (lib/env.ts) has no analytics/session secret —
 * only BOOKING_HMAC_SECRET / LOYALTY_HMAC_SECRET, which are domain-specific and
 * optional. An opaque random token needs no signature: it carries no claims, is
 * never parsed, and is only ever compared by equality to what the server stored
 * implicitly (the cookie round-trips its own value). So a random token is the
 * correct primitive here, not a signed one. If a dedicated rotating-secret is
 * introduced later, wrap this value in an HMAC tag for tamper-evidence.
 */
function mintSessionId(): string {
  return crypto.randomBytes(SESSION_BYTES).toString("base64url");
}

/** Accept a cookie value only if it looks like one we minted (defensive). */
function sanitizeSessionId(raw: string | undefined): string | null {
  if (!raw) return null;
  // base64url, 32 bytes -> 43 chars (no padding). Reject anything else so a
  // client cannot smuggle an arbitrary chosen identifier through the cookie.
  if (/^[A-Za-z0-9_-]{43}$/.test(raw)) return raw;
  return null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

/** 204 — used for both genuine accepts and silent anti-abuse drops. */
function noContent(setSessionId?: string): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  if (setSessionId) {
    res.cookies.set(SESSION_COOKIE, setSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_S,
    });
  }
  return res;
}

function badRequest(): NextResponse {
  return new NextResponse(null, { status: 400 });
}

export async function POST(req: NextRequest) {
  // ── 1. Rate-limit by IP ────────────────────────────────────────────────────
  // ⚠️ ABUSE CAVEAT: applyRateLimit FAIL-OPENS when Upstash env is missing
  // (lib/ratelimit.ts returns null with no limiter configured). Until Upstash is
  // wired in every environment, search popularity is RIGGABLE — a script can post
  // unlimited impressions/clicks and there is no per-IP ceiling. The downstream
  // ranking must treat raw counts as soft signal, not ground truth, while this
  // gap exists. Closing it = set UPSTASH_REDIS_REST_URL/TOKEN (and ideally a
  // dedicated, tighter limiter than generalLimiter for this write surface).
  const rateLimited = await applyRateLimit(generalLimiter, {
    ip: getClientIp(req),
  });
  if (rateLimited) return rateLimited;

  // ── 2. Parse + validate body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  if (typeof body !== "object" || body === null) return badRequest();

  const b = body as Record<string, unknown>;
  const kind = b.kind;
  if (kind !== "impression" && kind !== "click") return badRequest();

  // query (raw) — required, capped
  if (typeof b.query !== "string") return badRequest();
  const query = b.query.slice(0, MAX_QUERY_LEN);
  const queryNorm = normalizeQuery(query);
  if (queryNorm.length === 0) return badRequest();

  // locale — required, bounded; fall back to "de" if an unknown value sneaks in
  if (typeof b.locale !== "string" || b.locale.length > MAX_LOCALE_LEN) {
    return badRequest();
  }
  const locale = VALID_LOCALES.has(b.locale) ? b.locale : "de";

  // city_id — optional uuid
  let cityId: string | null = null;
  if (b.city_id !== undefined && b.city_id !== null) {
    if (!isUuid(b.city_id)) return badRequest();
    cityId = b.city_id;
  }

  // kind-specific fields
  let resultsCount = 0;
  let clickedType: string | null = null;
  let clickedId: string | null = null;
  let clickedPosition: number | null = null;

  if (kind === "impression") {
    if (
      typeof b.results_count !== "number" ||
      !Number.isInteger(b.results_count) ||
      b.results_count < 0
    ) {
      return badRequest();
    }
    resultsCount = Math.min(b.results_count, 1_000_000); // cap absurd values
  } else {
    // click
    if (typeof b.clicked_type !== "string" || !CLICKED_TYPES.has(b.clicked_type)) {
      return badRequest();
    }
    if (!isUuid(b.clicked_id)) return badRequest();
    if (
      typeof b.clicked_position !== "number" ||
      !Number.isInteger(b.clicked_position) ||
      b.clicked_position < 0
    ) {
      return badRequest();
    }
    clickedType = b.clicked_type;
    clickedId = b.clicked_id as string;
    clickedPosition = Math.min(b.clicked_position, 100_000);
  }

  // ── 3. Consent gate ────────────────────────────────────────────────────────
  // CONSENT MECHANISM (investigated): the app records analytics consent CLIENT-
  // SIDE ONLY, in localStorage under "solen-cookie-consent"
  // (app/[locale]/_components/primitives/CookieConsent.tsx). It is deliberately
  // NOT mirrored to a cookie ("cookies-for-cookie-consent = chicken-and-egg"),
  // so a server route CANNOT read it from the request. The consent signal must
  // therefore be passed by the caller in the body as `consent_given`. We treat
  // it as opt-IN: only `consent_given === true` enables behavioural (session/
  // user-linked) logging. Anything else → fully anonymous row.
  //
  // When consent is NOT given we still log a minimal, fully-anonymous row
  // (query_norm + results_count + consent_given=false, NO session_id, NO
  // user_id) so aggregate query-demand signal survives without tracking anyone.
  const consentGiven = b.consent_given === true;

  // ── 4. Identity: server session + (optional) authed user ───────────────────
  // Auth user is read from the Supabase session cookie via the SSR client. The
  // ADMIN (service-role) client is used only for the privileged INSERT.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Session id: only ever from our httpOnly cookie; minted if absent/forged.
  const existingSid = sanitizeSessionId(req.cookies.get(SESSION_COOKIE)?.value);
  const sessionId = existingSid ?? mintSessionId();
  // Rotate the cookie window on every accepted request (and set it the first
  // time). We always pass this to noContent() so the identifier stays server-
  // owned + self-expiring.
  const rotateSid = sessionId;

  // ── 5. Click integrity (only relevant to click events) ─────────────────────
  if (kind === "click") {
    // 5a. Validate clicked_id is actually in the result set the SERVER would
    //     return for {query, city_id}. Stops fabricated clicks on listings that
    //     never appeared for this query. We call the SAME RPCs the live search
    //     uses (search_suggest for services + salons; search_salons_ranked as
    //     the wider salon oracle — it returns up to 30 vs suggest's 3).
    const member = await isClickMember(
      supabase,
      query,
      cityId,
      clickedType as string,
      clickedId as string,
    );
    if (!member) {
      // Silent drop — looks identical to an accept.
      return noContent(rotateSid);
    }

    // 5b. Exclude owners clicking their own listings (self-boosting). Only the
    //     salon case is ownable; resolve the salon for service/stylist clicks
    //     and compare against salons.owner_id.
    if (userId) {
      const owns = await ownsClickedListing(
        supabase,
        clickedType as string,
        clickedId as string,
        userId,
      );
      if (owns) return noContent(rotateSid);
    }
  }

  // ── 6. Build the row — EXACT schema match (see header of this file) ─────────
  // Columns omitted (DB defaults): id (gen_random_uuid), created_at (now()),
  // booked (false). When consent is absent we null out the identifiers.
  const row = {
    session_id: consentGiven ? sessionId : null,
    user_id: consentGiven ? userId : null,
    query,
    query_norm: queryNorm,
    locale,
    city_id: cityId,
    results_count: resultsCount,
    clicked_type: clickedType,
    clicked_id: clickedId,
    clicked_position: clickedPosition,
    consent_given: consentGiven,
  };

  // ── 7. Insert (service-role, server-side only) ─────────────────────────────
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("search_events").insert(row);
  if (error) {
    // Fire-and-forget telemetry: never surface a 5xx to the caller (mirrors
    // app/api/analytics/track-view/route.ts). The table may not exist yet in
    // an environment that hasn't run the migration — log + 204 so the client's
    // beacon is a silent no-op rather than an error toast on every search.
    console.error("[search/event] insert failed:", error.message);
    return noContent(rotateSid);
  }

  return noContent(rotateSid);
}

/**
 * Confirm `clickedId` is a member of the result set for {query, cityId}.
 *
 * - service: must appear in search_suggest(...).services[].id
 * - salon:   must appear in search_salons_ranked(...) salon_ids (broad) OR
 *            search_suggest(...).salons[].id (the visible suggest set)
 * - stylist: NEITHER RPC returns stylist ids (search_salons_ranked maps a
 *   matching staff member to its SALON only). So we cannot strictly prove a
 *   stylist clicked_id was in the result set. We degrade to: the staff row
 *   exists, is active, and its salon is in the ranked result set for this query.
 *   This is weaker than the service/salon checks — see the ABUSE CAVEAT in the
 *   return message. Returns false on any RPC error (fail-closed for clicks).
 */
async function isClickMember(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  query: string,
  cityId: string | null,
  clickedType: string,
  clickedId: string,
): Promise<boolean> {
  try {
    if (clickedType === "service") {
      const { data, error } = await supabase.rpc("search_suggest", {
        p_q: query,
        p_city_id: cityId,
        p_category: null,
      });
      if (error) {
        console.error("[search/event] search_suggest (service) failed:", error.message);
        return false;
      }
      const services = (data as { services?: { id?: string }[] } | null)?.services ?? [];
      return services.some((s) => s?.id === clickedId);
    }

    if (clickedType === "salon") {
      // Broad oracle first: ranked returns up to 30 salon ids.
      const { data: ranked, error: rErr } = await supabase.rpc(
        "search_salons_ranked",
        { p_q: query, p_limit: 30 },
      );
      if (rErr) {
        console.error("[search/event] search_salons_ranked failed:", rErr.message);
        return false;
      }
      const rankedIds = new Set(
        ((ranked ?? []) as { salon_id?: string }[]).map((r) => r.salon_id),
      );
      if (rankedIds.has(clickedId)) return true;

      // Fallback to the visible suggest set (city-scoped) in case ranking and
      // suggest diverge at the margins.
      const { data: sug, error: sErr } = await supabase.rpc("search_suggest", {
        p_q: query,
        p_city_id: cityId,
        p_category: null,
      });
      if (sErr) {
        console.error("[search/event] search_suggest (salon) failed:", sErr.message);
        return false;
      }
      const salons = (sug as { salons?: { id?: string }[] } | null)?.salons ?? [];
      return salons.some((s) => s?.id === clickedId);
    }

    // stylist — weakest path (see doc comment above).
    const { data: ranked, error: rErr } = await supabase.rpc(
      "search_salons_ranked",
      { p_q: query, p_limit: 30 },
    );
    if (rErr) {
      console.error("[search/event] search_salons_ranked (stylist) failed:", rErr.message);
      return false;
    }
    const rankedSalonIds = new Set(
      ((ranked ?? []) as { salon_id?: string }[]).map((r) => r.salon_id),
    );
    if (rankedSalonIds.size === 0) return false;

    const { data: staff, error: stErr } = await supabase
      .from("staff_members")
      .select("id, salon_id, is_active")
      .eq("id", clickedId)
      .maybeSingle<{ id: string; salon_id: string; is_active: boolean | null }>();
    if (stErr) {
      console.error("[search/event] staff lookup failed:", stErr.message);
      return false;
    }
    if (!staff || staff.is_active === false) return false;
    return rankedSalonIds.has(staff.salon_id);
  } catch (err) {
    console.error("[search/event] click-membership check threw:", err);
    return false;
  }
}

/**
 * True if `userId` owns the salon behind `clickedId` (so we drop self-clicks).
 * salons.owner_id is the ownership column. For service/stylist clicks we resolve
 * the parent salon first. Returns false on any error (fail-open for ownership is
 * acceptable: a missed owner-exclusion only lets a legit-membership click
 * through, it cannot inject a non-member).
 */
async function ownsClickedListing(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  clickedType: string,
  clickedId: string,
  userId: string,
): Promise<boolean> {
  try {
    let salonId: string | null = null;

    if (clickedType === "salon") {
      salonId = clickedId;
    } else if (clickedType === "service") {
      const { data, error } = await supabase
        .from("services")
        .select("salon_id")
        .eq("id", clickedId)
        .maybeSingle<{ salon_id: string }>();
      if (error) {
        console.error("[search/event] service->salon resolve failed:", error.message);
        return false;
      }
      salonId = data?.salon_id ?? null;
    } else {
      // stylist
      const { data, error } = await supabase
        .from("staff_members")
        .select("salon_id")
        .eq("id", clickedId)
        .maybeSingle<{ salon_id: string }>();
      if (error) {
        console.error("[search/event] stylist->salon resolve failed:", error.message);
        return false;
      }
      salonId = data?.salon_id ?? null;
    }

    if (!salonId) return false;

    const { data: salon, error: salErr } = await supabase
      .from("salons")
      .select("owner_id")
      .eq("id", salonId)
      .maybeSingle<{ owner_id: string }>();
    if (salErr) {
      console.error("[search/event] salon owner lookup failed:", salErr.message);
      return false;
    }
    return salon?.owner_id === userId;
  } catch (err) {
    console.error("[search/event] owner-exclusion check threw:", err);
    return false;
  }
}
