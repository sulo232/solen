export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find user's salon
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "finance");

  if (!salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  // P9-2 (2026-09-05): salon_payouts_owner_select (supabase/migrations/
  // 20260601132922_salon_payouts.sql:40) is owner-only RLS, so a staff member
  // granted "finance" by the gate above would still read an empty payouts
  // list through the session client. Admin client, scoped to the same gated
  // salon.id, so a staff caller sees the same earnings an owner does.
  //
  // Explicit column list (not `select("*")`) per the sensitive-table select
  // gate: these are exactly the columns salon_payouts carries.
  const admin = createAdminSupabaseClient();
  const { data: payouts, error } = await admin
    .from("salon_payouts")
    .select("id, booking_id, salon_id, stripe_payment_intent_id, gross_amount, commission_percent, commission_amount, net_amount, status, created_at, bookings(starts_at, user_id)")
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
