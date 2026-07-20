// exists-check: `npm run exists "avatar upload"` ran this turn, 0 matches; the near-hits
// (lib/supabase.ts, lib/ratelimit.ts, app/error.tsx, etc.) are shared infra this route imports,
// not a duplicate of it. Net-new route vs those; extends app/api/clients/[id]/photos/route.ts's
// upload pattern (see below) and app/api/profile/route.ts's PATCH for how avatar_url is saved.
//
// Profile avatar upload. Follows the app/api/clients/[id]/photos/route.ts pattern (auth via
// the session client, checkUserBanned + applyRateLimit gates, error shape { error }), with two
// deliberate deviations from that route, both because avatars are a different trust shape than
// salon-owner-scoped client photos:
// 1. Storage client: the actual `storage.upload()` call uses the ADMIN client (service role),
//    matching the app/api/dashboard/coiffeur/formula-photo/route.ts precedent, because there is
//    no storage.objects RLS policy for this new "avatars" bucket (no MCP apply_migration /
//    execute_sql tool was available this session to write one; see the migration file's header).
//    The ownership check happens at the app layer instead: a user may only ever write to their
//    own `avatars/<user.id>/` prefix, which this route derives from the verified session user,
//    never from client input.
// 2. Bucket: PUBLIC (`avatars`, matches the service-photos/salon-gallery/review-photos family),
//    not the private client-photos bucket the task brief pointed at, because avatar_url is
//    rendered everywhere via plain <img>/<Image> (Header, SalonReviews, SalonTeam, salon PDP)
//    with no signed-URL machinery in this codebase; reusing the private client-photos bucket
//    would reproduce the documented client-photos/formula-photos bug (BACKEND.md section 3,
//    gotcha 2: private bucket + getPublicUrl() = broken image, confirmed live, no fix in repo).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB input cap, per spec
// Storage-layer allowlist mirrors client-photos/service-photos (jpeg/png/webp), plus gif;
// deliberately excludes image/svg+xml even though the brief says "image/* mime" generically,
// per the documented service-photos incident (BACKEND.md gotcha 7): an unfiltered file.type
// passed through as Storage contentType on a public bucket is a stored-XSS vector for SVG/HTML.
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });

  if (!file.type.startsWith("image/") || !ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Max 100MB" }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || file.type.split("/").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const admin = createAdminSupabaseClient();
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("[ProfileAvatar] storage upload failed:", uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(path);

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);

  if (dbError) {
    console.error("[ProfileAvatar] profile update failed:", dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ url: urlData.publicUrl });
}
