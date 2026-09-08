export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { isStripeReady } from "@/lib/salon/stripe-ready";

// GET /api/salon/go-live: returns salon readiness state for the Go Live gate
export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salon = await getActiveSalon<{ id: string; is_active: boolean; stripe_account_id: string | null; cover_photo_url: string | null; approved_at: string | null; rejection_reason: string | null }>(supabase, user.id, "id, is_active, stripe_account_id, cover_photo_url, approved_at, rejection_reason", "settings");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  const hasStripe = await isStripeReady(salon.stripe_account_id);
  const hasCoverPhoto = !!salon.cover_photo_url;
  const hasServices = (serviceCount ?? 0) >= 1;
  const isApproved = !!salon.approved_at;
  // can_go_live now mirrors the POST gate EXACTLY, approval included. Before this it reported the
  // three owner-side requirements only, so the wizard enabled the activate button for a salon that
  // had never been approved and the POST answered 403 (owner decision 8, "i approve for every
  // salon"). approval_state lets the UI say WHICH gate it is waiting on instead of showing one
  // undifferentiated disabled button.
  const canGoLive = isApproved && hasStripe && hasCoverPhoto && hasServices;
  const approvalState = isApproved
    ? "approved"
    : salon.rejection_reason
      ? "rejected"
      : "pending";

  return NextResponse.json({
    salon_id: salon.id,
    is_active: salon.is_active,
    has_stripe: hasStripe,
    has_cover_photo: hasCoverPhoto,
    has_services: hasServices,
    is_approved: isApproved,
    approval_state: approvalState,
    rejection_reason: salon.rejection_reason,
    can_go_live: canGoLive,
  });
}

// POST /api/salon/go-live — Activate salon (owner-only, requires stripe + cover photo)
export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Verify ownership and requirements
  const salon = await getActiveSalon<{ id: string; stripe_account_id: string | null; cover_photo_url: string | null; approved_at: string | null }>(supabase, user.id, "id, stripe_account_id, cover_photo_url, approved_at");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });
  // Admin review gate: an owner may only self-activate a salon that an admin has
  // already approved (salons.approved_at set by PATCH /api/admin/salons/[id]/approve).
  // Without this, an owner could set is_active=true directly with no admin review.
  if (!salon.approved_at) {
    // `code` so the client can render this in the user's own locale (the literal below is the
    // de-only fallback the other messages in this route also use); GoLiveStep maps the code.
    return NextResponse.json({ code: "AWAITING_APPROVAL", error: "Der Salon wartet noch auf die Freigabe durch einen Administrator." }, { status: 403 });
  }
  if (!(await isStripeReady(salon.stripe_account_id))) {
    return NextResponse.json({ error: "Stripe Connect muss zuerst vollständig eingerichtet werden (KYC, Bankkonto)." }, { status: 400 });
  }
  if (!salon.cover_photo_url) {
    return NextResponse.json({ error: "Ein Titelbild ist erforderlich." }, { status: 400 });
  }

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  if ((serviceCount ?? 0) < 1) {
    return NextResponse.json({ error: "Mindestens ein Service muss aktiv sein." }, { status: 400 });
  }

  // cas-ok: is_active flip is idempotent (setting true twice is a no-op, no lost-money race);
  // pre-existing update, unchanged by this port (item 2 scope is the serviceCount gate above)
  const { error } = await supabase
    .from("salons")
    .update({ is_active: true })
    .eq("id", salon.id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
