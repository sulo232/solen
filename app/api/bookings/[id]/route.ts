export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { validateBody, bookingPatchSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*), services(*), staff_members(*), availability_slots(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Auth check: must be booking owner or salon owner
  const isOwner = booking.user_id === user.id;
  const { data: salon } = await supabase.from("salons").select("owner_id").eq("id", booking.salon_id).single();
  const isSalonOwner = salon?.owner_id === user.id;

  if (!isOwner && !isSalonOwner) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  return NextResponse.json({ data: booking });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const { data: validated, error: valError } = validateBody(bookingPatchSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { status } = validated;

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, salon_id, user_id, status")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });

  const { data: salon } = await supabase.from("salons").select("owner_id").eq("id", booking.salon_id).single();
  
  if (salon?.owner_id !== user.id) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const updates: any = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const { error: updateErr } = await supabase.from("bookings").update(updates).eq("id", id);
  if (updateErr) return NextResponse.json({ message: updateErr.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data: { success: true } });
}
