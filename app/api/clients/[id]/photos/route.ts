export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/clients/[id]/photos — Get client photos (salon owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("client_photos")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/clients/[id]/photos — Upload a client photo to Supabase Storage
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const photoType = (formData.get("photo_type") as string) ?? "progress";
  const bookingId = formData.get("booking_id") as string | null;

  if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });
  if (!["before", "after", "progress"].includes(photoType)) {
    return NextResponse.json({ error: "photo_type must be before, after, or progress" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${salon.id}/${customerId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("client-photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("client-photos").getPublicUrl(path);

  // Save record
  const { data: photo, error } = await supabase
    .from("client_photos")
    .insert({
      salon_id: salon.id,
      customer_id: customerId,
      booking_id: bookingId ?? null,
      photo_url: urlData.publicUrl,
      photo_type: photoType,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: photo }, { status: 201 });
}
