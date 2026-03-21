export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/connect/create-account
// Creates a Stripe Connect Express account for the salon and returns the onboarding URL.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();

  // Get salon owned by this user
  const { data: salon } = await admin
    .from("salons")
    .select("id, name, stripe_account_id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  // If already has an account, generate a new onboarding link (in case previous one expired)
  let accountId = salon.stripe_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "CH",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: { name: salon.name },
    });
    accountId = account.id;

    await admin.from("salons").update({ stripe_account_id: accountId }).eq("id", salon.id);
  }

  const origin = req.headers.get("origin") ?? "https://solen.ch";
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/de/dashboard/settings?tab=payments&connect=refresh`,
    return_url: `${origin}/de/dashboard/settings?tab=payments&connect=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
