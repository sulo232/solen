export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminSupabaseClient();

  // Fetch group by slug
  const { data: group, error } = await supabase
    .from("salon_groups")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch salons in this group
  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, slug, cover_photo_url, categories, quartier, average_rating, review_count, last_minute_discount_percent, avg_price")
    .eq("group_id", group.id)
    .eq("is_active", true)
    .order("average_rating", { ascending: false });

  return NextResponse.json({ group, salons: salons ?? [] });
}
