export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    // P9-2 RLS fix: closures_owner_manage is owner-only, so a granted staff
    // caller past the "settings" gate got a silent no-op delete on the
    // session client. Same admin-client pattern as
    // app/api/salon/closures/route.ts.
    const admin = createAdminSupabaseClient();
    const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id", "settings");

    if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

    const { data: deleted, error } = await admin
      .from("salon_closures")
      .delete()
      .eq("id", id)
      .eq("salon_id", salon.id)
      .select("id");

    if (error) throw error;
    // A wrong id, or one that belongs to a different salon, matches zero
    // rows; .delete() reports success either way, so a real row count is the
    // only way to tell "removed" from "nothing matched".
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/salon/closures/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
