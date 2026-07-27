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

  const salon = await getActiveSalon<{ id: string; is_active: boolean; stripe_account_id: string | null; cover_photo_url: string | null }>(supabase, user.id, "id, is_active, stripe_account_id, cover_photo_url");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  const hasStripe = await isStripeReady(salon.stripe_account_id);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Verify ownership and requirements
  const salon = await getActiveSalon<{ id: string; stripe_account_id: string | null; cover_photo_url: string | null; approved_at: string | null; frozen_at: string | null }>(supabase, user.id, "id, stripe_account_id, cover_photo_url, approved_at, frozen_at");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  // Every rejection below used to be a hardcoded German sentence, so a French or Italian
  // salon owner pressing Go Live got told why in a language they may not read (council
  // hardcode lens, 2026-07-27; one of the five was added by this same batch, so this fixes
  // my own instance and its four neighbours rather than leaving the route half-translated).
  // Resolved LAZILY, inside the helper, so the happy path pays no extra query at all , only
  // a request that is about to fail reads profiles.locale.
  type GoLiveErrorKey =
    | "frozen"
    | "pendingApproval"
    | "stripeRequired"
    | "coverPhotoRequired"
    | "serviceRequired";
  const denied = async (key: GoLiveErrorKey, status: number) => {
    const { data: profile } = await supabase
      .from("profiles").select("locale").eq("id", user.id).maybeSingle();
    const locale = (profile?.locale as "de" | "en" | "fr" | "it") ?? "de";
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations({ locale, namespace: "api.goLive" });
    return NextResponse.json({ error: t(key) }, { status });
  };

  // A frozen salon may not self-reactivate. Freezing now sets is_active=false
  // (app/api/admin/salons/[id]/freeze/route.ts, 2026-07-27) but leaves approved_at intact,
  // so without this gate the owner could undo an admin freeze by pressing Go Live. Only an
  // admin re-approval clears frozen_at.
  if (salon.frozen_at) return denied("frozen", 403);
  // Admin review gate: an owner may only self-activate a salon that an admin has
  // already approved (salons.approved_at set by PATCH /api/admin/salons/[id]/approve).
  // Without this, an owner could set is_active=true directly with no admin review.
  if (!salon.approved_at) return denied("pendingApproval", 403);
  if (!(await isStripeReady(salon.stripe_account_id))) return denied("stripeRequired", 400);
  if (!salon.cover_photo_url) return denied("coverPhotoRequired", 400);

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  if ((serviceCount ?? 0) < 1) return denied("serviceRequired", 400);

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
