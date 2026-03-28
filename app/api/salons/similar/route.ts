import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const currentId = searchParams.get("current_id");
  const quartier = searchParams.get("quartier");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "3", 10);

  if (!currentId || !quartier || !category) {
    return NextResponse.json(
      { error: "Missing parameters" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("salons")
      .select("*")
      .eq("quartier", quartier)
      .contains("categories", [category])
      .neq("id", currentId)
      .eq("is_active", true)
      .order("solen_score", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ salons: data || [] });
  } catch (err) {
    console.error("Similar salons error:", err);
    return NextResponse.json(
      { error: "Failed to fetch similar salons" },
      { status: 500 }
    );
  }
}
