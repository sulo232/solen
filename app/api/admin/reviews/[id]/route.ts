export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { validateBody, adminReviewActionSchema } from "@/lib/validations";

// PATCH /api/admin/reviews/[id] — admin only, update moderation fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminReviewActionSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (validated.moderation_status !== undefined) {
    updates.moderation_status = validated.moderation_status;
    updates.is_hidden = validated.moderation_status === "removed";
    if (validated.moderation_status === "active") {
      updates.is_flagged = false; // clear flag when approved
    }
  }
  if (validated.removal_reason !== undefined) {
    updates.removal_reason = validated.removal_reason;
  }
  if (validated.admin_response !== undefined) {
    updates.admin_response = validated.admin_response;
    updates.admin_response_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("reviews").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/reviews/[id] — admin only, permanently delete
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const disabled2 = await checkFeatureEnabled("reviews");
  if (disabled2) return disabled2;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited2 = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited2) return rateLimited2;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
