import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  const disabled = await checkFeatureEnabled("last_minute");
  if (disabled) return disabled;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? null;
  const quartier = searchParams.get("quartier") ?? null;

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("get_last_minute_slots", {
    p_category: category,
    p_quartier: quartier,
  });

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ items: data ?? [], total: (data ?? []).length });
}
