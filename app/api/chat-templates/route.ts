export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

const DEFAULT_TEMPLATES = [
  "Ja, das machen wir! ✓",
  "Leider gerade ausgebucht 😔",
  "Gerne, schick mir ein Foto!",
  "Wir bestätigen deinen Termin!",
  "Preis auf Anfrage — welche Behandlung?",
];

const createTemplateSchema = z.object({
  text: z.string().min(1).max(200),
});

const deleteTemplateSchema = z.object({
  id: z.string().uuid(),
});

// GET /api/chat-templates?salon_id=X — Fetch templates for a salon
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("messaging");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the salon this user owns
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) {
    return NextResponse.json({ templates: DEFAULT_TEMPLATES.map((text, i) => ({ id: `default-${i}`, text, is_default: true })) });
  }

  const { data: templates } = await supabase
    .from("chat_templates")
    .select("*")
    .eq("salon_id", salon.id)
    .order("sort_order", { ascending: true });

  if (!templates || templates.length === 0) {
    return NextResponse.json({ templates: DEFAULT_TEMPLATES.map((text, i) => ({ id: `default-${i}`, text, is_default: true })) });
  }

  return NextResponse.json({ templates });
}

// POST /api/chat-templates — Create a new template
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("messaging");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(createTemplateSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 404 });

  // Check max 10 templates
  const { count } = await supabase
    .from("chat_templates")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id);

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Maximal 10 Vorlagen erlaubt" }, { status: 400 });
  }

  const { data: template, error: insertError } = await supabase
    .from("chat_templates")
    .insert({ salon_id: salon.id, text: data.text, sort_order: (count ?? 0) })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ template }, { status: 201 });
}

// DELETE /api/chat-templates — Delete a template
export async function DELETE(req: NextRequest) {
  const disabled = await checkFeatureEnabled("messaging");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(deleteTemplateSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Verify ownership via salon
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 404 });

  await supabase
    .from("chat_templates")
    .delete()
    .eq("id", data.id)
    .eq("salon_id", salon.id);

  return NextResponse.json({ success: true });
}
