export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, barberProfileSchema } from "@/lib/validations";
import { requireSalonAccess } from "@/lib/auth/require";
import type { Database } from "@/lib/database.types";

// PUT /api/staff/[id]/slug — Set barber vanity URL slug
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(barberProfileSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { id: staffId } = await params;
  const admin = createAdminSupabaseClient();

  // Verify salon ownership
  const { data: staff } = await admin
    .from("staff_members").select("id, salon_id").eq("id", staffId).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog = services & pricing, the slug/cover
  // photo/accent color are the public profile a catalog-granted staff member
  // manages) instead of the old owner-only compare.
  const access = await requireSalonAccess(staff.salon_id, "catalog");
  if (access instanceof NextResponse) return access;

  // Check slug uniqueness
  const { data: existing } = await admin
    .from("staff_members").select("id").eq("slug", validated.slug).neq("id", staffId).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Slug already taken", code: "SLUG_TAKEN" }, { status: 409 });
  }

  const update: Database["public"]["Tables"]["staff_members"]["Update"] = { slug: validated.slug };
  if (validated.cover_photo_url) update.cover_photo_url = validated.cover_photo_url;
  if (validated.accent_color) update.accent_color = validated.accent_color;

  const { data: updated, error } = await admin
    .from("staff_members").update(update).eq("id", staffId).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: updated });
}
