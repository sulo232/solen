import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/salons/search?q=...
 * Full-text search across salon name, services, and staff specialties.
 */
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 20 });
  }

  const supabase = await createServerSupabaseClient();

  // Search salons by name (ilike) — returns matching salons
  const { data: salonsByName } = await supabase
    .from("salons")
    .select("*")
    .eq("is_active", true)
    .ilike("name", `%${q}%`)
    .limit(10);

  // Search services by name and return parent salons
  const { data: serviceMatches } = await supabase
    .from("services")
    .select("salon_id, salons!inner(*)")
    .eq("is_active", true)
    .or(`name_de.ilike.%${q}%,name_en.ilike.%${q}%`)
    .limit(10);

  // Merge and deduplicate
  const seen = new Set<string>();
  const results = [...(salonsByName ?? [])];
  results.forEach((s) => seen.add(s.id));

  serviceMatches?.forEach((m: { salons: unknown }) => {
    const salon = m.salons as { id: string } & Record<string, unknown>;
    if (!seen.has(salon.id)) {
      results.push(salon as never);
      seen.add(salon.id);
    }
  });

  return NextResponse.json({ items: results, total: results.length, page: 1, limit: 20 });
}
