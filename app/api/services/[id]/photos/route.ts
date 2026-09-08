export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { requireUploadHeader, verifyAndStripImage } from "@/lib/upload-security";
import { removeObjectForUrl } from "@/lib/storage";
import { validateBody, serviceDeletePhotoSchema } from "@/lib/validations";
import { requireSalonAccess } from "@/lib/auth/require";

// Build a Postgres array-literal string for a text[] compare-and-set filter (the
// DELETE handler below). postgrest-js's own .eq()/.filter() interpolate the value
// via a template literal (`${value}`), and Array.prototype.toString() joins a JS
// array with bare commas ("a,b"), not a valid Postgres array literal ("{a,b}"), so a
// raw array handed to .eq() here would silently build a filter that never matches.
// Each element is double-quoted with its own backslashes/quotes escaped first,
// matching the element-escaping Postgres itself uses inside a `{"a","b"}` literal.
function toPgTextArrayLiteral(urls: string[]): string {
  const escaped = urls.map((u) => `"${u.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

// POST /api/services/[id]/photos — Upload service photos to service-photos bucket
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // A15-upload-hardening (2026-07-27): this route authenticates via the ambient Supabase
  // session cookie, which a cross-site multipart form POST rides automatically. Require a
  // header only same-origin fetch() code can set (see lib/upload-security.ts).
  const csrfBlocked = requireUploadHeader(req);
  if (csrfBlocked) return csrfBlocked;

  const { id: serviceId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // G22: read via the admin client, scoped by the service id, so this can be
  // gated by requireSalonAccess below instead of an inline owner compare; a
  // catalog-granted staff caller is not the row's owner_id, so the session
  // client's services_manage_owner RLS would otherwise 404/empty this read.
  const admin = createAdminSupabaseClient();
  const { data: service } = await admin
    .from("services")
    .select("id, salon_id, photo_urls")
    .eq("id", serviceId)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // G22: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog) instead of the old owner-only compare.
  const access = await requireSalonAccess(service.salon_id, "catalog");
  if (access instanceof NextResponse) return access;

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });

  // Size cap, matching the sibling photo routes (gallery, reviews): one upload must not be able
  // to burn the project's Storage quota (Free tier is 1 GB across every bucket).
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 400 });
  }

  // Append to service photo_urls array
  const currentUrls = (service.photo_urls as string[]) ?? [];
  if (currentUrls.length >= 20) {
    return NextResponse.json({ error: "Maximum of 20 photos allowed." }, { status: 400 });
  }

  // A15-upload-hardening (2026-07-27): the MIME allowlist here used to check only the
  // client-controlled file.type string then pass it straight through as the upload's
  // Content-Type, and derived the storage extension from the client-controlled filename.
  // verifyAndStripImage reads the real magic-byte signature (blocking anything that is not
  // actually a decodable jpeg/png/webp) and re-encodes, which strips EXIF/GPS metadata.
  let processed;
  try {
    processed = await verifyAndStripImage(Buffer.from(await file.arrayBuffer()), ["jpeg", "png", "webp"]);
  } catch {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }

  const path = `${service.salon_id}/${serviceId}/${Date.now()}.${processed.ext}`;

  // G22: admin client for the upload and the row write too. The live
  // storage.objects policy for "service-photos" grants INSERT to the salon
  // OWNER only, and services_manage_owner RLS is the same owner-only shape,
  // so a catalog-granted staff caller's session client would silently fail
  // (or write nothing) on both of these even though the gate above let them in.
  const { error: uploadError } = await admin.storage
    .from("service-photos")
    .upload(path, processed.buffer, { contentType: processed.contentType, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from("service-photos").getPublicUrl(path);

  const { error: updateError } = await admin
    .from("services")
    .update({ photo_urls: [...currentUrls, urlData.publicUrl] })
    .eq("id", serviceId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ data: { url: urlData.publicUrl } }, { status: 201 });
}

// DELETE /api/services/[id]/photos: remove one service photo. Added because the X button on
// a service photo (ServiceModal, dashboard/services/page.tsx) only removed it from local
// component state; the next refetch brought it back since no DELETE handler existed here.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: serviceId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // G22: admin client, same reasoning as the POST handler above: a
  // catalog-granted staff caller is not the row's owner_id.
  const admin = createAdminSupabaseClient();
  const { data: service } = await admin
    .from("services")
    .select("id, salon_id, photo_urls")
    .eq("id", serviceId)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // G22: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog) instead of the old owner-only compare.
  const access = await requireSalonAccess(service.salon_id, "catalog");
  if (access instanceof NextResponse) return access;

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json().catch(() => null);
  const { data: parsed, error: validationError } = validateBody(serviceDeletePhotoSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { url } = parsed;

  // Compare-and-set on the whole array write. Two concurrent DELETEs (different
  // photo urls, same service) both read the same photo_urls, filter their own url
  // out, and would otherwise write the whole array back unconditionally, so the
  // second write silently reintroduces the url the first request already removed
  // (an array column has no per-element conflict for Postgres to detect on its
  // own). Filter the update on photo_urls still equalling the exact array we read;
  // a miss means another delete won the race, so re-read the row's now-current
  // array and retry, up to 3 attempts total.
  let currentUrls = (service.photo_urls as string[]) ?? [];
  let updatedUrls: string[] | null = null;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (!currentUrls.includes(url)) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    const nextUrls = currentUrls.filter((u) => u !== url);
    const { data: casRow, error: updateError } = await admin
      .from("services")
      .update({ photo_urls: nextUrls })
      .eq("id", serviceId)
      .filter("photo_urls", "eq", toPgTextArrayLiteral(currentUrls))
      .select("id")
      .maybeSingle();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    if (casRow) {
      updatedUrls = nextUrls;
      break;
    }

    // 0 rows matched: a concurrent delete on this service already changed
    // photo_urls between our read and this write. Re-read the row's current array
    // and retry against the fresh value rather than the stale one we started with.
    const { data: refreshed, error: refreshError } = await admin
      .from("services")
      .select("photo_urls")
      .eq("id", serviceId)
      .single();
    if (refreshError || !refreshed) {
      return NextResponse.json({ error: refreshError?.message ?? "Service not found" }, { status: 500 });
    }
    currentUrls = (refreshed.photo_urls as string[]) ?? [];
  }

  if (!updatedUrls) {
    console.error("[services photos DELETE] CAS retry exhausted for service", serviceId, "url", url);
    return NextResponse.json({ error: "Photo delete conflict, please retry" }, { status: 409 });
  }

  // Remove the storage object only AFTER the database write above actually
  // succeeded (the CAS loop, not just "the request didn't error"), so a lost race
  // that got retried never leaves photo_urls pointing at a file storage already
  // deleted for a DIFFERENT request's url.
  // Same bucket + path shape as the upload above (${salon_id}/${serviceId}/${filename}),
  // ownership pinned to this service's own salon_id so removeObjectForUrl refuses a url
  // outside that prefix instead of trusting it. Best-effort: the DB row above is already
  // updated, so a storage failure here is logged, not fatal to the request.
  // Service-role client on purpose, same as the sibling DELETE in app/api/services/[id]/route.ts:
  // the live storage.objects policies for service-photos grant salon owners INSERT only (no
  // DELETE), so a session-client remove silently deletes nothing and the file stays forever.
  // Access was already proven above (requireSalonAccess) before this line can run.
  const removal = await removeObjectForUrl(admin, url, "service-photos", service.salon_id, "[services photos DELETE]");
  if (removal.error) console.error("[services photos DELETE] storage remove failed:", removal.error, { serviceId, url });

  return NextResponse.json({ data: { photo_urls: updatedUrls } });
}
