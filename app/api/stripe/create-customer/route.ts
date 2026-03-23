export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";

// POST /api/stripe/create-customer
// Creates a Stripe Customer for SetupIntent flows (bookings >7 days)
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

  // Check if user already has a Stripe customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const customer = await stripe.customers.create({
    email: user.email,
    name: profile?.display_name ?? undefined,
    metadata: { solen_user_id: user.id },
  });

  return NextResponse.json({ customer_id: customer.id });
}
