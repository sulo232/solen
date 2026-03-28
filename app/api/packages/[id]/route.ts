export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/ratelimit";

// PATCH /api/packages/[id] — Toggle is_active on a service package
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json();

  // Verify the package belongs to a salon owned by this user
  const { data: pkg } = await supabase
    .from("service_packages")
    .select("id, salon_id, salons!inner(owner_id)")
    .eq("id", params.id)
    .single();

  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((pkg as any).salons?.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateFields: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") updateFields.is_active = body.is_active;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("service_packages")
    .update(updateFields)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
