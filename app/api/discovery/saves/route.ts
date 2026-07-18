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

  // GAP #56: ids-only mode for feed heart-state hydration. Returns ALL of the user's saved
  // item_ids (no 60-cap, no item fetch), so a returning signed-in user sees their real saved
  // hearts on load instead of empty ones until they interact this session. Signed-out -> empty,
  // and the query is scoped to this user's own rows, so it can never leak another user's saves.
  if (req.nextUrl.searchParams.get("ids")) {
    if (!user) return NextResponse.json({ ids: [] });
    const { data: idRows } = await supabase
      .from("discovery_saves")
      .select("item_id")
      .eq("user_id", user.id);
    const ids = (idRows ?? []).map((r) => r.item_id).filter((v): v is string => v !== null);
    return NextResponse.json({ ids });
  }

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

  const itemIds = saves.map((s) => s.item_id).filter((v): v is string => v !== null);

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
