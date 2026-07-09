export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

const saveCardSchema = z.object({
  booking_id: z.string().uuid(),
  salon_id: z.string().uuid(),
});

// POST /api/stripe/save-card
// Creates a SetupIntent to save a card for bookings >7 days away.
// Body: { booking_id, salon_id }
// SECURITY: the Stripe customer is always resolved from the session user's own
// profile, never trust a client-supplied customer_id (a client could pass any
// other user's Stripe customer and attach a payment method to their account).
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
  const { data: validated, error: validationError } = validateBody(saveCardSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { booking_id, salon_id } = validated;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons")
    .select("stripe_account_id, accepts_online_payment")
    .eq("id", salon_id)
    .single();

  if (!salon?.accepts_online_payment) {
    return NextResponse.json({ error: "Salon does not accept online payments" }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, full_name, email")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_id: user.id },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const setupIntentParams: import("stripe").Stripe.SetupIntentCreateParams = {
    customer: customerId,
    payment_method_types: ["card"],
    metadata: {
      booking_id,
      salon_id,
      customer_id: user.id,
    },
    ...(salon.stripe_account_id ? { on_behalf_of: salon.stripe_account_id } : {}),
  };

  const setupIntent = await stripe.setupIntents.create(setupIntentParams);

  return NextResponse.json({
    client_secret: setupIntent.client_secret,
    setup_intent_id: setupIntent.id,
  });
}
