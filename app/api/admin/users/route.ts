import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/admin/users — admin-only list of all profiles with auth email
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, role, onboarding_completed, avatar_url, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with auth emails
  const enriched = await Promise.all((profiles ?? []).map(async (p) => {
    const { data: authUser } = await admin.auth.admin.getUserById(p.id);
    return { ...p, email: authUser?.user?.email ?? null };
  }));

  return NextResponse.json({ users: enriched });
}
