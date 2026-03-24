export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/clients/[id]/repeat-last-cut
// Returns the most recent barber_cut_history for this client at the owner's salon.
// Used by the express rebook flow to pre-fill cut spec.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id: customerId } = await params;
  const admin = createAdminSupabaseClient();

  // Verify requester owns the salon
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: lastCut } = await admin
    .from("barber_cut_history")
    .select(
      "id, side_length, top_style, fade_type, lineup, beard_style, hair_design, product_used, photo_url, notes, created_at, staff_member_id, staff_members(first_name, last_name)"
    )
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastCut) {
    return NextResponse.json({ lastCut: null });
  }

  return NextResponse.json({ lastCut });
}
