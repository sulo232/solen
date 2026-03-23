export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

const badgeAssignSchema = z.object({
  salon_id: z.string().uuid(),
  badge_id: z.string().uuid(),
  action: z.enum(["assign", "remove", "override_removal"]),
});

// POST /api/admin/badges/assign — admin only, assign/remove badge from salon
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(badgeAssignSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { salon_id, badge_id, action } = validated;

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
