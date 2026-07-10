export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { getActiveSalon } from "@/lib/active-salon";

// GET /api/stripe/connect/status
// Returns the Stripe Connect onboarding status for the current salon owner.
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "not_connected" });

  const admin = createAdminSupabaseClient();
  const salon = await getActiveSalon<{ stripe_account_id: string | null }>(admin, user.id, "stripe_account_id");

  if (!salon?.stripe_account_id) {
    return NextResponse.json({ status: "not_connected" });
  }

  try {
    const account = await stripe.accounts.retrieve(salon.stripe_account_id);

    if (account.charges_enabled && account.payouts_enabled) {
      return NextResponse.json({
        status: "connected",
        charges_enabled: true,
        payouts_enabled: true,
        account_id: account.id,
      });
    }

    // Account exists but onboarding is not complete
    return NextResponse.json({
      status: "pending",
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      account_id: account.id,
    });
  } catch {
    return NextResponse.json({ status: "not_connected" });
  }
}
