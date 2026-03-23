export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { headers } from "next/headers";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("salons")
    .select("quartier")
    .eq("is_active", true);

  if (error || !data) return NextResponse.json({ items: [] });
  
  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.quartier) {
      counts[row.quartier] = (counts[row.quartier] || 0) + 1;
    }
  }

  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([quartier, count]) => ({ quartier, count }));

  return NextResponse.json({ items });
}
