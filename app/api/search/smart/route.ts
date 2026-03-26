export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Gemini SDK crashes on Edge

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { generateEmbedding } from "@/lib/search/embeddings";
import { detectCategory } from "@/lib/search/category-detect";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  // IP-based rate limit (public route, aggressive — embeddings cost money)
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 200) {
    return NextResponse.json({ results: [], detected_category: null });
  }

  const category = req.nextUrl.searchParams.get("category") || null;
  const citySlug = req.nextUrl.searchParams.get("city");

  try {
    // 1. Generate embedding for query
    const embedding = await generateEmbedding(q);

    const supabase = createAdminSupabaseClient();
    
    let cityId: string | undefined;
    if (citySlug) {
      const { data: cityRecord } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();
      if (cityRecord) {
        cityId = cityRecord.id;
      }
    }

    // 2. Search via pgvector RPC
    const { data: matches, error } = await supabase.rpc("match_search_embeddings", {
      query_embedding: JSON.stringify(embedding),
      match_category: category,
      match_city_id: cityId || null,
      match_threshold: 0.5,
      match_count: 10,
    });

    if (error) {
      console.error("Smart search RPC error:", error);
      return NextResponse.json({ results: [], detected_category: null });
    }

    // 3. Enrich results with salon/service display data
    const entityIds = (matches ?? []).map((m: { entity_id: string }) => m.entity_id);
    if (entityIds.length === 0) {
      return NextResponse.json({ results: [], detected_category: null });
    }

    // Fetch service details for matched entities
    const { data: services } = await supabase
      .from("services")
      .select("id, name_de, salon_id, category")
      .in("id", entityIds)
      .eq("is_active", true);

    // Fetch salon names for matched salon entities
    const { data: salons } = await supabase
      .from("salons")
      .select("id, name, slug, categories")
      .in("id", entityIds)
      .eq("is_active", true);

    // Build results
    const results = (matches ?? []).map((match: { entity_type: string; entity_id: string; category: string; similarity: number }) => {
      if (match.entity_type === "service") {
        const svc = services?.find((s) => s.id === match.entity_id);
        return {
          entity_type: "service",
          entity_id: match.entity_id,
          salon_id: svc?.salon_id ?? "",
          name: svc?.name_de ?? match.entity_id,
          category: match.category,
          similarity: match.similarity,
        };
      }
      if (match.entity_type === "salon") {
        const salon = salons?.find((s) => s.id === match.entity_id);
        return {
          entity_type: "salon",
          entity_id: match.entity_id,
          salon_id: match.entity_id,
          name: salon?.name ?? match.entity_id,
          category: match.category,
          similarity: match.similarity,
        };
      }
      return null;
    }).filter(Boolean);

    // 4. Detect category if not scoped
    let detected_category: string | null = null;
    let suggested_category: string | null = null;
    if (!category) {
      detected_category = await detectCategory(q);
    } else {
      // Check if query belongs to a different category
      const detected = await detectCategory(q);
      if (detected && detected !== category) {
        suggested_category = detected;
      }
    }

    return NextResponse.json({
      results,
      detected_category,
      suggested_category,
    });
  } catch (err) {
    console.error("Smart search error:", err);
    return NextResponse.json({ results: [], detected_category: null });
  }
}
