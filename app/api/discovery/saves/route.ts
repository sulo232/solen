import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { DISCOVERY_ITEM_PUBLIC_COLS } from "@/lib/discovery/public-columns";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ items: [] });

  // Default 3 (the ForYouSection peek); the Gespeichert page asks for up to 60 to show the full saved grid.
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "3", 10), 60);

  // Get user's most recent saved item IDs
  const { data: saves } = await supabase
    .from("discovery_saves")
    .select("item_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!saves || saves.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const itemIds = saves.map((s) => s.item_id);

  // Fetch the full items. Explicit anon-safe column allowlist (shared with
  // discovery/similar), not select("*"): excludes flag_reason (moderation
  // note) and owner_user_id/owner_salon_id (uploader FK).
  const { data: items } = await supabase
    .from("discovery_items")
    .select(DISCOVERY_ITEM_PUBLIC_COLS)
    .in("id", itemIds)
    .eq("status", "published")
    .eq("is_active", true);

  return NextResponse.json({ items: items ?? [] });
}
