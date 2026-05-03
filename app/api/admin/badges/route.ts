export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

const badgeCreateSchema = z.object({
  name_de: z.string().min(1).max(100),
  name_en: z.string().min(1).max(100),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  bg_color: z.string().max(50).optional(),
});

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

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(badgeCreateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { name_de, name_en, icon, color, bg_color } = validated;

  const admin = createAdminSupabaseClient();
  const { data: badge, error } = await admin
    .from("salon_badges")
    .insert({
      name_de,
      name_en,
      icon: icon ?? "Star",
      color: color ?? "#1B4D1B",
      bg_color: bg_color ?? "rgba(27, 77, 27,0.1)",
      is_system: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ badge });
}
