// exists-check: net-new vs app/api/cities/route.ts (public, hardcoded CITY_SLUGS, no
// auth/mutation), app/api/admin/commission/route.ts (auth pattern reused verbatim below),
// app/api/admin/homepage-sections/route.ts (closest admin toggle-table analog). No existing
// /api/admin/cities endpoint , this is the net-new admin-authed GET+PATCH on the `cities`
// table (list + is_active toggle) the rollout admin UI needs.
export const dynamic = "force-dynamic";
// NOT edge (2026-07-04 city-rollout refactor): `bustActiveCitiesCache()` below mutates a
// module-level in-memory cache in lib/cities.ts. Edge and Node.js runtimes are separate
// module registries in Next.js, so an edge-runtime PATCH here could never bust the Node.js
// runtime's cache that app/[locale]/[city]/page.tsx (default Node runtime, no `runtime`
// export) actually reads , the toggle would silently wait out the 5-minute TTL instead of
// applying immediately. Node runtime is required for the bust to reach the same instance.
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminCityToggleSchema } from "@/lib/validations";
import { bustActiveCitiesCache } from "@/lib/cities";

// GET /api/admin/cities: list ALL cities (active + inactive) for the admin rollout panel.
// Admin-only (matches app/api/admin/commission/route.ts auth shape).
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data: cities, error } = await admin
    .from("cities")
    .select("id, slug, name_de, name_en, name_fr, name_it, is_active, display_order")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cities: cities ?? [] });
}

// PATCH /api/admin/cities: toggle a city's is_active flag. Body: { id, is_active }.
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminCityToggleSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const { data: updated, error } = await admin
    .from("cities")
    .update({ is_active: validated.is_active })
    .eq("id", validated.id)
    .select("id, slug, name_de, name_en, name_fr, name_it, is_active, display_order")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "City not found" }, { status: 404 });

  // Bust the server-side getActiveCities() TTL cache (lib/cities.ts) immediately, so
  // /[city] route gating + /api/cities (which client nav reads) reflect the toggle
  // right away instead of waiting out the 5-minute TTL.
  bustActiveCitiesCache();

  await logAuditEvent(
    req,
    user.id,
    "feature_flag.toggle", // closest available action type (matches commission/feature-flags precedent)
    "cities",
    updated.id,
    { slug: updated.slug, is_active: updated.is_active }
  );

  return NextResponse.json({ city: updated });
}
