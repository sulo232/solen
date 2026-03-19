export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

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
