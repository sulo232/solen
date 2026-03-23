export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  
  if (!user) return NextResponse.json({ eligible: false, booking_id: null });

  const url = new URL(request.url);
  const salon_id = url.searchParams.get("salon_id");
  if (!salon_id) return NextResponse.json({ eligible: false, booking_id: null });

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("salon_id", salon_id)
    .eq("status", "completed")
    .not("id", "in", `(SELECT booking_id FROM reviews WHERE booking_id IS NOT NULL)`)
    .limit(1)
    .maybeSingle();

  if (booking) {
    return NextResponse.json({ eligible: true, booking_id: booking.id });
  }

  return NextResponse.json({ eligible: false, booking_id: null });
}
