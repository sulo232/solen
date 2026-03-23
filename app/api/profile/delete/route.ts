export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Block deletion if user owns salons with active bookings
  const { data: ownedSalons } = await admin
    .from("salons")
    .select("id, name")
    .eq("owner_id", user.id);

  if (ownedSalons && ownedSalons.length > 0) {
    const salonIds = ownedSalons.map((s) => s.id);
    const { count } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("salon_id", salonIds)
      .in("status", ["confirmed", "pending"]);

    if (count && count > 0) {
      return NextResponse.json({
        message: "Cannot delete account while your salon has active bookings. Please cancel or complete them first.",
        code: "ACTIVE_BOOKINGS",
      }, { status: 400 });
    }
  }

  // 1. Set deletion_requested_at and suspend account so they are effectively deactivated
  const { error: updateError } = await admin
    .from("profiles")
    .update({ 
      deletion_requested_at: new Date().toISOString(),
      account_status: "suspended"
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({
      message: "Failed to request account deletion. Please contact support.",
      code: "UPDATE_FAILED",
    }, { status: 500 });
  }

  // Generate an audit log entry for the request
  await logAuditEvent(req, user.id, "account.delete_requested", "user", user.id, { email: user.email });

  return NextResponse.json({ message: "Account deletion requested successfully. It will be permanently deleted in 30 days." });
}
