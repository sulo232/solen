export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify the closure belongs to the authenticated owner's salon
    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

    const { error } = await supabase
      .from("salon_closures")
      .delete()
      .eq("id", params.id)
      .eq("salon_id", salon.id);

    if (error) throw error;
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/salon/closures/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
