// exists-check: net-new vs app/api/salons + app/api/search/suggest because neither returns
// broaden-suggestion counts for a zero-result search. `npm run exists no-results` -> 0 matches.
// Reuses search_salons_ranked (lib search infra) + lib/supabase; adds no new data/table.
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/search/embeddings";

// GET /api/search/no-results?q=<query>&city=<city>
//
// Powers the Google-style empty-state helper on the search results page (fires when the
// results total === 0 and q.length >= 2). Returns broadening suggestions, each ONLY when its
// real count > 0 , never a fabricated count (SEARCH_BACKEND R1 + no-fabrication rule):
//   anywhere : { count } , visible salons matching q with NO city filter. Surfaced only when the
//              failed search HAD a city (dropping it is the useful broaden). count is the ranked
//              hit count, capped at 60 ("60+").
//   category : { value, count } , the dominant salon category among the nationwide matches, with
//              the total number of visible salons in that category. Lets the user fall back to a
//              broader category browse. Derived from search_salons_ranked's own fuzzy/trigram
//              matches (reuses existing search infra , no separate keyword list to drift).
//
// Nearby-city row is intentionally omitted until >= 2 cities have salons (supply gate,
// SEARCH_BACKEND R1/D1: today all live salons are in Basel, so a nearby row would be useless).
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const city = req.nextUrl.searchParams.get("city");
  if (q.length < 2) {
    return NextResponse.json({ anywhere: null, category: null });
  }

  const supabase = await createServerSupabaseClient();

  // Nationwide ranked matches for q. search_salons_ranked is city-agnostic and already gates to
  // customer-visible salons (is_active AND listed_on_marketplace AND NOT is_test), so its result
  // count is how many salons match q anywhere in CH.
  let emb: string | null = null;
  try {
    emb = JSON.stringify(await generateEmbedding(q));
  } catch (e) {
    console.error("[search/no-results] embedding failed, lexical-only:", (e as Error).message);
  }
  const { data: ranked, error: rankErr } = await supabase.rpc("search_salons_ranked", {
    p_q: q,
    p_limit: 60,
    p_query_embedding: emb,
  });
  if (rankErr) console.error("[search/no-results] search_salons_ranked failed:", rankErr.message);
  const ids: string[] = (ranked ?? []).map((r: { salon_id: string }) => r.salon_id);

  // anywhere: only meaningful when the failed search was city-scoped (dropping the city broadens).
  const anywhere = city && ids.length > 0 ? { count: ids.length } : null;

  // category: dominant category among the matches -> total visible salons in it.
  let category: { value: string; count: number } | null = null;
  if (ids.length > 0) {
    const { data: rows, error: catErr } = await supabase
      .from("salons")
      .select("categories")
      .in("id", ids);
    if (catErr) console.error("[search/no-results] category tally failed:", catErr.message);
    const tally: Record<string, number> = {};
    for (const r of rows ?? []) {
      for (const c of ((r.categories as string[]) ?? [])) tally[c] = (tally[c] ?? 0) + 1;
    }
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const value = top[0];
      const { count, error: cntErr } = await supabase
        .from("salons")
        .select("id", { count: "exact", head: true })
        .contains("categories", [value])
        .eq("is_active", true)
        .eq("listed_on_marketplace", true)
        .eq("is_test", false);
      if (cntErr) console.error("[search/no-results] category count failed:", cntErr.message);
      if ((count ?? 0) > 0) category = { value, count: count as number };
    }
  }

  return NextResponse.json({ anywhere, category });
}
