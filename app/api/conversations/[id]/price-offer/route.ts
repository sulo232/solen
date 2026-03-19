export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";

// POST /api/conversations/[id]/price-offer — Salon creates a price offer
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  const disabled = await checkFeatureEnabled("messaging");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { description, amount_chf, photo_url } = body;

  if (!description || typeof description !== "string" || description.length > 500) {
    return NextResponse.json({ error: "Description required (max 500 chars)" }, { status: 400 });
  }
  if (!amount_chf || typeof amount_chf !== "number" || amount_chf <= 0) {
    return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
  }

  // Verify conversation exists and user is the salon owner
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, customer_id, salon_id, salons(owner_id)")
    .eq("id", conversationId)
    .single();

  if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const salonOwner = (conv.salons as unknown as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Only salon owners can create price offers" }, { status: 403 });
  }

  // Check for existing active offer in this conversation
  const { data: existing } = await supabase
    .from("price_offers")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("status", "pending")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "An active offer already exists in this conversation" }, { status: 409 });
  }

  // Create the price offer
  const { data: offer, error } = await supabase
    .from("price_offers")
    .insert({
      conversation_id: conversationId,
      salon_id: conv.salon_id,
      customer_id: conv.customer_id,
      description,
      amount_chf,
      photo_url: photo_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also send a message in chat referencing the offer
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Preisangebot: ${description} — CHF ${amount_chf.toFixed(2)}`,
    message_type: "price_offer",
  });

  return NextResponse.json({ offer }, { status: 201 });
}

// PATCH /api/conversations/[id]/price-offer — Customer accepts or declines
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json();
  const { offer_id, action } = body;

  if (!offer_id || !action || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "offer_id and action (accept/decline) required" }, { status: 400 });
  }

  // Get the offer
  const { data: offer } = await supabase
    .from("price_offers")
    .select("*")
    .eq("id", offer_id)
    .eq("conversation_id", conversationId)
    .eq("customer_id", user.id)
    .eq("status", "pending")
    .single();

  if (!offer) return NextResponse.json({ error: "Offer not found or already resolved" }, { status: 404 });

  if (action === "decline") {
    await supabase
      .from("price_offers")
      .update({ status: "declined" })
      .eq("id", offer_id);

    return NextResponse.json({ message: "Offer declined" });
  }

  // Accept — create Stripe payment intent
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(offer.amount_chf * 100),
    currency: "chf",
    metadata: {
      type: "price_offer",
      offer_id: offer.id,
      conversation_id: conversationId,
      salon_id: offer.salon_id,
      customer_id: user.id,
    },
  });

  await supabase
    .from("price_offers")
    .update({
      status: "accepted",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("id", offer_id);

  return NextResponse.json({
    message: "Offer accepted",
    client_secret: paymentIntent.client_secret,
  });
}
