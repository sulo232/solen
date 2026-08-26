export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, staffUpdateSchema } from "@/lib/validations";
import type { Database } from "@/lib/database.types";

// PATCH /api/staff/[id] — Update a staff member
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Verify the staff member exists and get salon_id
  const { data: staff } = await admin.from("staff_members").select("id, salon_id").eq("id", id).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", staff.salon_id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawBody = await req.json().catch(() => ({}));
  const { data: body, error: validationError } = validateBody(staffUpdateSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }

  // Build update object from allowed fields. Phantom-column fix: staff_members has no
  // "bio_de"/"bio_en" columns, only a single non-localized "bio" (confirmed against the live
  // schema and lib/database.types.ts); no caller of this route currently sends either key, so
  // they are dropped from the allowlist rather than guessed at a mapping.
  const allowedFields = [
    "name", "avatar_url", "specialties", "is_active", "commission_rate",
    "languages", "instagram_url", "years_experience", "permissions",
  ] as const;
  const update: Database["public"]["Tables"]["staff_members"]["Update"] = {};
  for (const key of allowedFields) {
    // body is now a validated staffUpdateSchema shape (was an untyped `any` before this
    // fix); the dynamic key assignment across the allowlist union is still safe since
    // every key here is one zod already checked the type of.
    if (key in body) (update as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await admin.from("staff_members").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/staff/[id] — Delete a staff member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  const { data: staff } = await admin.from("staff_members").select("id, salon_id").eq("id", id).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", staff.salon_id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("staff_members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // NO storage cleanup here on purpose (round-1 review finding, CHAIN B): staff_members
  // avatar_url and cover_photo_url are free-text z.string().url() fields with no dedicated
  // upload route writing them anywhere in this codebase, and measured on live data 0 of 70
  // staff rows carry a url pointing at our own storage at all. Round 1 added a
  // removeObjectForUrl() call here keyed only on bucket ("avatars"), not on an owner prefix,
  // which meant PATCH /api/staff/[id] (an unrestricted url field) plus this DELETE was a
  // working cross-user storage-delete primitive: set a staff member's avatar_url to a
  // stolen avatar url, delete the staff row, the victim's real avatar gets removed. Cleaning
  // up files that no code creates is not worth that. If a real staff-photo uploader ever
  // ships, add the cleanup back scoped to ITS bucket and prefix, not this one.
  return NextResponse.json({ ok: true });
}
