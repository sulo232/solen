import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";
import { validateBody } from "@/lib/validations";

const VALID_STATUSES = ["trial_pending", "trial_done", "look_approved", "day_of_scheduled", "completed"] as const;

const getSchema = z.object({
  salon_id: z.string().uuid(),
  client_id: z.string().uuid().optional(),
});

const postSchema = z.object({
  salon_id: z.string().uuid(),
  client_id: z.string().uuid(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_type: z.string().max(100).default("bridal"),
  trial_booking_id: z.string().uuid().optional(),
  inspiration_urls: z.array(z.string().url()).optional(),
  notes: z.string().max(2000).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VALID_STATUSES).optional(),
  trial_booking_id: z.string().uuid().optional(),
  final_booking_id: z.string().uuid().optional(),
  approved_look_photo_url: z.string().url().optional(),
  inspiration_urls: z.array(z.string().url()).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl.searchParams;
  const parsed = getSchema.safeParse({
    salon_id: url.get("salon_id"),
    client_id: url.get("client_id"),
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  let query = supabase
    .from("bridal_workflows")
    .select("*")
    .eq("salon_id", parsed.data.salon_id)
    .order("event_date", { ascending: true });

  if (parsed.data.client_id) {
    query = query.eq("client_id", parsed.data.client_id);
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
    .from("bridal_workflows")
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

  const { id, status: newStatus, ...updateFields } = validated;

  // Sequential status transition validation
  if (newStatus) {
    const { data: current, error: fetchErr } = await supabase
      .from("bridal_workflows")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchErr || !current) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    const currentIdx = VALID_STATUSES.indexOf(current.status as typeof VALID_STATUSES[number]);
    const newIdx = VALID_STATUSES.indexOf(newStatus);

    // Can only advance one step at a time
    if (newIdx !== currentIdx + 1) {
      return NextResponse.json(
        { error: `Invalid transition: ${current.status} → ${newStatus}. Must advance sequentially.` },
        { status: 400 }
      );
    }

    Object.assign(updateFields, { status: newStatus });
  }

  const { data, error } = await supabase
    .from("bridal_workflows")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
