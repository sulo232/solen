import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const noteSchema = z.object({
  salon_id: z.string().uuid(),
  note: z.string().min(1).max(1000),
  note_type: z.enum(["permanent", "booking"]).default("permanent"),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const customerId = params.id;
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id is required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: notes, error } = await admin
    .from("client_notes")
    .select("id, note, note_type, created_by, created_at")
    .eq("customer_id", customerId)
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: notes || [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const customerId = params.id;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validated = noteSchema.parse(body);

    const admin = createAdminSupabaseClient();
    
    // Verify salon ownership or admin
    const { data: salon } = await admin.from("salons").select("owner_id").eq("id", validated.salon_id).single();
    if (salon?.owner_id !== session.user.id) {
      const { data: userProfile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
      if (userProfile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: note, error } = await admin
      .from("client_notes")
      .insert({
        salon_id: validated.salon_id,
        customer_id: customerId,
        note: validated.note,
        note_type: validated.note_type,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const customerId = params.id;
  const noteId = req.nextUrl.searchParams.get("note_id");
  const salonId = req.nextUrl.searchParams.get("salon_id");
  
  if (!noteId || !salonId) return NextResponse.json({ error: "note_id and salon_id are required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  
  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  if (salon?.owner_id !== session.user.id) {
    const { data: userProfile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await admin
    .from("client_notes")
    .delete()
    .eq("id", noteId)
    .eq("customer_id", customerId)
    .eq("salon_id", salonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
