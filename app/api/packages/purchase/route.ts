export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, packagePurchaseSchema } from "@/lib/validations";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// GET /api/packages/purchase?salon_id= — Salon-facing list of sold packages.
// Powers the "recent purchases" rail in the dashboard PackageManager. Salon
// owner only: package_purchases has a salon-owner SELECT policy (migration 071
// purchases_salon_read), but we still verify ownership at the route boundary —
// same pattern as /api/bookings GET (salon branch) and /api/packages POST.
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // Ownership check (mirror /api/bookings GET): caller must own this salon.
  const { data: salon } = await supabase
    .from("salons")
    .select("owner_id")
    .eq("id", salonId)
    .single();
  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // package_purchases.package_id has a real FK → service_packages, so nest the
  // package name. user_id references auth.users (no FK to profiles), so resolve
  // the customer name via a separate public_profiles lookup — the phantom-JOIN-
  // safe enrichment pattern used by /api/bookings GET (lines 54-60).
  const { data, error } = await supabase
    .from("package_purchases")
    .select("id, user_id, sessions_used, sessions_total, purchased_at, service_packages(name)")
    .eq("salon_id", salonId)
    .order("purchased_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((data ?? []).map((p) => p.user_id).filter(Boolean) as string[])];
  const nameMap = new Map<string, string | null>();
  if (userIds.length) {
    const { data: profs } = await supabase
      .from("public_profiles")
      .select("id, display_name")
      .in("id", userIds);
    (profs ?? []).forEach((p) => nameMap.set(p.id, p.display_name));
  }

  const purchases = (data ?? []).map((p) => ({
    id: p.id,
    customer_name: (p.user_id ? nameMap.get(p.user_id) : null) ?? "Kunde",
    package_name: (p.service_packages as { name?: string } | null)?.name ?? "Paket",
    sessions_used: p.sessions_used ?? 0,
    sessions_total: p.sessions_total ?? 0,
    purchased_at: p.purchased_at,
  }));

  return NextResponse.json({ purchases });
}

// POST /api/packages/purchase — Buy a service package via Stripe
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("payments");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(packagePurchaseSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Get package details
  const { data: pkg } = await supabase
    .from("service_packages")
    .select("*, salons(stripe_account_id)")
    .eq("id", validated.package_id)
    .eq("is_active", true)
    .single();

  if (!pkg) return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 });

  const stripeAccountId = (pkg.salons as any)?.stripe_account_id;

  // Read commission rate from platform_settings
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "commission")
    .single();

  const ratePercent = settings?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
  const platformFee = Math.round(pkg.price * (ratePercent / 100));

  // Create PaymentIntent
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: pkg.price,
    currency: "chf",
    metadata: {
      type: "package_purchase",
      package_id: pkg.id,
      user_id: user.id,
      salon_id: pkg.salon_id,
    },
  };

  if (stripeAccountId) {
    piParams.application_fee_amount = platformFee;
    piParams.transfer_data = { destination: stripeAccountId };
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.create(piParams);

    // Create purchase record (pending until payment succeeds via webhook).
    // Service-role client: package_purchases has RLS enabled with SELECT-only
    // policies (migration 071) and no INSERT policy, so the RLS request client
    // would be silently blocked — the row (and thus the refundable paid_amount
    // the webhook later writes) would never be created. Mirrors how the retail
    // purchase route + the webhook + the refund chokepoint all write money rows.
    const admin = createAdminSupabaseClient();
    await admin.from("package_purchases").insert({
      package_id: pkg.id,
      user_id: user.id,
      salon_id: pkg.salon_id,
      sessions_total: pkg.total_sessions + (pkg.bonus_sessions ?? 0),
      sessions_used: 0,
      stripe_payment_intent_id: paymentIntent.id,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
