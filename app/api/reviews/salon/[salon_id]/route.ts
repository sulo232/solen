import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salon_id: string }> }
) {
  const { salon_id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = await createServerSupabaseClient();

  const { data, error, count } = await supabase
    .from("reviews")
    .select("*, profiles!user_id(display_name, avatar_url), staff_members(name)", { count: "exact" })
    .eq("salon_id", salon_id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ items: data, total: count ?? 0, page, limit });
}
