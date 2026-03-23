import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ items: [] });

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "3", 10), 10);

  // Get user's most recent saved item IDs
  const { data: saves } = await supabase
    .from("discovery_saves")
    .select("item_id")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!saves || saves.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const itemIds = saves.map((s) => s.item_id);

  // Fetch the full items
  const { data: items } = await supabase
    .from("discovery_items")
    .select("*")
    .in("id", itemIds)
    .eq("status", "published")
    .eq("is_active", true);

  return NextResponse.json({ items: items ?? [] });
}
