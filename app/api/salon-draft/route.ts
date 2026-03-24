import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { generalLimiter, applyRateLimit, getClientIp } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { z } from "zod";

const MAX_DRAFT_SIZE = 50 * 1024; // 50KB

const putSchema = z.object({
  draft_data: z.record(z.string(), z.unknown()),
  current_step: z.number().int().min(1).max(7),
});

export async function GET(req: NextRequest) {
  // Auth
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit
  const rl = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rl) return rl;

  // Ban check
  const ban = await checkUserBanned(user.id);
  if (ban) return ban;

  const admin = createAdminSupabaseClient();
  const { data: draft } = await admin
    .from("salon_drafts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ draft: draft || null });
}

export async function PUT(req: NextRequest) {
  // Auth
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit
  const rl = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rl) return rl;

  // Ban check
  const ban = await checkUserBanned(user.id);
  if (ban) return ban;

  // Validate body
  const raw = await req.text();
  if (raw.length > MAX_DRAFT_SIZE) {
    return NextResponse.json({ error: "Draft too large (max 50KB)" }, { status: 413 });
  }

  let body: z.infer<typeof putSchema>;
  try {
    body = putSchema.parse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("salon_drafts")
    .upsert(
      {
        user_id: user.id,
        draft_data: body.draft_data,
        current_step: body.current_step,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  // Auth
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  await admin.from("salon_drafts").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
