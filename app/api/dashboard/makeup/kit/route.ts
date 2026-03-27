import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { validateBody } from "@/lib/validations";

const getSchema = z.object({
  salon_id: z.string().uuid(),
  category: z.string().max(50).optional(),
});

const postSchema = z.object({
  salon_id: z.string().uuid(),
  brand: z.string().min(1).max(200),
  product_name: z.string().min(1).max(200),
  shade: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  quantity: z.number().int().min(0).default(1),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cost_per_unit: z.number().min(0).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl.searchParams;
  const parsed = getSchema.safeParse({
    salon_id: url.get("salon_id"),
    category: url.get("category") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  let query = supabase
    .from("makeup_kit_items")
    .select("*")
    .eq("salon_id", parsed.data.salon_id)
    .eq("is_active", true)
    .order("brand", { ascending: true });

  if (parsed.data.category) {
    query = query.eq("category", parsed.data.category);
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
    .from("makeup_kit_items")
    .insert(validated)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: valErr } = validateBody(patchSchema, body);
  if (valErr) return NextResponse.json({ error: valErr.message }, { status: 400 });

  const { id, ...updateFields } = validated;
  const { data, error } = await supabase
    .from("makeup_kit_items")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
