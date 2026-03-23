import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const { targetType, targetId, reason, details } = body;

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const allowedReasons = ['inappropriate', 'spam', 'fake', 'ip_violation', 'other'];
  if (!allowedReasons.includes(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ ok: true });
}
