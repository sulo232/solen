export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, updateProfileSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import type { Json } from "@/lib/database.types";

const PREVIEW_COOKIE = "solen_admin_preview";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Admin preview mode: if admin has a preview cookie, return target salon's data
  const previewSalonId = request.cookies.get(PREVIEW_COOKIE)?.value;
  if (previewSalonId && data.role === "admin") {
    const { data: previewSalon } = await supabase
      .from("salons")
      .select("id, name, categories")
      .eq("id", previewSalonId)
      .single();
    if (previewSalon) {
      return NextResponse.json({
        ...data,
        salon_id: previewSalon.id,
        salon_name: previewSalon.name,
        salon_categories: previewSalon.categories || [],
        is_previewing: true,
        preview_salon_name: previewSalon.name,
      });
    }
  }

  // Normal flow: look up the active owned salon (for DashboardLayout auth guard).
  // Follows the salon switcher (solen_active_salon cookie) via getActiveSalon.
  let salon_id: string | null = null;
  let salon_name: string | null = null;
  let salon_categories: string[] = [];
  const ownedSalon = await getActiveSalon<{ id: string; name: string; categories: string[] | null }>(supabase, user.id, "id, name, categories");
  if (ownedSalon) {
    salon_id = ownedSalon.id;
    salon_name = ownedSalon.name;
    salon_categories = ownedSalon.categories || [];
  }

  return NextResponse.json({ ...data, salon_id, salon_name, salon_categories });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(updateProfileSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // deals_enabled (marketing consent) and rebooking_enabled (rebooking-nudge consent) live on
  // notification_preferences, not profiles (defect-2 fix); split them out before the profiles
  // update so neither ever lands there.
  const { deals_enabled, rebooking_enabled, ...profileFields } = validated;

  // A caller sending ONLY a notification-preference key (e.g. just rebooking_enabled) leaves
  // profileFields empty; an empty .update({}) has no columns to set and .single() then fails to
  // coerce, so skip the profiles write entirely in that case. No caller today reads `data` back
  // when it sends no profile columns (SettingsForm always sends its profile fields alongside
  // deals_enabled; see app/[locale]/profile/settings/SettingsForm.tsx).
  const hasProfileFields = Object.keys(profileFields).length > 0;
  let data: Record<string, unknown> | null = null;
  if (hasProfileFields) {
    // customer_preferences is a strongly-typed zod object (JSON body field, always JSON-serializable at
    // runtime); cast to the generated Json column type. Project only the columns just written (never
    // "*" on the sensitive profiles table, backend-audit-2026-07-06) so the response can never leak a
    // column the caller didn't just set themselves.
    const returnCols = Object.keys(profileFields).join(",");
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ ...profileFields, customer_preferences: profileFields.customer_preferences as Json | undefined })
      .eq("id", user.id)
      .select(returnCols)
      .single();
    if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
    // A dynamic (non-literal) column list can't be statically typed by the generated client;
    // the runtime shape matches returnCols exactly (the keys we just wrote).
    data = updated as unknown as Record<string, unknown> | null;
  }

  // Only upsert when the caller actually sent this key. Every settings sub-page loads and
  // resends the real fetched value regardless of which slice it renders (same convention as
  // notification_email/notification_sms), so this fires on every save, always with the
  // customer's real current choice, never a silent reset.
  if (deals_enabled !== undefined || rebooking_enabled !== undefined) {
    const prefsPatch: { user_id: string; deals_enabled?: boolean; rebooking_enabled?: boolean } = {
      user_id: user.id,
    };
    if (deals_enabled !== undefined) prefsPatch.deals_enabled = deals_enabled;
    if (rebooking_enabled !== undefined) prefsPatch.rebooking_enabled = rebooking_enabled;
    const { error: prefsError } = await supabase
      .from("notification_preferences")
      .upsert(prefsPatch, { onConflict: "user_id" });
    if (prefsError) console.error("[api/profile] notification_preferences upsert failed:", prefsError.message);
  }

  return NextResponse.json({ data });
}
