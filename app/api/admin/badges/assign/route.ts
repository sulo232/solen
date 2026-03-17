import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// POST /api/admin/badges/assign — admin only, assign/remove badge from salon
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { salon_id, badge_id, action } = await req.json();
  if (!salon_id || !badge_id || !action) {
    return NextResponse.json({ error: "salon_id, badge_id, and action required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  if (action === "assign") {
    const { error } = await admin.from("salon_badge_assignments").upsert({
      salon_id,
      badge_id,
      assigned_by: user.id,
      is_override_removal: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "remove") {
    const { error } = await admin
      .from("salon_badge_assignments")
      .delete()
      .eq("salon_id", salon_id)
      .eq("badge_id", badge_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "override_removal") {
    const { error } = await admin.from("salon_badge_assignments").upsert({
      salon_id,
      badge_id,
      assigned_by: user.id,
      is_override_removal: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
