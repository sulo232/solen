import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";
import { validateBody } from "@/lib/validations";

const schema = z.object({
  item_id: z.string().uuid(),
  type: z.enum(["view", "click", "scroll_past", "share"]),
  duration_ms: z.number().int().min(0).max(300000).optional(),
});

// Fire-and-forget interaction logging — no auth required (anonymous ok)
export async function POST(req: NextRequest) {
  // Anonymous access stays allowed (view tracking is legitimately anon), but bounded:
  // this insert fires a trigger that unconditionally increments discovery_items.view_count,
  // so an unthrottled caller could inflate any item's counts unboundedly.
  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(schema, body);
  if (error) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Fire-and-forget. Two prior bugs kept discovery_interactions empty (task #9): (1) the column is `action`, not
  // `interaction_type` (phantom column), and (2) RLS only grants INSERT to `authenticated` for their own row, so
  // the session/anon client hit "permission denied". Telemetry logs via the ADMIN client (same pattern as the
  // search-event logging in the feed route) so anonymous views are captured too. user_id stays null when logged out.
  createAdminSupabaseClient().from("discovery_interactions").insert({
    item_id: data.item_id,
    user_id: userId,
    action: data.type,
    duration_ms: data.duration_ms,
  }).then(({ error: insErr }) => { if (insErr) console.error("[discovery/interactions] insert failed:", insErr); });

  return NextResponse.json({ ok: true });
}
