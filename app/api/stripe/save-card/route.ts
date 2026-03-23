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
  customer_id: z.string().min(1).max(200),
  salon_id: z.string().uuid(),
});

// POST /api/stripe/save-card
// Creates a SetupIntent to save a card for bookings >7 days away.
// Body: { booking_id, customer_id, salon_id }
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
  const { booking_id, customer_id, salon_id } = validated;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons")
    .select("stripe_account_id, accepts_online_payment")
    .eq("id", salon_id)
    .single();

  if (!salon?.accepts_online_payment) {
    return NextResponse.json({ error: "Salon does not accept online payments" }, { status: 400 });
  }

  const setupIntentParams: Parameters<typeof stripe.setupIntents.create>[0] = {
    customer: customer_id,
    payment_method_types: ["card"],
    metadata: {
      booking_id,
      salon_id,
      customer_id: user.id,
    },
  };

  if (salon.stripe_account_id) {
    setupIntentParams.on_behalf_of = salon.stripe_account_id;
  }

  const setupIntent = await stripe.setupIntents.create(setupIntentParams);

  return NextResponse.json({
    client_secret: setupIntent.client_secret,
    setup_intent_id: setupIntent.id,
  });
}
