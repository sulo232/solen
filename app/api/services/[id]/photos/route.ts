export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST /api/services/[id]/photos — Upload service photos to service-photos bucket
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: serviceId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify service belongs to user's salon
  const { data: service } = await supabase
    .from("services")
    .select("id, salon_id, photo_urls, salons(owner_id)")
    .eq("id", serviceId)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const owner = (service.salons as unknown as { owner_id: string })?.owner_id;
  if (owner !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${service.salon_id}/${serviceId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("service-photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("service-photos").getPublicUrl(path);

  // Append to service photo_urls array
  const currentUrls = (service.photo_urls as string[]) ?? [];
  const { error: updateError } = await supabase
    .from("services")
    .update({ photo_urls: [...currentUrls, urlData.publicUrl] })
    .eq("id", serviceId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ data: { url: urlData.publicUrl } }, { status: 201 });
}
