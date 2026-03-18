import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/admin/segments/[id]/members — list members of a segment
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: memberships } = await admin
    .from("customer_segment_members")
    .select("user_id, computed_at, profiles!user_id(display_name)")
    .eq("segment_id", id)
    .order("computed_at", { ascending: false })
    .limit(50);

  const members = (memberships ?? []).map((m) => ({
    user_id: m.user_id,
    display_name: (m.profiles as unknown as { display_name: string | null })?.display_name ?? null,
    computed_at: m.computed_at,
  }));

  return NextResponse.json({ members });
}
