import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET: Auto-suggest salon of the month (highest rating + most bookings)
 * POST: Admin confirms the selection
 */
export async function GET(req: NextRequest) {
  const supabase = createAdminSupabaseClient();

  // Get salon with highest average_rating among active salons with 5+ reviews
  const { data: candidates } = await supabase
    .from("salons")
    .select("id, name, slug, cover_photo_url, average_rating, review_count, quartier")
    .eq("is_active", true)
    .gte("review_count", 5)
    .order("average_rating", { ascending: false })
    .limit(5);

  return NextResponse.json({ candidates: candidates ?? [] });
}

export async function POST(req: NextRequest) {
  const authSupabase = await createServerSupabaseClient();
  const { data: { session } } = await authSupabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify admin
  const supabase = createAdminSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { salon_id } = body;
  if (!salon_id) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // Set the salon_of_month flag (store in feature_flags table)
  await supabase
    .from("feature_flags")
    .upsert({
      key: "salon_of_month",
      enabled: true,
      description: `Salon of the month: ${salon_id}`,
      updated_by: user.id,
    });

  return NextResponse.json({ success: true, salon_id });
}
