export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";

// POST /api/packages/redeem — Redeem a session from a purchased package
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json();
  const { purchase_id, booking_id } = body;

  if (!purchase_id) return NextResponse.json({ error: "purchase_id required" }, { status: 400 });

  // Get purchase and verify ownership + remaining sessions
  const { data: purchase } = await supabase
    .from("package_purchases")
    .select("*")
    .eq("id", purchase_id)
    .eq("user_id", user.id)
    .single();

  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  // Check expiry
  if (purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
    return NextResponse.json({ error: "Package has expired" }, { status: 410 });
  }

  // Check remaining sessions
  if (purchase.sessions_used >= purchase.sessions_total) {
    return NextResponse.json({ error: "No sessions remaining" }, { status: 400 });
  }

  // Increment sessions_used
  const { error } = await supabase
    .from("package_purchases")
    .update({ sessions_used: purchase.sessions_used + 1 })
    .eq("id", purchase_id)
    .eq("sessions_used", purchase.sessions_used); // optimistic lock

  if (error) return NextResponse.json({ error: "Failed to redeem — try again" }, { status: 409 });

  // If booking_id provided, mark the booking as paid via package
  if (booking_id) {
    await supabase
      .from("bookings")
      .update({ payment_status: "paid", paid_via: "package" })
      .eq("id", booking_id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({
    data: {
      sessions_remaining: purchase.sessions_total - purchase.sessions_used - 1,
      sessions_total: purchase.sessions_total,
    },
  });
}
