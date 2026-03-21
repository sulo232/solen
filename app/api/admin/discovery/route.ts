import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const status = req.nextUrl.searchParams.get("status") ?? "published";
  const category = req.nextUrl.searchParams.get("category");
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 50;

  let query = admin.from("discovery_items").select("*", { count: "exact" })
    .eq("status", status)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data, total: count ?? 0, page, limit });
}

export async function PATCH(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(discoveryAdminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("discovery_items").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(discoveryAdminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("discovery_items").update({ status: "archived", is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(req, user.id, "discovery.archive", "item", id);
  return NextResponse.json({ success: true });
}
