export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";

// POST /api/reviews/[id]/photos
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 1. Verify review ownership
  const { data: review, error: reviewErr } = await supabase
    .from("reviews")
    .select("user_id")
    .eq("id", params.id)
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
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      continue; // Skip files > 5MB
    }

    const ext = file.type.split('/')[1];
    const path = `${params.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("review-photos")
      .upload(path, file);

    if (uploadErr) {
      console.error("Photo upload error:", uploadErr);
      continue;
    }

    // get public url
    const { data: publicUrlData } = supabase.storage.from("review-photos").getPublicUrl(path);

    // save to review_photos table
    const { data: record, error: dbErr } = await supabase.from("review_photos").insert({
      review_id: params.id,
      photo_url: publicUrlData.publicUrl,
      sort_order: i
    }).select().single();

    if (!dbErr && record) {
      uploadedRecords.push(record);
    }
  }

  return NextResponse.json({ success: true, photos: uploadedRecords });
}
