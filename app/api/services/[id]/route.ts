export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, serviceUpdateSchema } from "@/lib/validations";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import type { Database } from "@/lib/database.types";
import { translateToLocales } from "@/lib/ai/translate";
import { removeObjectForUrl } from "@/lib/storage";

// GET /api/services/[id] — Get a single service
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  return NextResponse.json({ service: data });
}

// PATCH /api/services/[id] — Update a service
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Get service + verify ownership
  const { data: service } = await admin
    .from("services")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const ownerIdRaw = service.salons as unknown as { owner_id: string } | null;
  if (ownerIdRaw?.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(serviceUpdateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(validated)) {
    if (value !== undefined) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  // RE-TRANSLATE ON EDIT (2026-07-27). Without this, changing the German name leaves the OLD
  // French and Italian attached to it, and a stale translation is worse than a missing one: it
  // looks authoritative, and the fallback chain in lib/i18n/localized-field.ts will happily
  // serve it because it is non-empty. Only fires when the German source actually changed, so
  // editing a price or a duration costs nothing.
  //
  // A salon's OWN fr/it edit wins: if this request carries name_fr or name_it explicitly, the
  // machine does not overwrite it. Nothing auto-translated is authoritative over a human.
  if (typeof updates.name_de === "string" && updates.name_de.trim()) {
    const t = await translateToLocales(updates.name_de, "de", "name");
    if (t.fr && updates.name_fr === undefined) updates.name_fr = t.fr;
    if (t.it && updates.name_it === undefined) updates.name_it = t.it;
  }
  if (typeof updates.description_de === "string" && updates.description_de.trim()) {
    const t = await translateToLocales(updates.description_de, "de", "description");
    if (t.fr && updates.description_fr === undefined) updates.description_fr = t.fr;
    if (t.it && updates.description_it === undefined) updates.description_it = t.it;
  }

  // `updates` is built from validateBody(serviceUpdateSchema, ...) key-by-key above, so every
  // key/value pair already matches a real services column; narrowing to the generated Update
  // type here changes no runtime value, only satisfies RejectExcessProperties.
  const { error } = await admin.from("services").update(updates as Database["public"]["Tables"]["services"]["Update"]).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/services/[id]: Delete a service
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // photo_urls read here, before the delete below, so the pointers are still available to
  // resolve storage paths from. Get service + verify ownership.
  const { data: service } = await admin
    .from("services")
    .select("id, salon_id, photo_urls, salons(owner_id)")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const ownerIdRaw = service.salons as unknown as { owner_id: string } | null;
  if (ownerIdRaw?.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await admin.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Storage cleanup (found by the remainder lens, round 2 item 6): unlike the other four
  // sites this one is ROUTINE, an owner deleting a service is an everyday action, not a rare
  // path, and up to 20 photos per service (app/api/services/[id]/photos/route.ts) sit in the
  // PUBLIC "service-photos" bucket with nothing else ever removing them. photo_urls is
  // server-generated by the upload route (not client-writable, unlike avatar_url), so this
  // is not a cross-user risk the way the reverted staff/nail-inspo sites were, but the
  // ownerPrefix is still passed, same discipline as every other call site. Path shape is
  // `${salon_id}/${serviceId}/${filename}` (the upload route), so the prefix is salon_id,
  // the first segment. Best-effort, logged-not-fatal: the row is already gone above.
  const photoUrls = (service.photo_urls as string[] | null) ?? [];
  for (const url of photoUrls) {
    const removal = await removeObjectForUrl(admin, url, "service-photos", service.salon_id, "[services DELETE]");
    if (removal.error) console.error("[services DELETE] photo_urls storage remove failed:", removal.error, { serviceId: id, url });
  }

  return NextResponse.json({ ok: true });
}
