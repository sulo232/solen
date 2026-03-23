export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find user's salon
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", session.user.id)
    .single();

  if (!salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  // Fetch all payouts for this salon
  const { data: payouts, error } = await supabase
    .from("salon_payouts")
    .select("*, bookings(starts_at, user_id)")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payoutsList = payouts ?? [];
  const total_earnings = payoutsList.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.net_amount), 0);
  const pending_balance = payoutsList.filter(p => p.status === "recorded" || p.status === "pending").reduce((sum, p) => sum + Number(p.net_amount), 0);
  
  return NextResponse.json({
    total_earnings,
    pending_balance,
    payouts: payoutsList
  });
}
