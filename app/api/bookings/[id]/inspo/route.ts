export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, bookingInspoSchema } from "@/lib/validations";

// GET /api/bookings/[id]/inspo — Get inspo images for a booking
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id: bookingId } = await params;
  const admin = createAdminSupabaseClient();

  // Verify user has access (is customer or salon owner)
  const { data: booking } = await admin
    .from("bookings").select("id, user_id, salon_id").eq("id", bookingId).single();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const isCustomer = booking.user_id === user.id;
  if (!isCustomer) {
    const { data: salon } = await admin
      .from("salons").select("id").eq("id", booking.salon_id).eq("owner_id", user.id).single();
    if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("nail_inspo_images")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data ?? [] });
}

// POST /api/bookings/[id]/inspo — Attach inspo image to booking
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id: bookingId } = await params;
  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(bookingInspoSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const admin = createAdminSupabaseClient();

  // Verify booking belongs to user
  const { data: booking } = await admin
    .from("bookings").select("id, user_id").eq("id", bookingId).single();
  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If inspo_image_id provided, attach existing image to booking
  if (validated.inspo_image_id) {
    const { error } = await admin
      .from("nail_inspo_images")
      .update({ booking_id: bookingId })
      .eq("id", validated.inspo_image_id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Otherwise upload new image directly attached to booking
  if (!validated.image_url) return NextResponse.json({ error: "image_url or inspo_image_id required" }, { status: 400 });

  const { data: image, error } = await admin
    .from("nail_inspo_images")
    .insert({
      user_id: user.id,
      booking_id: bookingId,
      image_url: validated.image_url,
      notes: validated.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ image }, { status: 201 });
}
