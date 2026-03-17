import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// PATCH /api/reviews/[id]/respond — salon owner only
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Get the review to find the salon
  const { data: review } = await admin
    .from("reviews")
    .select("salon_id")
    .eq("id", id)
    .single();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  // Verify caller owns the salon
  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", review.salon_id)
    .single();

  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { salon_response } = await req.json();
  if (!salon_response?.trim()) {
    return NextResponse.json({ error: "salon_response required" }, { status: 400 });
  }

  const { error } = await admin
    .from("reviews")
    .update({
      salon_response: salon_response.trim(),
      salon_response_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
