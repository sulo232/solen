import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryLikeLimiter } from "@/lib/ratelimit";
import { validateBody, discoverySaveSchema } from "@/lib/validations";

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
  const { data, error } = validateBody(discoverySaveSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Use RPC for atomic toggle
  const { data: result, error: rpcError } = await supabase.rpc("toggle_discovery_save", {
    p_item_id: data.item_id,
  });

  if (rpcError) {
    console.error("[discovery/save] RPC error:", rpcError);
    return NextResponse.json({ error: "Failed to toggle save" }, { status: 500 });
  }

  return NextResponse.json({ saved: result === true || result === "saved" });
}
