export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/admin/segments — list all segments with member counts
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: segments } = await admin.from("customer_segments").select("*").order("created_at");

  // Get member counts
  const enriched = [];
  for (const seg of segments ?? []) {
    const { count } = await admin
      .from("customer_segment_members")
      .select("user_id", { count: "exact", head: true })
      .eq("segment_id", seg.id);
    enriched.push({ ...seg, member_count: count ?? 0 });
  }

  return NextResponse.json({ segments: enriched });
}
