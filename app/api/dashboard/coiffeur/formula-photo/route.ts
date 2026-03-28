export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";

// POST /api/dashboard/coiffeur/formula-photo
// FormData fields: file (File), formula_id (string), type ("before"|"after"), client_id? (string)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Resolve salon ownership
  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();
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

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  // Max 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${salon.id}/${clientId ?? "unknown"}/${Date.now()}-${type}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from("formula-photos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = admin.storage
    .from("formula-photos")
    .getPublicUrl(storagePath);

  const photoUrl = publicUrlData.publicUrl;

  // Insert record into coiffeur_formula_photos (best-effort — table may not exist yet)
  if (formulaId) {
    await admin.from("coiffeur_formula_photos").insert({
      formula_id: formulaId,
      client_id: clientId ?? null,
      salon_id: salon.id,
      photo_url: photoUrl,
      type,
      uploaded_by: user.id,
    });
    // Ignore insert errors — the URL is still returned even if the table doesn't exist
  }

  return NextResponse.json({ url: photoUrl }, { status: 201 });
}
