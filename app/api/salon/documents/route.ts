import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { requireUploadHeader, verifyAndStripImage, isPdfSignature } from "@/lib/upload-security";
import { getActiveSalonId } from "@/lib/active-salon";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const salonId = await getActiveSalonId(admin, user.id, "settings");
  if (!salonId) return NextResponse.json({ error: "No salon found" }, { status: 404 });

  const { data: documents, error: docsErr } = await admin.from("salon_documents").select("*").eq("salon_id", salonId).order("uploaded_at", { ascending: false });
  if (docsErr) return NextResponse.json({ error: docsErr.message }, { status: 500 });

  return NextResponse.json({ documents });
}

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
  const salonId = await getActiveSalonId(admin, user.id, "settings");
  if (!salonId) return NextResponse.json({ error: "No salon found" }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "No form data" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const document_type = formData.get("document_type") as string;
  
  if (!file || !document_type) return NextResponse.json({ error: "Missing file or document_type" }, { status: 400 });
  const allowedTypes = ['trade_license', 'professional_cert', 'hygiene_cert', 'id_proof', 'address_proof', 'other'];
  if (!allowedTypes.includes(document_type)) return NextResponse.json({ error: "Invalid document type" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });

  // A15-upload-hardening (2026-07-27): the old `allowedMime.includes(file.type)` check only
  // trusted the client-supplied file.type string, and the storage extension came from the
  // client-supplied filename. This route accepts two real formats (PDF or an image), each
  // verified against its actual bytes: a PDF must start with the real %PDF- magic-byte
  // signature, an image is verified and re-encoded via verifyAndStripImage (which also
  // strips any EXIF/GPS metadata the file carries). Anything else is rejected.
  const rawBytes = Buffer.from(await file.arrayBuffer());
  let uploadBuffer: Buffer;
  let uploadContentType: string;
  let ext: string;

  if (isPdfSignature(rawBytes)) {
    uploadBuffer = rawBytes;
    uploadContentType = "application/pdf";
    ext = "pdf";
  } else {
    try {
      const processed = await verifyAndStripImage(rawBytes, ["jpeg", "png"]);
      uploadBuffer = processed.buffer;
      uploadContentType = processed.contentType;
      ext = processed.ext;
    } catch {
      return NextResponse.json({ error: "Invalid file type. Only PDF, JPG, PNG allowed." }, { status: 400 });
    }
  }

  // Upload to Supabase Storage
  const fileName = `${salonId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const { data: uploadData, error: uploadErr } = await admin.storage
    .from("salon-documents")
    .upload(fileName, uploadBuffer, { contentType: uploadContentType });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  const pathUrl = uploadData.path;

  // Insert into DB
  const { data: doc, error: dbErr } = await admin.from("salon_documents").insert({
    salon_id: salonId,
    document_type,
    file_name: file.name,
    file_url: pathUrl,
    status: 'pending'
  }).select().single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, document: doc });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing document id" }, { status: 400 });

  // Owner path unchanged (all owned salon ids, exactly as before); an
  // owner-less caller falls back to their active staff row's "settings"
  // grant salon (P9-2, same composition as GET/POST above).
  // RLS fix: salon resolution, the doc lookup, the storage delete and the
  // row delete all run on the admin client; the `salonIds.includes` check
  // right below is what keeps this scoped to the gated salon.
  const admin = createAdminSupabaseClient();
  const { data: salons } = await admin.from("salons").select("id").eq("owner_id", user.id);
  let salonIds = (salons ?? []).map((s) => s.id);
  if (salonIds.length === 0) {
    const staffSalonId = await getActiveSalonId(admin, user.id, "settings");
    if (staffSalonId) salonIds = [staffSalonId];
  }
  if (salonIds.length === 0) return NextResponse.json({ error: "No salon found" }, { status: 404 });

  const { data: doc, error: docErr } = await admin.from("salon_documents").select("id, salon_id, file_url").eq("id", id).in("salon_id", salonIds).single();
  if (docErr || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (!salonIds.includes(doc.salon_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete from storage
  await admin.storage.from("salon-documents").remove([doc.file_url]);

  // Delete from DB
  const { error: delErr } = await admin.from("salon_documents").delete().eq("id", id).eq("salon_id", doc.salon_id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
