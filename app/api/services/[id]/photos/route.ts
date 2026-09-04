export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { requireUploadHeader, verifyAndStripImage } from "@/lib/upload-security";
import { removeObjectForUrl } from "@/lib/storage";
import { validateBody, serviceDeletePhotoSchema } from "@/lib/validations";

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

  // Verify service belongs to user's salon
  const { data: service } = await supabase
    .from("services")
    .select("id, salon_id, photo_urls, salons(owner_id)")
    .eq("id", serviceId)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const owner = (service.salons as unknown as { owner_id: string })?.owner_id;
  if (owner !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const { error: uploadError } = await supabase.storage
    .from("service-photos")
    .upload(path, processed.buffer, { contentType: processed.contentType, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("service-photos").getPublicUrl(path);

  const { error: updateError } = await supabase
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

  // Same ownership check as POST above: reused, not re-implemented.
  const { data: service } = await supabase
    .from("services")
    .select("id, salon_id, photo_urls, salons(owner_id)")
    .eq("id", serviceId)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const owner = (service.salons as unknown as { owner_id: string })?.owner_id;
  if (owner !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json().catch(() => null);
  const { data: parsed, error: validationError } = validateBody(serviceDeletePhotoSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { url } = parsed;

  const currentUrls = (service.photo_urls as string[]) ?? [];
  if (!currentUrls.includes(url)) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const updatedUrls = currentUrls.filter((u) => u !== url);
  const { error: updateError } = await supabase
    .from("services")
    .update({ photo_urls: updatedUrls })
    .eq("id", serviceId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Same bucket + path shape as the upload above (${salon_id}/${serviceId}/${filename}),
  // ownership pinned to this service's own salon_id so removeObjectForUrl refuses a url
  // outside that prefix instead of trusting it. Best-effort: the DB row above is already
  // updated, so a storage failure here is logged, not fatal to the request.
  // Service-role client on purpose, same as the sibling DELETE in app/api/services/[id]/route.ts:
  // the live storage.objects policies for service-photos grant salon owners INSERT only (no
  // DELETE), so a session-client remove silently deletes nothing and the file stays forever.
  // Ownership was already proven above (owner_id === user.id) before this line can run.
  const removal = await removeObjectForUrl(createAdminSupabaseClient(), url, "service-photos", service.salon_id, "[services photos DELETE]");
  if (removal.error) console.error("[services photos DELETE] storage remove failed:", removal.error, { serviceId, url });

  return NextResponse.json({ data: { photo_urls: updatedUrls } });
}
