import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, reportSubmitSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// POST /api/reports: any authenticated, non-banned user files a content report
// (target_type: salon, review, or user). Feeds the admin queue at
// GET/PATCH /api/admin/reports (app/api/admin/reports/**), triaged against
// lib/content-reports.ts's status/reason/target-type taxonomy.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(reportSubmitSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    target_type: validated.targetType,
    target_id: validated.targetId,
    reason: validated.reason,
    details: validated.details,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
