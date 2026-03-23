import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryLikeLimiter } from "@/lib/ratelimit";
import { z } from "zod";
import { validateBody } from "@/lib/validations";

const syncSchema = z.object({
  item_ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(discoveryLikeLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(syncSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Get existing saves to deduplicate
  const { data: existing } = await supabase
    .from("discovery_saves")
    .select("item_id")
    .eq("user_id", user.id)
    .in("item_id", data.item_ids);

  const existingIds = new Set((existing ?? []).map((s) => s.item_id));
  const newIds = data.item_ids.filter((id) => !existingIds.has(id));

  if (newIds.length > 0) {
    const rows = newIds.map((item_id) => ({ user_id: user.id, item_id }));
    const { error: insertError } = await supabase.from("discovery_saves").insert(rows);
    if (insertError) {
      console.error("[discovery/save/sync] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to sync saves" }, { status: 500 });
    }
  }

  return NextResponse.json({ synced: newIds.length, total: data.item_ids.length });
}
