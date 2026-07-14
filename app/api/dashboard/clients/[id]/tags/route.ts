import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { z } from "zod";

const tagSchema = z.object({
  salon_id: z.string().uuid(),
  tag: z.string().min(1).max(30),
  color: z.enum(["gray", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"]).default("gray"),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = id;
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id is required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Verify salon ownership or admin
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  if (salon?.owner_id !== user.id) {
    const { data: userProfile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: tags, error } = await admin
    .from("client_tags")
    .select("id, tag, color, created_at")
    .eq("customer_id", customerId)
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tags: tags || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = id;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json();
    const validated = tagSchema.parse(body);

    const admin = createAdminSupabaseClient();
    
    // Verify salon ownership or admin
    const { data: salon } = await admin.from("salons").select("owner_id").eq("id", validated.salon_id).single();
    if (salon?.owner_id !== user.id) {
      const { data: userProfile } = await admin.from("profiles").select("role").eq("id", user.id).single();
      if (userProfile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const belongs = await clientBelongsToSalon(admin, validated.salon_id, customerId);
    if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

    const { data: tag, error } = await admin
      .from("client_tags")
      .insert({
        salon_id: validated.salon_id,
        customer_id: customerId,
        tag: validated.tag,
        color: validated.color,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = id;
  const tagId = req.nextUrl.searchParams.get("tag_id");
  const salonId = req.nextUrl.searchParams.get("salon_id");
  
  if (!tagId || !salonId) return NextResponse.json({ error: "tag_id and salon_id are required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  if (salon?.owner_id !== user.id) {
    const { data: userProfile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Parity with POST above (pure defense-in-depth: the delete below is already
  // triple-scoped by id + customer_id + salon_id, this just matches the explicit
  // client-salon membership check POST already does).
  const belongs = await clientBelongsToSalon(admin, salonId, customerId);
  if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

  const { error } = await admin
    .from("client_tags")
    .delete()
    .eq("id", tagId)
    .eq("customer_id", customerId)
    .eq("salon_id", salonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
