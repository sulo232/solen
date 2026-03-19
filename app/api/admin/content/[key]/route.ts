export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// PUT /api/admin/content/[key] — admin only, update content
export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  if (body.value_de !== undefined) updates.value_de = body.value_de;
  if (body.value_en !== undefined) updates.value_en = body.value_en;
  if (body.value_fr !== undefined) updates.value_fr = body.value_fr;
  if (body.auto_override !== undefined) updates.auto_override = body.auto_override;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("site_content").update(updates).eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
