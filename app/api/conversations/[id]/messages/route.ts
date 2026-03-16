import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("messages")
    .select("*, profiles!sender_id(display_name, avatar_url)", { count: "exact" })
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Mark messages as read + reset unread count
  const now = new Date().toISOString();
  await supabase
    .from("messages")
    .update({ read_at: now })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  // Update unread count on conversation
  const { data: conv } = await supabase.from("conversations").select("customer_id").eq("id", id).single();
  const isCustomer = conv?.customer_id === user.id;
  await supabase
    .from("conversations")
    .update(isCustomer ? { unread_count_customer: 0 } : { unread_count_salon: 0 })
    .eq("id", id);

  return NextResponse.json({ items: data, total: count ?? 0, page, limit });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { content, message_type = "text", image_url } = body;

  if (!content?.trim()) return NextResponse.json({ message: "content required", code: "VALIDATION_ERROR" }, { status: 400 });

  const { data: message, error } = await supabase
    .from("messages")
    .insert({ conversation_id: id, sender_id: user.id, content: content.trim(), message_type, image_url: image_url ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Update conversation preview + unread count
  const { data: conv } = await supabase.from("conversations").select("customer_id").eq("id", id).single();
  const isCustomer = conv?.customer_id === user.id;
  await supabase.from("conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_preview: content.slice(0, 100),
    ...(isCustomer ? { unread_count_salon: supabase.rpc("coalesce", {}) } : { unread_count_customer: supabase.rpc("coalesce", {}) }),
  }).eq("id", id);

  // Simpler unread increment
  await supabase.rpc("increment_unread", { conv_id: id, is_customer_sender: isCustomer }).catch(() => {});

  return NextResponse.json({ data: message }, { status: 201 });
}
