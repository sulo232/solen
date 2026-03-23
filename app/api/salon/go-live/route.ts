export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/salon/go-live — Returns salon readiness state for the Go Live gate
export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salon } = await supabase
    .from("salons")
    .select("id, is_active, stripe_account_id, cover_photo_url")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  const hasStripe = !!salon.stripe_account_id;
  const hasCoverPhoto = !!salon.cover_photo_url;
  const hasServices = (serviceCount ?? 0) >= 1;
  const canGoLive = hasStripe && hasCoverPhoto && hasServices;

  return NextResponse.json({
    salon_id: salon.id,
    is_active: salon.is_active,
    has_stripe: hasStripe,
    has_cover_photo: hasCoverPhoto,
    has_services: hasServices,
    can_go_live: canGoLive,
  });
}

// POST /api/salon/go-live — Activate salon (owner-only, requires stripe + cover photo)
export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership and requirements
  const { data: salon } = await supabase
    .from("salons")
    .select("id, stripe_account_id, cover_photo_url")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });
  if (!salon.stripe_account_id) {
    return NextResponse.json({ error: "Stripe Connect muss zuerst eingerichtet werden." }, { status: 400 });
  }
  if (!salon.cover_photo_url) {
    return NextResponse.json({ error: "Ein Titelbild ist erforderlich." }, { status: 400 });
  }

  const { error } = await supabase
    .from("salons")
    .update({ is_active: true })
    .eq("id", salon.id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
