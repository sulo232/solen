import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/salons/last-minute
 * Returns all available last-minute slots with salon + service data.
 * Query params: category, quartier
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || null;
  const quartier = searchParams.get("quartier") || null;

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("get_last_minute_slots", {
    p_category: category,
    p_quartier: quartier,
  });

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [], total: (data as unknown[])?.length ?? 0 });
}
