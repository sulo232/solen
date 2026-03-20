import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("discovery_items")
    .select("style_name")
    .eq("status", "published")
    .eq("is_active", true)
    .not("style_name", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count distinct style names
  const counts = new Map<string, number>();
  (data ?? []).forEach((row: { style_name: string }) => {
    const name = row.style_name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  const styles = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return NextResponse.json({ styles });
}
