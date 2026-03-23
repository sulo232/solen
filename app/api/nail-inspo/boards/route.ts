export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailInspoBoardSchema } from "@/lib/validations";

// GET /api/nail-inspo/boards — List user's inspo boards
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data, error } = await supabase
    .from("nail_inspo_boards")
    .select("*, nail_inspo_images(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boards: data ?? [] });
}

// POST /api/nail-inspo/boards — Create new board (max 10)
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(nailInspoBoardSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const name = validated.name;

  // Max 10 boards per user
  const admin = createAdminSupabaseClient();
  const { count } = await admin
    .from("nail_inspo_boards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Maximum 10 boards allowed" }, { status: 400 });
  }

  const { data: board, error } = await admin
    .from("nail_inspo_boards")
    .insert({ user_id: user.id, name })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ board }, { status: 201 });
}

// DELETE /api/nail-inspo/boards?id=xxx — Delete board (images stay with board_id=null)
export async function DELETE(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = new URL(req.url).searchParams.get("id");
  if (!boardId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("nail_inspo_boards")
    .delete()
    .eq("id", boardId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
