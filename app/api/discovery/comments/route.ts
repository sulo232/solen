import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryCommentLimiter, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, discoveryCommentSchema } from "@/lib/validations";
import { checkCommentFlags } from "@/lib/content-flags";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("item_id");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  if (!itemId) {
    return NextResponse.json({ error: "item_id required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: comments, error, count } = await supabase
    .from("discovery_comments")
    .select("id, user_id, text, created_at, is_flagged", { count: "exact" })
    .eq("item_id", itemId)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[discovery/comments] GET error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }

  // Fetch user profiles for comment authors
  const userIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  let profiles: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from("public_profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    for (const p of profileData ?? []) {
      profiles[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
    }
  }

  const enriched = (comments ?? []).map((c) => ({
    ...c,
    user: profiles[c.user_id] ?? { display_name: "Anonym", avatar_url: null },
  }));

  return NextResponse.json({
    comments: enriched,
    total: count ?? 0,
    page,
    has_more: (count ?? 0) > page * limit,
  });
}

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(discoveryCommentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(discoveryCommentSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Check for blocked words / spam
  const flags = checkCommentFlags(data.text);

  const { data: comment, error: insertError } = await supabase
    .from("discovery_comments")
    .insert({
      item_id: data.item_id,
      user_id: user.id,
      text: data.text,
      is_flagged: flags.flagged,
    })
    .select("id, user_id, text, created_at, is_flagged")
    .single();

  if (insertError) {
    console.error("[discovery/comments] POST error:", insertError);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }

  return NextResponse.json({ comment, flagged: flags.flagged });
}
