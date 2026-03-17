import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/salons/mine — returns the current user's salon
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .single();

  return NextResponse.json({ salon: salon ?? null });
}
