export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";

// POST /api/reviews/[id]/photos
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  // Every reason a file did not make it. This route used to `continue` past each failure and
  // then unconditionally return success:true, so a total failure looked identical to a total
  // success. It was: RLS refused every upload (no INSERT policy existed on the bucket until
  // 20260716210000), and across 260 reviews not one photo ever landed, while every customer was
  // told it had. Never report success for work that did not happen.
  const rejected: { name: string; reason: string }[] = [];

  for (let i = 0; i < Math.min(files.length, 3); i++) {
    const file = files[i];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      rejected.push({ name: file.name, reason: "unsupported_type" });
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      rejected.push({ name: file.name, reason: "too_large" });
      continue;
    }

    const ext = file.type.split('/')[1];
    const path = `${id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("review-photos")
      .upload(path, file);

    if (uploadErr) {
      console.error("[reviews/photos] storage upload failed:", { reviewId: id, reason: uploadErr.message });
      rejected.push({ name: file.name, reason: "upload_failed" });
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

    if (dbErr || !record) {
      // The bytes are already in storage but the row failed, so this file is now an ORPHAN:
      // world-readable (the bucket is public-read) and referenced by nothing, which means the
      // GDPR purge path keyed off review_photos rows would never find it either. Delete it back
      // out rather than leaking it, and never count it as uploaded.
      console.error("[reviews/photos] db row failed after upload, removing orphan:", {
        reviewId: id, path, reason: dbErr?.message ?? "no row returned",
      });
      const { error: cleanupErr } = await supabase.storage.from("review-photos").remove([path]);
      if (cleanupErr) {
        console.error("[reviews/photos] orphan cleanup ALSO failed, object is stranded:", {
          reviewId: id, path, reason: cleanupErr.message,
        });
      }
      rejected.push({ name: file.name, reason: "save_failed" });
      continue;
    }
    uploadedRecords.push(record);
  }

  // Report what actually happened. Three honest outcomes instead of one unconditional lie:
  //   nothing asked for survived -> 502, this request achieved nothing
  //   some survived              -> 207-style partial, name what did not make it
  //   all survived              -> success
  if (uploadedRecords.length === 0) {
    return NextResponse.json(
      { error: "No photos could be saved", rejected },
      { status: 502 },
    );
  }
  return NextResponse.json({
    success: true,
    photos: uploadedRecords,
    ...(rejected.length ? { rejected } : {}),
  });
}
