export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { z } from "zod";

const roomSchema = z.object({
  name: z.string().min(1).max(100),
  room_type: z.enum(["treatment", "sauna", "pool", "steam"]),
  capacity: z.number().int().min(1).max(50).default(1),
  prep_buffer_minutes: z.number().int().min(0).max(120).default(15),
  cooldown_buffer_minutes: z.number().int().min(0).max(120).default(10),
  equipment: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

async function authenticate() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const banned = await checkUserBanned(user.id);
  if (banned) return { error: banned };

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return { error: rateLimited };

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return { error: NextResponse.json({ error: "No salon" }, { status: 404 }) };

  return { user, salon, admin };
}

// GET /api/dashboard/spa/rooms
export async function GET() {
  const disabled = await checkFeatureEnabled("spa_features");
  if (disabled) return disabled;

  const auth = await authenticate();
  if ("error" in auth && auth.error) return auth.error;
  const { salon, admin } = auth as { user: any; salon: { id: string }; admin: ReturnType<typeof createAdminSupabaseClient> };

  const { data: rooms, error } = await admin
    .from("spa_treatment_rooms")
    .select("*")
    .eq("salon_id", salon.id)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: rooms ?? [] });
}

// POST /api/dashboard/spa/rooms
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("spa_features");
  if (disabled) return disabled;

  const auth = await authenticate();
  if ("error" in auth && auth.error) return auth.error;
  const { salon, admin } = auth as { user: any; salon: { id: string }; admin: ReturnType<typeof createAdminSupabaseClient> };

  const body = await req.json();
  const parsed = roomSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: room, error } = await admin
    .from("spa_treatment_rooms")
    .insert({ ...parsed.data, salon_id: salon.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: room });
}

// PUT /api/dashboard/spa/rooms?id=...
export async function PUT(req: NextRequest) {
  const disabled = await checkFeatureEnabled("spa_features");
  if (disabled) return disabled;

  const auth = await authenticate();
  if ("error" in auth && auth.error) return auth.error;
  const { salon, admin } = auth as { user: any; salon: { id: string }; admin: ReturnType<typeof createAdminSupabaseClient> };

  const roomId = req.nextUrl.searchParams.get("id");
  if (!roomId) return NextResponse.json({ error: "Missing room id" }, { status: 400 });

  const body = await req.json();
  const parsed = roomSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: room, error } = await admin
    .from("spa_treatment_rooms")
    .update(parsed.data)
    .eq("id", roomId)
    .eq("salon_id", salon.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: room });
}

// DELETE /api/dashboard/spa/rooms?id=...
export async function DELETE(req: NextRequest) {
  const disabled = await checkFeatureEnabled("spa_features");
  if (disabled) return disabled;

  const auth = await authenticate();
  if ("error" in auth && auth.error) return auth.error;
  const { salon, admin } = auth as { user: any; salon: { id: string }; admin: ReturnType<typeof createAdminSupabaseClient> };

  const roomId = req.nextUrl.searchParams.get("id");
  if (!roomId) return NextResponse.json({ error: "Missing room id" }, { status: 400 });

  const { error } = await admin
    .from("spa_treatment_rooms")
    .delete()
    .eq("id", roomId)
    .eq("salon_id", salon.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { success: true } });
}
