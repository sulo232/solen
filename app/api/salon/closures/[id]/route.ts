export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify the closure belongs to the authenticated owner's salon
    const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");

    if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

    const { error } = await supabase
      .from("salon_closures")
      .delete()
      .eq("id", id)
      .eq("salon_id", salon.id);

    if (error) throw error;
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/salon/closures/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
