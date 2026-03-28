export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/nail/ai-history?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: history } = await admin
    .from("nail_ai_staging")
    .select("id, image_url, prompt_summary, created_at, is_saved")
    .eq("salon_id", salonId)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);

  return NextResponse.json({ history: history ?? [] });
}

// PATCH /api/dashboard/nail/ai-history — toggle is_saved
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, is_saved } = body as { id: string; is_saved: boolean };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("nail_ai_staging")
    .update({ is_saved })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
