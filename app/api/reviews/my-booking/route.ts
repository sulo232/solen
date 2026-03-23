export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const salon_id = req.nextUrl.searchParams.get("salon_id");
  if (!salon_id) return NextResponse.json({ error: "Missing salon_id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) return NextResponse.json({ booking: null });

  // Find completed bookings for this user+salon combo
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("salon_id", salon_id)
    .eq("status", "completed")
    .order("starts_at", { ascending: false });

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ booking: null });
  }

  // Check which bookings already have a review
  const bookingIds = bookings.map(b => b.id);
  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("booking_id")
    .in("booking_id", bookingIds);

  const reviewedIds = new Set((existingReviews || []).map(r => r.booking_id));
  const unreviewedBooking = bookings.find(b => !reviewedIds.has(b.id));

  if (unreviewedBooking) {
    return NextResponse.json({ booking: { id: unreviewedBooking.id } });
  }

  return NextResponse.json({ booking: null });
}
