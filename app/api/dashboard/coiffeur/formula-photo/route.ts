export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { getActiveSalon } from "@/lib/active-salon";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import { requireUploadHeader, verifyAndStripImage } from "@/lib/upload-security";
import { signedUrl } from "@/lib/storage";

// POST /api/dashboard/coiffeur/formula-photo
// FormData fields: file (File), formula_id (string), type ("before"|"after"), client_id? (string)
export async function POST(req: NextRequest) {
  // A15-upload-hardening (2026-07-27): this route authenticates via the ambient Supabase
  // session cookie, which a cross-site multipart form POST rides automatically. Require a
  // header only same-origin fetch() code can set (see lib/upload-security.ts).
  const csrfBlocked = requireUploadHeader(req);
  if (csrfBlocked) return csrfBlocked;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Resolve salon ownership. P9-2: area composes the staff fallback (clients)
  // onto the owner resolution. Owner path is unchanged.
  const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id", "clients");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Parse multipart FormData
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const formulaId = formData.get("formula_id") as string | null;
  const clientId = formData.get("client_id") as string | null;
  const type = formData.get("type") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!type || (type !== "before" && type !== "after")) {
    return NextResponse.json({ error: "type must be 'before' or 'after'" }, { status: 400 });
  }

  // Max 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  // Verify the client belongs to this salon BEFORE writing anything to Storage (ring 9
  // parked finding: the upload used to run first, so an owner could burn a Storage write
  // for a client_id that fails this check and gets thrown away below).
  if (formulaId && clientId) {
    const belongs = await clientBelongsToSalon(admin, salon.id, clientId);
    if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });
  }

  // A15-upload-hardening (2026-07-27): the old check only verified `file.type` starts with
  // "image/", a client-controlled string, and derived the storage extension from the
  // client-controlled filename. These are before/after client formula photos, so their
  // EXIF/GPS data is exactly the kind of thing (a client's home address) this route must
  // never leak into Storage. verifyAndStripImage reads the real magic-byte signature
  // (blocking anything that is not actually a decodable jpeg/png/webp) and re-encodes,
  // which strips that metadata.
  let processed;
  try {
    processed = await verifyAndStripImage(Buffer.from(await file.arrayBuffer()), ["jpeg", "png", "webp"]);
  } catch {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }

  const storagePath = `${salon.id}/${clientId ?? "unknown"}/${Date.now()}-${type}.${processed.ext}`;

  const { error: uploadError } = await admin.storage
    .from("formula-photos")
    .upload(storagePath, processed.buffer, {
      contentType: processed.contentType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // formula-photos is a PRIVATE bucket, so the getPublicUrl() link this used to store resolved to
  // nothing and every colour-formula before/after photo rendered as a broken image. Store the
  // bucket-relative PATH; whatever displays it signs a short-lived link at read time
  // (lib/storage.ts signedUrl), rather than persisting a link that expires.
  // Same fix as app/api/clients/[id]/photos, ported by hand 2026-08-14 from a stranded branch.
  const photoUrl = storagePath;

  // The response still carries a usable link so the screen that just uploaded does not refetch.
  const signedForResponse = await signedUrl(admin, "formula-photos", storagePath);

  // Attach the photo to the formula (best-effort, does not block the response).
  // NOTE: `coiffeur_formula_photos` is not a real table (checked lib/database.types.ts,
  // 0 matches anywhere in the repo); the real home for before/after formula photos is
  // client_formulas.before_photo_url / after_photo_url (checked lib/database.types.ts).
  // Switched from an insert-into-phantom-table to an update of the existing formula row.
  if (formulaId) {
    await admin.from("client_formulas")
      .update(type === "before" ? { before_photo_url: photoUrl } : { after_photo_url: photoUrl })
      .eq("id", formulaId)
      .eq("salon_id", salon.id);
    // Ignore update errors, the URL is still returned even if the formula row is gone
  }

  // The stored value is the path; the RESPONSE carries a link that actually loads. Returning the
  // bare path here would hand the screen a broken image, which is the whole defect being fixed.
  if (!signedForResponse) {
    return NextResponse.json(
      { error: "Photo uploaded but could not be signed for display" },
      { status: 500 },
    );
  }
  return NextResponse.json({ url: signedForResponse }, { status: 201 });
}
