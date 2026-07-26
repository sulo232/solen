export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { requireUploadHeader, verifyAndStripImage } from "@/lib/upload-security";

// POST /api/reviews/[id]/photos
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // A15-upload-hardening (2026-07-27): this route authenticates via the ambient Supabase
  // session cookie (createServerSupabaseClient below), which a cross-site multipart form
  // POST rides automatically. Require a header only same-origin fetch() code can set.
  const csrfBlocked = requireUploadHeader(req);
  if (csrfBlocked) return csrfBlocked;

  const { id } = await params;
  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 1. Verify review ownership
  const { data: review, error: reviewErr } = await supabase
    .from("reviews")
    .select("user_id")
    .eq("id", id)
    .single();

  if (reviewErr || !review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("photos") as unknown as File[];
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No photos provided" }, { status: 400 });
  }
  if (files.length > 3) {
    return NextResponse.json({ error: "Maximum 3 photos allowed" }, { status: 400 });
  }

  const uploadedRecords: any[] = [];

  for (let i = 0; i < Math.min(files.length, 3); i++) {
    const file = files[i];
    if (file.size > 5 * 1024 * 1024) {
      continue; // Skip files > 5MB
    }

    // A15-upload-hardening (2026-07-27): verify the real bytes (magic-byte format sniff)
    // instead of trusting the client-supplied file.type, and re-encode, which strips any
    // EXIF/GPS metadata a customer's phone photo carries before it reaches Storage.
    let processed;
    try {
      processed = await verifyAndStripImage(Buffer.from(await file.arrayBuffer()), ["jpeg", "png", "webp"]);
    } catch {
      continue; // not a decodable jpeg/png/webp, skip like the old MIME-allowlist did
    }

    const path = `${id}/${crypto.randomUUID()}.${processed.ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("review-photos")
      .upload(path, processed.buffer, { contentType: processed.contentType });

    if (uploadErr) {
      console.error("Photo upload error:", uploadErr);
      continue;
    }

    // get public url
    const { data: publicUrlData } = supabase.storage.from("review-photos").getPublicUrl(path);

    // save to review_photos table
    const { data: record, error: dbErr } = await supabase.from("review_photos").insert({
      review_id: id,
      photo_url: publicUrlData.publicUrl,
      sort_order: i
    }).select().single();

    if (!dbErr && record) {
      uploadedRecords.push(record);
    }
  }

  return NextResponse.json({ success: true, photos: uploadedRecords });
}
