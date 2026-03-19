export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salon_id: string }> }
) {
  const { salon_id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const sort = searchParams.get("sort") ?? "newest";
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = await createServerSupabaseClient();

  // Build sort order based on param
  let orderCol = "created_at";
  let ascending = false;
  if (sort === "highest") { orderCol = "rating"; ascending = false; }
  else if (sort === "lowest") { orderCol = "rating"; ascending = true; }

  const { data, error, count } = await supabase
    .from("reviews")
    .select("*, profiles!user_id(display_name, avatar_url), staff_members(name)", { count: "exact" })
    .eq("salon_id", salon_id)
    .eq("is_hidden", false)
    .order(orderCol, { ascending })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Add is_verified computed field (true if review has a booking_id)
  const items = (data ?? []).map((rev: any) => ({
    ...rev,
    is_verified: !!rev.booking_id,
  }));

  return NextResponse.json({ items, total: count ?? 0, page, limit });
}
