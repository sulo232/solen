export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody } from "@/lib/validations";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";
import type { Database } from "@/lib/database.types";

const adminUserPatchSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["customer", "salon_owner", "admin"]).optional(),
  is_suspended: z.boolean().optional(),
});

// GET /api/admin/users — admin-only list of all profiles with auth email
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, role, onboarding_completed, avatar_url, created_at, is_suspended")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with auth emails
  const enriched = await Promise.all((profiles ?? []).map(async (p) => {
    const { data: authUser } = await admin.auth.admin.getUserById(p.id);
    return { ...p, email: authUser?.user?.email ?? null };
  }));

  return NextResponse.json({ users: enriched });
}

// PATCH /api/admin/users — admin-only: update role or suspension
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminUserPatchSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { user_id, role, is_suspended } = validated;

  const admin = createAdminSupabaseClient();
  const updates: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (role !== undefined) updates.role = role;
  if (is_suspended !== undefined) updates.is_suspended = is_suspended;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  // Read the pre-change values so the audit trail below can record old -> new,
  // not just the new state (_backend-system/LAW.md section 14).
  const { data: before } = await admin
    .from("profiles").select("role, is_suspended").eq("id", user_id).single();

  const { error } = await admin.from("profiles").update(updates).eq("id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Role changes and suspensions are the two levers an admin has over another
  // account; both are logged so a promotion/demotion/suspension is always
  // attributable to an actor, a time, and an old -> new value (audit finding #9).
  if (role !== undefined) {
    await logAuditEvent(req, user.id, "user.role_change", "user", user_id, {
      from: before?.role ?? null,
      to: role,
    });
  }
  if (is_suspended !== undefined) {
    await logAuditEvent(req, user.id, is_suspended ? "user.suspend" : "user.unsuspend", "user", user_id, {
      from: before?.is_suspended ?? null,
      to: is_suspended,
    });
  }

  return NextResponse.json({ ok: true });
}
