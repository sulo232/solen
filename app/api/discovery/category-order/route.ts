// exists-check: net-new. Returns the Inspo categories ordered by the viewer's CATEGORY affinity (the DNA point
// system, owner 2026-06-23: "if they look at a lot of hair, put hair first"). Reads user_style_affinity rows of
// attr_type='category' (recomputed daily). Logged-out / cold -> empty -> the page keeps its default order.
import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    if (!userId) return NextResponse.json({ order: [] });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("user_style_affinity")
      .select("attr_value, score")
      .eq("user_id", userId)
      .eq("attr_type", "category")
      .order("score", { ascending: false });
    if (error) {
      console.error("[discovery/category-order] query failed:", error.message);
      return NextResponse.json({ order: [] });
    }
    return NextResponse.json({ order: (data ?? []).map((r) => r.attr_value as string) });
  } catch (err) {
    console.error("[discovery/category-order] failed:", err);
    return NextResponse.json({ order: [] });
  }
}
