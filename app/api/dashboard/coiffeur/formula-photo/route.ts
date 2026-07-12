export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { getActiveSalon } from "@/lib/active-salon";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";

// POST /api/dashboard/coiffeur/formula-photo
// FormData fields: file (File), formula_id (string), type ("before"|"after"), client_id? (string)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Resolve salon ownership
  const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id");
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

  // Verify the client belongs to this salon BEFORE writing anything to Storage (ring 9
  // parked finding: the upload used to run first, so an owner could burn a Storage write
  // for a client_id that fails this check and gets thrown away below).
  if (formulaId && clientId) {
    const belongs = await clientBelongsToSalon(admin, salon.id, clientId);
    if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });
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

  return NextResponse.json({ url: photoUrl }, { status: 201 });
}
