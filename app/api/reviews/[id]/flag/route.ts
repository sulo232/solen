export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, admin } from "@/lib/supabase";
import { flagReviewSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // verify the user owns the salon of this review
  const { data: review } = await supabase.from("reviews").select("salon_id").eq("id", id).single();
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const { data: salon } = await supabase.from("salons").select("owner_id").eq("id", review.salon_id).single();
  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = flagReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { error } = await admin.from("reviews")
    .update({ 
      is_flagged: true,
      moderation_status: "under_review",
      removal_reason: parsed.data.reason
    })
    .eq("id", id);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ ok: true });
}
