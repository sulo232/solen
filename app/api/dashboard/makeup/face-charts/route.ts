import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { validateBody } from "@/lib/validations";

const getSchema = z.object({
  salon_id: z.string().uuid(),
  client_id: z.string().uuid().optional(),
});

const postSchema = z.object({
  salon_id: z.string().uuid(),
  client_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  foundation_brand: z.string().max(200).optional(),
  foundation_shade: z.string().max(200).optional(),
  undertone: z.enum(["warm", "cool", "neutral"]).optional(),
  zones: z.record(z.string(), z.string()).optional(),
  eye_look: z.string().max(500).optional(),
  lip_colour: z.string().max(200).optional(),
  products_used: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    shade: z.string().optional(),
  })).optional(),
  reference_photo_url: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl.searchParams;
  const parsed = getSchema.safeParse({
    salon_id: url.get("salon_id"),
    client_id: url.get("client_id"),
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  let query = supabase
    .from("makeup_face_charts")
    .select("*")
    .eq("salon_id", parsed.data.salon_id)
    .order("created_at", { ascending: false });

  if (parsed.data.client_id) {
    query = query.eq("client_id", parsed.data.client_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: valErr } = validateBody(postSchema, body);
  if (valErr) return NextResponse.json({ error: valErr.message }, { status: 400 });

  const { data, error } = await supabase
    .from("makeup_face_charts")
    .insert(validated)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
