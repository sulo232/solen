import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/bookings/[id]
 * Returns a single booking. Auth required (must be booking owner or salon owner).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*, owner_id), services(*), staff_members(*), availability_slots(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Authorization check
  const isOwner = booking.user_id === user.id;
  const isSalonOwner = (booking.salons as { owner_id: string })?.owner_id === user.id;

  if (!isOwner && !isSalonOwner) {
    return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json(booking);
}
