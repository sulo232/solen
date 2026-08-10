// exists-check: net-new route (npm run exists "admin/reports" -> 0 matches). Extends the
// already-existing content_reports table (supabase/migrations/078_content_reports.sql,
// written by app/api/reports/route.ts) and mirrors the S6 admin-list pattern of
// app/api/admin/reviews/route.ts (inline getUser + profiles.role check) and the
// page/limit/total pagination shape of app/api/reviews/salon/[salon_id]/route.ts.
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { REPORT_STATUSES, REPORT_TARGET_TYPES } from "@/lib/content-reports";

/**
 * GET /api/admin/reports?status=pending&target_type=review&page=1: admin only.
 * Powers app/[locale]/dashboard/reports/page.tsx. Filters by status and/or
 * target_type (both optional), newest first, paginated (page size 20, same
 * page/limit/total shape as app/api/reviews/salon/[salon_id]/route.ts).
 *
 * Each row is enriched with the reporter's display name and a short, human target
 * label: content_reports.target_id is a polymorphic UUID with no single FK, so an
 * admin cannot act on it blind. This batches (at most 3 extra queries total, grouped
 * by target_type, never one query per row) a lookup into reviews/salons/profiles.
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const targetTypeParam = searchParams.get("target_type");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminSupabaseClient();

  // trust-06: harassment/safety reports (ToS section 7.3 "zero tolerance ... immediate
  // account suspension") must surface first, not wait behind ordinary billing/quality
  // complaints in created_at order. PostgREST has no CASE-ordering via supabase-js, so
  // this pulls a buffer well above any realistic queue size at this scale (content_reports
  // has 0 rows live as of 2026-07-27), priority-sorts in application code, then paginates.
  const PRIORITY_BUFFER = 200;
  let query = admin
    .from("content_reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, status, admin_notes, created_at, updated_at, profiles!reporter_id(display_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(0, PRIORITY_BUFFER - 1);

  if (statusParam && (REPORT_STATUSES as readonly string[]).includes(statusParam)) {
    query = query.eq("status", statusParam);
  }
  if (targetTypeParam && (REPORT_TARGET_TYPES as readonly string[]).includes(targetTypeParam)) {
    query = query.eq("target_type", targetTypeParam);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sortedRows = ((data ?? []) as unknown as Array<{ reason: string; created_at: string | null }>)
    .slice()
    .sort((a, b) => {
      const aPriority = a.reason === "harassment" ? 0 : 1;
      const bPriority = b.reason === "harassment" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
  const pagedRows = sortedRows.slice(offset, offset + limit);

  const rows = pagedRows as unknown as Array<{
    id: string;
    reporter_id: string | null;
    target_type: string;
    target_id: string;
    reason: string;
    status: string | null;
    admin_notes: string | null;
    created_at: string | null;
    updated_at: string | null;
    profiles: { display_name: string | null } | null;
  }>;

  const reviewIds = rows.filter((r) => r.target_type === "review").map((r) => r.target_id);
  const salonIds = rows.filter((r) => r.target_type === "salon").map((r) => r.target_id);
  const userIds = rows.filter((r) => r.target_type === "user").map((r) => r.target_id);

  const [reviewRows, salonRows, userRows] = await Promise.all([
    reviewIds.length
      ? admin.from("reviews").select("id, rating, comment, is_hidden, moderation_status, salons!salon_id(name)").in("id", reviewIds)
      : Promise.resolve({ data: [] as unknown[] }),
    salonIds.length
      ? admin.from("salons").select("id, name").in("id", salonIds)
      : Promise.resolve({ data: [] as unknown[] }),
    userIds.length
      ? admin.from("profiles").select("id, display_name").in("id", userIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const reviewMap = new Map(
    (reviewRows.data as Array<{ id: string; rating: number; comment: string | null; is_hidden: boolean; moderation_status: string | null; salons: { name: string } | null }>).map((r) => [r.id, r])
  );
  const salonMap = new Map((salonRows.data as Array<{ id: string; name: string }>).map((s) => [s.id, s]));
  const userMap = new Map((userRows.data as Array<{ id: string; display_name: string | null }>).map((u) => [u.id, u]));

  const reports = rows.map((r) => {
    let target: Record<string, unknown> | null = null;
    if (r.target_type === "review") {
      const rev = reviewMap.get(r.target_id);
      target = rev
        ? { salon_name: rev.salons?.name ?? null, rating: rev.rating, comment: rev.comment, is_hidden: rev.is_hidden, moderation_status: rev.moderation_status }
        : null;
    } else if (r.target_type === "salon") {
      const s = salonMap.get(r.target_id);
      target = s ? { name: s.name } : null;
    } else if (r.target_type === "user") {
      const u = userMap.get(r.target_id);
      target = u ? { display_name: u.display_name } : null;
    }
    return {
      id: r.id,
      reporter_id: r.reporter_id,
      reporter_name: r.profiles?.display_name ?? null,
      target_type: r.target_type,
      target_id: r.target_id,
      target,
      reason: r.reason,
      status: r.status,
      admin_notes: r.admin_notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });

  return NextResponse.json({ reports, total: count ?? 0, page, limit });
}
