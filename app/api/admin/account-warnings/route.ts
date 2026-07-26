// exists-check: net-new route (npm run exists "account-warnings" -> 1 hit, the
// account_warnings TABLE only, 0 rows, no reader anywhere in app/ or lib/). This
// is the reader lib/strikes.ts has never had: ToS 3.3 (3+ salon cancellations in
// 30 days) and 4.4 (3/5 customer no-shows in 6 months) insert into this table
// (lib/strikes.ts:41, 77, 84) but nothing surfaced the rows, so the admin could
// never act on a strike. Mirrors the S6 admin-list pattern of
// app/api/admin/reports/route.ts and app/api/admin/booking-disputes/route.ts
// (inline getUser + profiles.role check, admin client, batched name lookups
// instead of a broken embedded join since salon_id/user_id are polymorphic-ish
// nullable FKs, only one of the two set per row).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

const ALLOWED_SEVERITIES = new Set(["strike", "warning", "suspension"]);

/**
 * GET /api/admin/account-warnings?severity=suspension&page=1
 * Admin-only. Lists account_warnings rows (ToS 3.3 salon strikes + ToS 4.4
 * customer no-show warnings/suspensions), newest first, paginated (page size
 * 20). Optional `severity` filter (strike | warning | suspension). Each row is
 * enriched with the salon name or the user's display name, whichever side of
 * the row is set.
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

  const admin = createAdminSupabaseClient();

  const { searchParams } = new URL(req.url);
  const severityParam = searchParams.get("severity");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = admin
    .from("account_warnings")
    .select("id, salon_id, user_id, reason, severity, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (severityParam && ALLOWED_SEVERITIES.has(severityParam.trim())) {
    query = query.eq("severity", severityParam.trim());
  }

  const { data: warnings, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // salon_id / user_id are each nullable, exactly one is set per row (see
  // lib/strikes.ts). Batch both lookups instead of one query per row.
  const salonIds = Array.from(new Set((warnings ?? []).map((w) => w.salon_id).filter(Boolean) as string[]));
  const userIds = Array.from(new Set((warnings ?? []).map((w) => w.user_id).filter(Boolean) as string[]));

  const salonNameById = new Map<string, string>();
  if (salonIds.length > 0) {
    const { data: salons } = await admin.from("salons").select("id, name").in("id", salonIds);
    for (const s of salons ?? []) salonNameById.set(s.id, s.name);
  }

  const userNameById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, display_name").in("id", userIds);
    for (const p of profiles ?? []) if (p.display_name) userNameById.set(p.id, p.display_name);
  }

  const rows = (warnings ?? []).map((w) => ({
    ...w,
    salon_name: w.salon_id ? salonNameById.get(w.salon_id) ?? null : null,
    user_name: w.user_id ? userNameById.get(w.user_id) ?? null : null,
  }));

  return NextResponse.json({ warnings: rows, page, limit, total: count ?? 0 });
}
