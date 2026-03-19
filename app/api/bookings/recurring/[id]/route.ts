export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: rule } = await supabase
    .from("recurring_booking_rules")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!rule || rule.user_id !== user.id) {
    return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Deactivate rule — keep existing bookings intact
  const { error } = await supabase
    .from("recurring_booking_rules")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data: { id, is_active: false } });
}
