export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/admin/badges — public list of all badge definitions
export async function GET() {
  const admin = createAdminSupabaseClient();
  const { data: badges, error } = await admin
    .from("salon_badges")
    .select("*")
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ badges: badges ?? [] });
}

// POST /api/admin/badges — admin only, create custom badge
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name_de, name_en, icon, color, bg_color } = await req.json();
  if (!name_de || !name_en) {
    return NextResponse.json({ error: "name_de and name_en required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: badge, error } = await admin
    .from("salon_badges")
    .insert({
      name_de,
      name_en,
      icon: icon ?? "Star",
      color: color ?? "#E8624A",
      bg_color: bg_color ?? "rgba(232,98,74,0.1)",
      is_system: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ badge });
}
