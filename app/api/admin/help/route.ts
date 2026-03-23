export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminHelpArticleSchema } from "@/lib/validations";
import { z } from "zod";

const helpArticleUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).max(50000).optional(),
  category: z.string().max(100).optional(),
  locale: z.enum(["de", "en", "fr", "it"]).optional(),
  published: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

// GET /api/admin/help — Admin: list all articles (including unpublished)
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("help_articles")
    .select("*")
    .order("category")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}

// POST /api/admin/help — Admin: create article
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminHelpArticleSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { slug, title, content, category, locale, published, sort_order } = validated;

  const { data, error } = await supabase
    .from("help_articles")
    .insert({
      slug,
      title,
      content,
      category,
      locale: locale || "de",
      published: published ?? false,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Article with this slug and locale already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent({
    actor_id: user.id,
    action: "help_article.create",
    target_type: "help_article",
    target_id: data.id,
    metadata: { slug, category },
  });

  return NextResponse.json({ article: data }, { status: 201 });
}

// PATCH /api/admin/help — Admin: update article
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(helpArticleUpdateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { id, ...updates } = validated;

  const { data, error } = await supabase
    .from("help_articles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    actor_id: user.id,
    action: "help_article.update",
    target_type: "help_article",
    target_id: id,
    metadata: { fields: Object.keys(updates) },
  });

  return NextResponse.json({ article: data });
}

// DELETE /api/admin/help — Admin: delete article
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("help_articles")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    actor_id: user.id,
    action: "help_article.delete",
    target_type: "help_article",
    target_id: id,
    metadata: {},
  });

  return NextResponse.json({ success: true });
}
