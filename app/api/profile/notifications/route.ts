export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

/**
 * CUSTOMER notifications (audit gap #4) — the READ side of the long-existing write path
 * (lib/notifications.ts sendNotification() inserts rows for 22 event types).
 * Lives under /api/profile/* because /api/notifications is the OWNER dashboard's
 * synthetic feed (dashboard NotificationCenter) — different audience, don't mix.
 * RLS on public.notifications already scopes select/update to auth.uid() = user_id.
 *
 *   GET   → { items: latest 50, unread }
 *   PATCH → { all: true } or { ids: [...] } → read = true
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const [listRes, unreadRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, data, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ]);

  if (listRes.error) {
    console.error("[profile/notifications] list failed:", listRes.error.message);
    return NextResponse.json({ message: listRes.error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ items: listRes.data ?? [], unread: unreadRes.count ?? 0 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  let query = supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
  if (body?.all === true) {
    query = query.eq("read", false);
  } else if (Array.isArray(body?.ids) && body.ids.length > 0 && body.ids.length <= 100) {
    query = query.in("id", body.ids.map(String));
  } else {
    return NextResponse.json({ message: "Provide ids[] or all:true", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { error } = await query;
  if (error) {
    console.error("[profile/notifications] mark-read failed:", error.message);
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
