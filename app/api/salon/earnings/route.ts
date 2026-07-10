export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find user's salon
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");

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
  // salon_payouts.status is DB-constrained to 'recorded' | 'transferred' | 'failed'
  // (supabase/migrations/20260601132922_salon_payouts.sql:32). No writer ever sets 'paid'
  // or 'pending' (those values cannot exist in this column), so filtering on them left
  // total_earnings permanently 0. 'transferred' is the real already-paid-out state,
  // 'recorded' is the real still-pending state.
  const total_earnings = payoutsList.filter(p => p.status === "transferred").reduce((sum, p) => sum + Number(p.net_amount), 0);
  const pending_balance = payoutsList.filter(p => p.status === "recorded").reduce((sum, p) => sum + Number(p.net_amount), 0);
  
  return NextResponse.json({
    total_earnings,
    pending_balance,
    payouts: payoutsList
  });
}
