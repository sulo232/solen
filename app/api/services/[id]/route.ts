export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, serviceUpdateSchema } from "@/lib/validations";

// GET /api/services/[id] — Get a single service
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  return NextResponse.json({ service: data });
}

// PATCH /api/services/[id] — Update a service
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Get service + verify ownership
  const { data: service } = await admin
    .from("services")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const ownerIdRaw = service.salons as unknown as { owner_id: string } | null;
  if (ownerIdRaw?.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(serviceUpdateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(validated)) {
    if (value !== undefined) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const { error } = await admin.from("services").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/services/[id] — Delete a service
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Get service + verify ownership
  const { data: service } = await admin
    .from("services")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const ownerIdRaw = service.salons as unknown as { owner_id: string } | null;
  if (ownerIdRaw?.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await admin.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
