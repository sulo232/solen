export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, updateProfileSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";

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

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(updateProfileSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { data, error } = await supabase.from("profiles").update(validated).eq("id", user.id).select().single();
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data });
}
