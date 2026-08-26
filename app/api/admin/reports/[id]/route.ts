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
import { removeObjectForUrl } from "@/lib/storage";
import { alertAdmin } from "@/lib/alert-admin";
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
    // The real content action ALWAYS runs BEFORE the content_reports row is updated: if the
    // takedown fails, the report must stay exactly as it was, not flip to "resolved" on a
    // content action that never actually happened.
    if (report.target_type === "review") {
      const { error: hideError } = await admin
        .from("reviews")
        .update({ is_hidden: true, moderation_status: "removed" })
        .eq("id", report.target_id);
      if (hideError) return NextResponse.json({ error: hideError.message }, { status: 500 });
    } else if (report.target_type === "photo") {
      // 2026-07-27, added with the 'photo' report target. A salon gallery photo lives in TWO
      // places and removing it from one leaves it rendering from the other , that dual source
      // is the single biggest trap in this area. salon_portfolio_images backs the gallery grid;
      // salons.gallery_urls backs the hero, the search cards and the profile surfaces.
      const { data: photoRow, error: photoErr } = await admin
        .from("salon_portfolio_images")
        .select("salon_id, image_url")
        .eq("id", report.target_id)
        .maybeSingle();
      if (photoErr) return NextResponse.json({ error: photoErr.message }, { status: 500 });
      if (!photoRow) {
        return NextResponse.json({ error: "Reported photo no longer exists" }, { status: 404 });
      }

      // The takedown's whole point is the bytes disappearing, not just the row: a reported
      // photo that stays reachable at its old public "salon-gallery" URL is a takedown that
      // did not take down. Remove the object BEFORE the row delete below so image_url is
      // still available if the removal needs retrying. Storage failure here is not fatal to
      // the request (the row delete below still runs, so the grid entry is gone either way),
      // but it IS the point of an admin takedown, so it must reach a human, same discipline
      // the money paths use, not just a log line.
      const { error: storageError } = await removeObjectForUrl(
        admin, photoRow.image_url, "salon-gallery", photoRow.salon_id, "[admin/reports]",
      );
      if (storageError) {
        void alertAdmin("Admin photo takedown: storage removal failed", {
          report_id: id,
          salon_id: photoRow.salon_id,
          image_url: photoRow.image_url,
          error: storageError,
        });
      }

      const { error: delErr } = await admin
        .from("salon_portfolio_images")
        .delete()
        .eq("id", report.target_id);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

      const { data: salonRow } = await admin
        .from("salons").select("gallery_urls").eq("id", photoRow.salon_id).maybeSingle();
      const remaining = (salonRow?.gallery_urls ?? []).filter((u: string) => u !== photoRow.image_url);
      if ((salonRow?.gallery_urls ?? []).length !== remaining.length) {
        const { error: galErr } = await admin
          .from("salons").update({ gallery_urls: remaining }).eq("id", photoRow.salon_id);
        // Logged, not fatal: the grid row is already gone, so the takedown partly succeeded and
        // reverting it would be worse than reporting the leftover.
        if (galErr) console.error("[admin/reports] gallery_urls prune failed:", galErr, { salonId: photoRow.salon_id });
      }

      await logAuditEvent(req, user.id, "salon.photo.takedown", "salon", photoRow.salon_id, {
        via: "content_report", report_id: id, image_url: photoRow.image_url,
      });
    } else {
      return NextResponse.json(
        { error: `hide_content does not apply to a reported ${report.target_type}` },
        { status: 400 },
      );
    }
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
