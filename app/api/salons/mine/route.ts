export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/salons/mine — returns the current user's salon
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, categories")
    .eq("owner_id", user.id)
    .single();

  return NextResponse.json({ salon: salon ?? null });
}

// PATCH /api/salons/mine — update about_text fields
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updateFields: Record<string, unknown> = {};
  if (typeof body.about_text_de === "string") updateFields.about_text_de = body.about_text_de;
  if (typeof body.about_text_en === "string") updateFields.about_text_en = body.about_text_en;
  if (typeof body.about_text_fr === "string") updateFields.about_text_fr = body.about_text_fr;
  if (typeof body.about_text_it === "string") updateFields.about_text_it = body.about_text_it;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("salons")
    .update(updateFields)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
