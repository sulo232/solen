import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/reviews/salon/[salon_id]
 * Public endpoint. Returns paginated reviews for a salon, newest first.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salon_id: string }> }
) {
  const { salon_id } = await params;
  const page  = parseInt(new URL(request.url).searchParams.get("page") ?? "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = await createServerSupabaseClient();

  const { data, count, error } = await supabase
    .from("reviews")
    .select("*, profiles!reviews_user_id_fkey(display_name, avatar_url), staff_members(name)", { count: "exact" })
    .eq("salon_id", salon_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
}
