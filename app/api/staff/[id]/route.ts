export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// PATCH /api/staff/[id] — Update a staff member
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Verify the staff member exists and get salon_id
  const { data: staff } = await admin.from("staff_members").select("id, salon_id").eq("id", id).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", staff.salon_id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Build update object from allowed fields
  const allowedFields = [
    "name", "avatar_url", "specialties", "is_active", "commission_rate",
    "bio_de", "bio_en", "languages", "instagram_url", "years_experience", "permissions",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await admin.from("staff_members").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/staff/[id] — Delete a staff member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  const { data: staff } = await admin.from("staff_members").select("id, salon_id").eq("id", id).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", staff.salon_id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("staff_members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
