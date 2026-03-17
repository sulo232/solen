import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  // Get email BEFORE deletion for the audit log
  const userEmail = user.email ?? "unknown";

  const tablesCleared: string[] = [];

  // 1. Cancel active bookings as customer
  const { count: cancelledCount } = await admin
    .from("bookings")
    .update({ status: "cancelled", cancel_reason: "Account deleted" })
    .eq("user_id", user.id)
    .in("status", ["confirmed", "pending"])
    .select("id", { count: "exact", head: true });
  if (cancelledCount) tablesCleared.push(`bookings (${cancelledCount} cancelled)`);

  // 2. Delete conversations (cascade deletes messages)
  const { count: convoCount } = await admin
    .from("conversations")
    .delete()
    .eq("customer_id", user.id)
    .select("id", { count: "exact", head: true });
  if (convoCount) tablesCleared.push(`conversations (${convoCount} deleted)`);

  // 3. Anonymize reviews (keep content, remove user link)
  const { count: reviewCount } = await admin
    .from("reviews")
    .update({ user_id: null })
    .eq("user_id", user.id)
    .select("id", { count: "exact", head: true });
  if (reviewCount) tablesCleared.push(`reviews (${reviewCount} anonymized)`);

  // 4. Log deletion BEFORE deleting auth user (preserves email)
  await admin.from("data_deletion_log").insert({
    user_email: userEmail,
    completed_at: new Date().toISOString(),
    tables_cleared: tablesCleared,
  });

  // Audit log
  await logAuditEvent(req, user.id, "account.delete", "user", user.id, { email: userEmail, tables_cleared: tablesCleared });

  // 5. Delete profile (cascade handles related records)
  await admin.from("profiles").delete().eq("id", user.id);

  // 6. Delete auth user
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    return NextResponse.json({
      message: "Account data cleared but auth deletion failed. Contact support.",
      code: "PARTIAL_DELETE",
    }, { status: 500 });
  }

  return NextResponse.json({ message: "Account deleted successfully" });
}
