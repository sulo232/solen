export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { z } from "zod";

const journalSchema = z.object({
  client_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  staff_member_id: z.string().uuid().optional(),
  tension_areas: z.array(z.string()).default([]),
  pain_level: z.number().int().min(1).max(10),
  skin_condition: z.string().max(500).optional(),
  pressure_preference: z.string().max(50).optional(),
  products_used: z.array(z.string()).default([]),
  aftercare_notes: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
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

// GET /api/dashboard/spa/wellness-journal?client_id=...
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("spa_features");
  if (disabled) return disabled;

  const auth = await authenticate();
  if ("error" in auth && auth.error) return auth.error;
  const { salon, admin } = auth as { user: any; salon: { id: string }; admin: ReturnType<typeof createAdminSupabaseClient> };

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "Missing client_id" }, { status: 400 });

  const { data: entries, error } = await admin
    .from("wellness_journals")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: entries ?? [] });
}

// POST /api/dashboard/spa/wellness-journal
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("spa_features");
  if (disabled) return disabled;

  const auth = await authenticate();
  if ("error" in auth && auth.error) return auth.error;
  const { salon, admin } = auth as { user: any; salon: { id: string }; admin: ReturnType<typeof createAdminSupabaseClient> };

  const body = await req.json();
  const parsed = journalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: entry, error } = await admin
    .from("wellness_journals")
    .insert({ ...parsed.data, salon_id: salon.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: entry });
}
