import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

// GET /api/stripe/connect/status
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons")
    .select("stripe_account_id, accepts_online_payment, no_show_deposit_amount")
    .eq("owner_id", user.id)
    .single();

  if (!salon?.stripe_account_id) {
    return NextResponse.json({ status: "not_connected", charges_enabled: false });
  }

  const account = await stripe.accounts.retrieve(salon.stripe_account_id);
  const status = account.charges_enabled
    ? "connected"
    : account.details_submitted
    ? "pending"
    : "incomplete";

  return NextResponse.json({
    status,
    charges_enabled: account.charges_enabled,
    account_id: salon.stripe_account_id,
    accepts_online_payment: salon.accepts_online_payment,
    no_show_deposit_amount: salon.no_show_deposit_amount,
  });
}
