import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { validateBody } from "@/lib/validations";

const schema = z.object({
  item_id: z.string().uuid(),
  type: z.enum(["view", "click", "scroll_past", "share"]),
  duration_ms: z.number().int().min(0).max(300000).optional(),
});

// Fire-and-forget interaction logging — no auth required (anonymous ok)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = validateBody(schema, body);
  if (error) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  // Fire-and-forget — don't await
  supabase.from("discovery_interactions").insert({
    item_id: data.item_id,
    user_id: userId,
    interaction_type: data.type,
    duration_ms: data.duration_ms,
  }).then(() => {});

  return NextResponse.json({ ok: true });
}
