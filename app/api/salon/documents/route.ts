import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salons, error: err } = await supabase.from("salons").select("id").eq("owner_id", user.id);
  if (err || !salons || salons.length === 0) return NextResponse.json({ error: "No salon found" }, { status: 404 });

  const salonId = salons[0].id;
  const { data: documents, error: docsErr } = await supabase.from("salon_documents").select("*").eq("salon_id", salonId).order("uploaded_at", { ascending: false });
  if (docsErr) return NextResponse.json({ error: docsErr.message }, { status: 500 });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Get salon
  const { data: salons } = await supabase.from("salons").select("id").eq("owner_id", user.id).limit(1);
  if (!salons || salons.length === 0) return NextResponse.json({ error: "No salon found" }, { status: 404 });
  const salonId = salons[0].id;

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "No form data" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const document_type = formData.get("document_type") as string;
  
  if (!file || !document_type) return NextResponse.json({ error: "Missing file or document_type" }, { status: 400 });
  const allowedTypes = ['trade_license', 'professional_cert', 'hygiene_cert', 'id_proof', 'address_proof', 'other'];
  if (!allowedTypes.includes(document_type)) return NextResponse.json({ error: "Invalid document type" }, { status: 400 });

  const allowedMime = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowedMime.includes(file.type)) return NextResponse.json({ error: "Invalid file type. Only PDF, JPG, PNG allowed." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop();
  const fileName = `${salonId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const { data: uploadData, error: uploadErr } = await supabase.storage.from("salon-documents").upload(fileName, file);

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  const pathUrl = uploadData.path;

  // Insert into DB
  const { data: doc, error: dbErr } = await supabase.from("salon_documents").insert({
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing document id" }, { status: 400 });

  const { data: salons } = await supabase.from("salons").select("id").eq("owner_id", user.id);
  if (!salons || salons.length === 0) return NextResponse.json({ error: "No salon found" }, { status: 404 });
  const salonIds = salons.map((s) => s.id);

  const { data: doc, error: docErr } = await supabase.from("salon_documents").select("*").eq("id", id).single();
  if (docErr || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (!salonIds.includes(doc.salon_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete from storage
  await supabase.storage.from("salon-documents").remove([doc.file_url]);

  // Delete from DB
  const { error: delErr } = await supabase.from("salon_documents").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
