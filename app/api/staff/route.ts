import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salon_id");
    if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("staff_members")
      .select("id, name, avatar_url, specialties, is_active")
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return NextResponse.json({ staff: data ?? [] });
  } catch (err) {
    console.error("GET /api/staff error:", err);
    return NextResponse.json({ error: "Internal Server Error", staff: [] }, { status: 500 });
  }
}
