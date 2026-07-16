export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/recommendations/chips
 *
 * Per-user personalized quick-search chip terms for the search overlay's "Für dich" row.
 * Drop-in replacement for /api/discovery/chip-terms — IDENTICAL response shape
 * ({ terms: [{ term }] }) so the frontend swap is a one-line URL change.
 *
 * Rank order (deduped case-insensitively, capped at 8):
 *   1. Re-book        — services from the user's completed/confirmed bookings (newest first)
 *   2. Stated         — profiles.preferred_services (text[])
 *   3. Likes          — style tags from the user's likes/saves, frequency-ranked (dormant: 0 like rows today)
 *   4. Hair profile   — beauty defaults from color_treated / hair_condition (TUNABLE)
 *   5. Popular        — discovery_chip_terms RPC, always appended to fill to 8.
 *                       For logged-out / new users this is the ONLY source.
 *
 * Defensive: every signal is wrapped so one failing query never 500s the endpoint —
 * it logs and continues. The popular fallback guarantees a non-empty list whenever
 * popular terms exist; on total failure we return { terms: [] } (the overlay then
 * shows its own static TRENDING fallback).
 *
 * Not wired:
 *   - CITY scoping: discovery_chip_terms(p_limit integer) takes no city param, so
 *     preferred_city is read best-effort only and not used to scope popular terms. Style
 *     tags are largely city-agnostic, and the actual salon results are already city-filtered.
 */

const MAX_TERMS = 8;

/** Case-insensitive de-dupe + cap that preserves rank order and first-seen casing. */
function pushTerms(out: string[], seen: Set<string>, incoming: Array<string | null | undefined>) {
  for (const raw of incoming) {
    if (out.length >= MAX_TERMS) return;
    const term = (raw ?? "").trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  let userId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (err) {
    console.error("[recommendations/chips] session lookup failed:", err);
  }

  // Rate limit (matches /api/recommendations): keyed by user id, else client IP. getClientIp
  // trusts Netlify's x-nf-client-connection-ip / x-real-ip first (raw XFF is attacker-supplied
  // and rotating it defeated this key entirely, same bug as app/[locale]/inspo/[id]/page.tsx).
  const identifier = userId || getClientIp(req) || "anonymous";
  const rateLimited = await applyRateLimit(generalLimiter, { userId: identifier });
  if (rateLimited) return rateLimited;

  const collected: string[] = [];
  const seen = new Set<string>();

  if (userId) {
    // ── 1. Re-book: services from completed/confirmed bookings, newest first ──
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("created_at, service:services(name_de)")
        .eq("user_id", userId)
        .in("status", ["completed", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      // The typed client infers the joined `service` relation loosely (object or array
      // depending on generated types), so normalize through unknown and read name_de
      // defensively whichever shape comes back.
      const rows = (data ?? []) as unknown as Array<{
        service: { name_de: string | null } | { name_de: string | null }[] | null;
      }>;
      const names = rows.map((b) => {
        const svc = Array.isArray(b.service) ? b.service[0] : b.service;
        return svc?.name_de ?? null;
      });
      // Cap re-book contribution at ~5 distinct (pushTerms handles the dedupe + global cap).
      const distinct: string[] = [];
      const localSeen = new Set<string>();
      for (const n of names) {
        const t = (n ?? "").trim();
        if (!t) continue;
        const k = t.toLowerCase();
        if (localSeen.has(k)) continue;
        localSeen.add(k);
        distinct.push(t);
        if (distinct.length >= 5) break;
      }
      pushTerms(collected, seen, distinct);
    } catch (err) {
      console.error("[recommendations/chips] re-book bookings query failed:", err);
    }

    // ── 2. Stated: profiles.preferred_services (text[]) + hair-profile fields ──
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_services, color_treated, hair_condition, preferred_city")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;

      const prefs = (data?.preferred_services ?? []) as unknown;
      const statedList = Array.isArray(prefs)
        ? (prefs as unknown[]).map((p) => (typeof p === "string" ? p : "")).filter(Boolean)
        : [];
      pushTerms(collected, seen, statedList.slice(0, 3));

      // ── 4. Hair profile — beauty defaults ──
      // TUNABLE: beauty defaults, refine later.
      const hairDefaults: string[] = [];
      if (data?.color_treated === true) {
        hairDefaults.push("Ansatz färben", "Toner");
      }
      const condition = typeof data?.hair_condition === "string" ? data.hair_condition : "";
      if (/damag|geschäd|trocken|dry|brittle|kaputt|stroh/i.test(condition)) {
        hairDefaults.push("Haarkur", "Olaplex");
      }
      pushTerms(collected, seen, hairDefaults);

      // preferred_city is read here for future city-scoping; the popular RPC takes no
      // city param, so it is intentionally NOT used to filter terms (see header note).
      void data?.preferred_city;
    } catch (err) {
      console.error("[recommendations/chips] profile preferences query failed:", err);
    }

    // ── 3. Likes: style tags from items the user liked / saved, frequency-ranked. ──
    // discovery_likes/saves carry (user_id, item_id); the style term lives in
    // discovery_items.tags (text[]). Two cheap queries + a light filter (no deny-list —
    // these are the user's own picks). Currently dormant (0 like rows) but kicks in live.
    try {
      const [likeRes, saveRes] = await Promise.all([
        supabase.from("discovery_likes").select("item_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        supabase.from("discovery_saves").select("item_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      ]);
      const itemIds = [
        ...new Set(
          [...(likeRes.data ?? []), ...(saveRes.data ?? [])]
            .map((r) => (r as { item_id: string | null }).item_id)
            .filter((v): v is string => !!v),
        ),
      ];
      if (itemIds.length > 0) {
        const { data: itemRows, error: itemErr } = await supabase
          .from("discovery_items")
          .select("tags")
          .in("id", itemIds);
        if (itemErr) throw itemErr;
        const freq = new Map<string, number>();
        for (const it of (itemRows ?? []) as Array<{ tags: string[] | null }>) {
          for (const raw of it.tags ?? []) {
            const tag = (raw ?? "").trim();
            if (tag.length < 3 || tag.length > 22) continue;
            freq.set(tag, (freq.get(tag) ?? 0) + 1);
          }
        }
        const topTags = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 3);
        pushTerms(collected, seen, topTags);
      }
    } catch (err) {
      console.error("[recommendations/chips] likes/saves query failed:", err);
    }
  }

  // ── 5. Popular fallback / filler — always run; the ONLY source for logged-out users. ──
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("discovery_chip_terms", { p_limit: 10 });
    if (error) throw error;
    type Row = { term: string | null };
    const popular = ((data ?? []) as Row[]).map((r) => r.term);
    pushTerms(collected, seen, popular);
  } catch (err) {
    console.error("[recommendations/chips] popular RPC fallback failed:", err);
  }

  const terms = collected.slice(0, MAX_TERMS).map((term) => ({ term }));
  return NextResponse.json({ terms });
}
