export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, aiDailyLimiter, getClientIp } from "@/lib/ratelimit";
import { generateEmbedding } from "@/lib/search/embeddings";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const dailyLimited = await applyRateLimit(aiDailyLimiter, { ip: getClientIp(request) });
  if (dailyLimited) return dailyLimited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 20 });
  }

  const supabase = await createServerSupabaseClient();

  // Hybrid query embedding (Phase 5): generate once per full search (results path
  // only, never per-keystroke suggest) and let the RPC fuse semantic recall with
  // lexical matching. Fail-open: if Gemini errors, pass null and the RPC runs
  // lexical-only (no crash). Future optimization: cache query -> embedding.
  let pQueryEmbedding: string | null = null;
  try {
    pQueryEmbedding = JSON.stringify(await generateEmbedding(q));
  } catch (err) {
    console.error("[salons/search] query embedding failed, falling back to lexical-only:", (err as Error).message);
  }

  // Smart Search engine: FTS + trigram (typos + prefix) + one-way synonyms
  // (incl. fr/it bridge) + semantic vector fusion + Bayesian rating, with the
  // three visibility gates (is_active ∧ listed_on_marketplace ∧ NOT is_test)
  // baked into the RPC so they can never be dropped.
  const { data: ranked, error } = await supabase.rpc("search_salons_ranked", {
    p_q: q,
    p_limit: 30,
    // RPC arg is optional (SQL default null); undefined omits the key from the JSON body,
    // which PostgREST resolves to the same SQL-side default as an explicit null.
    p_query_embedding: pQueryEmbedding ?? undefined,
  });
  if (error) {
    console.error("[salons/search] search_salons_ranked failed:", error.message);
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  const orderedIds: string[] = (ranked ?? []).map((r: { salon_id: string }) => r.salon_id);
  if (orderedIds.length === 0) {
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 20 });
  }

  // Explicit public column list, same shape as app/api/salons/route.ts (selectStr),
  // plus opening_hours for the map QuickPreviewSheet. Replaces select('*') which
  // shipped all ~98 salon columns to anonymous clients, including owner/payment
  // internals. Never select search_doc, score_details, stripe_account_id, owner_id
  // here. This endpoint is queued for deletion by _plans/SEARCH_BACKEND.md phase 4
  // once its 3 consumers (SearchResults, SplitView, badge-manager) are repointed;
  // until then it must not leak.
  const { data: rows, error: hydErr } = await supabase
    .from("salons")
    .select(
      "id, slug, name, cover_photo_url, gallery_urls, categories, address, postal_code, quartier, latitude, longitude, opening_hours, average_rating, review_count, last_minute_discount_percent, walkin_enabled, accepts_online_payment, solen_score, created_at, services(price)",
    )
    .in("id", orderedIds);
  if (hydErr) {
    console.error("[salons/search] hydrate failed:", hydErr.message);
    return NextResponse.json({ message: hydErr.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Preserve the engine's rank order + attach min_price ("ab X CHF"); strip the joined services.
  const rank = new Map(orderedIds.map((id, i) => [id, i]));
  const results = (rows ?? [])
    .sort(
      (a, b) =>
        (rank.get((a as { id: string }).id) ?? 0) - (rank.get((b as { id: string }).id) ?? 0),
    )
    .map((salon) => {
      const prices = ((salon as { services?: { price: number }[] }).services ?? [])
        .map((s) => s.price)
        .filter((p) => typeof p === "number" && p > 0);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { services: _services, ...rest } = salon as Record<string, unknown>;
      return { ...rest, min_price: prices.length > 0 ? Math.min(...prices) : null };
    });

  return NextResponse.json({ items: results, total: results.length, page: 1, limit: 20 });
}
