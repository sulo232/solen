export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";
import { checkUserBanned } from "@/lib/feature-flags";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { requireUploadHeader, verifyAndStripImage } from "@/lib/upload-security";
import { signedUrl } from "@/lib/storage";

// GET /api/clients/[id]/photos — Get client photos (salon owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data, error } = await supabase
    .from("client_photos")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // client-photos is a PRIVATE bucket, so a stored getPublicUrl() link resolves to nothing and
  // every before/after photo a salon took of a client rendered as a broken image. photo_url now
  // holds the bucket-relative PATH and a fresh short-lived link is signed per request instead of
  // persisting one that expires. A row that cannot be signed is DROPPED rather than passed through
  // as a raw path, because a raw path in an <img src> is just a broken image with extra steps.
  // Ported by hand 2026-08-14 from a branch where this was fixed on 2026-07-12 and stranded.
  // Deliberately WITHOUT that branch's rewrite of every error response in this file: no behaviour
  // change, and main has moved past it.
  const admin = createAdminSupabaseClient();
  const items = (
    await Promise.all(
      (data ?? []).map(async (p) => {
        const url = await signedUrl(admin, "client-photos", p.photo_url);
        return url ? { ...p, photo_url: url } : null;
      }),
    )
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  return NextResponse.json({ items });
}

// POST /api/clients/[id]/photos - Upload a client photo to Supabase Storage
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // A15-upload-hardening (2026-07-27): this route authenticates via the ambient Supabase
  // session cookie, which a cross-site multipart form POST rides automatically. Require a
  // header only same-origin fetch() code can set (see lib/upload-security.ts).
  const csrfBlocked = requireUploadHeader(req);
  if (csrfBlocked) return csrfBlocked;

  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const belongs = await clientBelongsToSalon(admin, salon.id, customerId);
  if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const photoType = (formData.get("photo_type") as string) ?? "progress";
  const bookingId = formData.get("booking_id") as string | null;

  if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });
  // Size cap, matching the sibling photo routes: one client-photo upload must not be able to
  // burn the project's Storage quota (Free tier is 1 GB across every bucket).
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 400 });
  }
  if (!["before", "after", "progress"].includes(photoType)) {
    return NextResponse.json({ error: "photo_type must be before, after, or progress" }, { status: 400 });
  }

  // A15-upload-hardening (2026-07-27): the MIME allowlist here used to check only the
  // client-controlled file.type string then pass it straight through as the upload's
  // Content-Type, and derived the storage extension from the client-controlled filename.
  // These are client "before/after/progress" photos, so their EXIF/GPS data is exactly the
  // kind of thing (a client's home address) this route must never leak into Storage.
  // verifyAndStripImage reads the real magic-byte signature and re-encodes, stripping it.
  let processed;
  try {
    processed = await verifyAndStripImage(Buffer.from(await file.arrayBuffer()), ["jpeg", "png", "webp"]);
  } catch {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const path = `${salon.id}/${customerId}/${Date.now()}.${processed.ext}`;

  const { error: uploadError } = await supabase.storage
    .from("client-photos")
    .upload(path, processed.buffer, { contentType: processed.contentType, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Store the bucket-relative PATH, never a getPublicUrl() link: this bucket is private, so such a
  // link resolves to nothing. Reads sign a fresh URL per request (see the GET above).
  const { data: photo, error } = await supabase
    .from("client_photos")
    .insert({
      salon_id: salon.id,
      customer_id: customerId,
      booking_id: bookingId ?? null,
      photo_url: path,
      photo_type: photoType,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sign the just-uploaded photo for the immediate response too, so the screen that just uploaded
  // it does not have to refetch. A failed sign is an error rather than a broken <img src>.
  const signed = await signedUrl(admin, "client-photos", path);
  if (!signed) {
    return NextResponse.json(
      { error: "Photo uploaded but could not be signed for display" },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: { ...photo, photo_url: signed } }, { status: 201 });
}
