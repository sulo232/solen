// exists-check: net-new route (npm run exists "admin/reports" -> 0 matches before this
// feature). Mirrors the S6 admin-update pattern of app/api/admin/reviews/[id]/route.ts
// (inline getUser + profiles.role check, service-role client for the write, Zod via
// lib/validations.ts, logAuditEvent). hide_content reuses the exact reviews.is_hidden /
// reviews.moderation_status fields that route already writes, per the build brief:
// "the reviews table already has is_hidden / moderation_status, use them, do not invent
// a parallel flag."
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { validateBody, adminReportActionSchema } from "@/lib/validations";
import { isLegalReportStatusTransition, type ReportStatus } from "@/lib/content-reports";
import { logAuditEvent } from "@/lib/audit";
import type { Database } from "@/lib/database.types";

/**
 * PATCH /api/admin/reports/[id]: admin only. Body (all optional, at least one required):
 *   - status: a legal REPORT_STATUSES transition from the report's current status
 *     (lib/content-reports.ts, isLegalReportStatusTransition).
 *   - admin_notes: free-text triage note.
 *   - hide_content: true. Only legal when the report's target_type is "review". Writes
 *     reviews.is_hidden=true + reviews.moderation_status="removed" for the reported
 *     review FIRST; if that write fails, the request 500s and content_reports is left
 *     untouched, so a failed content action can never show as a "resolved" report.
 *     Implies status="action_taken" unless the caller explicitly passes a different
 *     status.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminReportActionSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  if (validated.status === undefined && validated.admin_notes === undefined && validated.hide_content === undefined) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: report, error: fetchError } = await admin
    .from("content_reports")
    .select("id, status, target_type, target_id")
    .eq("id", id)
    .single();
  if (fetchError || !report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const currentStatus = (report.status ?? "pending") as ReportStatus;
  // hide_content is a real content action, so it implies the report is "action_taken"
  // unless the caller explicitly asked for a different status.
  const nextStatus: ReportStatus | undefined =
    validated.status ?? (validated.hide_content ? "action_taken" : undefined);

  if (nextStatus && !isLegalReportStatusTransition(currentStatus, nextStatus)) {
    return NextResponse.json(
      { error: `Illegal status transition: ${currentStatus} -> ${nextStatus}` },
      { status: 400 }
    );
  }

  if (validated.hide_content) {
    if (report.target_type !== "review") {
      return NextResponse.json({ error: "hide_content only applies to a reported review" }, { status: 400 });
    }
    // The real content action runs BEFORE the content_reports row is updated: if hiding
    // the review fails, the report must stay exactly as it was, not flip to "resolved"
    // on a content action that never actually happened.
    const { error: hideError } = await admin
      .from("reviews")
      .update({ is_hidden: true, moderation_status: "removed" })
      .eq("id", report.target_id);
    if (hideError) return NextResponse.json({ error: hideError.message }, { status: 500 });
  }

  const updates: Database["public"]["Tables"]["content_reports"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (nextStatus !== undefined) updates.status = nextStatus;
  if (validated.admin_notes !== undefined) updates.admin_notes = validated.admin_notes;

  const { error: updateError } = await admin.from("content_reports").update(updates).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await logAuditEvent(req, user.id, "content_report.update", "content_reports", id, {
    from_status: currentStatus,
    to_status: nextStatus ?? currentStatus,
    hide_content: validated.hide_content ?? false,
    target_type: report.target_type,
    target_id: report.target_id,
  });

  return NextResponse.json({ ok: true });
}
