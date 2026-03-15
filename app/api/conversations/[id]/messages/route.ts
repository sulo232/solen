import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/conversations/[id]/messages
 * Returns paginated messages (newest first), marks messages as read.
 *
 * POST /api/conversations/[id]/messages
 * Send a message. Body: { content, message_type?, image_url? }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const page  = parseInt(new URL(request.url).searchParams.get("page") ?? "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data: messages, count, error } = await supabase
    .from("messages")
    .select("*, profiles!messages_sender_id_fkey(display_name, avatar_url)", { count: "exact" })
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Mark unread messages as read (messages sent by others)
  const unreadIds = messages
    ?.filter((m) => m.sender_id !== user.id && !m.read_at)
    .map((m) => m.id) ?? [];

  if (unreadIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);

    // Determine which unread counter to reset
    const { data: conv } = await supabase
      .from("conversations")
      .select("customer_id")
      .eq("id", id)
      .single();

    const field = conv?.customer_id === user.id
      ? "unread_count_customer"
      : "unread_count_salon";

    await supabase
      .from("conversations")
      .update({ [field]: 0 })
      .eq("id", id);
  }

  return NextResponse.json({ items: messages ?? [], total: count ?? 0, page, limit });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { content, message_type = "text", image_url } = body;

  if (!content?.trim()) {
    return NextResponse.json({ message: "content is required", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id:       user.id,
      content:         content.trim(),
      message_type,
      image_url:       image_url ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Update conversation metadata
  await supabase
    .from("conversations")
    .update({
      last_message_at:      message.created_at,
      last_message_preview: content.trim().substring(0, 100),
    })
    .eq("id", id);

  // Increment the recipient's unread counter
  const { data: conv } = await supabase
    .from("conversations")
    .select("customer_id, salons(owner_id)")
    .eq("id", id)
    .single();

  if (conv) {
    const isCustomer = conv.customer_id === user.id;
    const field = isCustomer ? "unread_count_salon" : "unread_count_customer";
    await supabase.rpc("increment_unread", { conv_id: id, field_name: field });
  }

  return NextResponse.json(message, { status: 201 });
}
