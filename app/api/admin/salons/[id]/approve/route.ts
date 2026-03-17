import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, salonApproved } from "@/lib/email";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  const { data: salon, error: fetchErr } = await admin
    .from("salons").select("name, owner_id").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const { error } = await admin.from("salons").update({
    is_active: true,
    approved_at: new Date().toISOString(),
    approved_by: user.id,
    rejection_reason: null,
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send approval email to salon owner
  const { data: ownerAuth } = await admin.auth.admin.getUserById(salon.owner_id);
  if (ownerAuth?.user?.email) {
    await sendEmail(salonApproved(ownerAuth.user.email, { salon: salon.name }));
  }

  return NextResponse.json({ ok: true });
}
