import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, newMessageNotification } from "@/lib/email";
import { applyRateLimit, messageLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createMessageSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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

  return NextResponse.json({ messages: data, items: data, total: count ?? 0, page, limit });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const disabled = await checkFeatureEnabled("messaging");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(messageLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(createMessageSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { content, message_type, image_url } = validated;

  const { data: message, error } = await supabase
    .from("messages")
    .insert({ conversation_id: id, sender_id: user.id, content: content.trim(), message_type, image_url: image_url ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Update conversation preview
  const { data: conv } = await supabase
    .from("conversations")
    .select("customer_id, salon_id, salons(name), profiles!customer_id(display_name, notification_email, locale)")
    .eq("id", id)
    .single();
  const isCustomer = conv?.customer_id === user.id;

  await supabase.from("conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_preview: content.slice(0, 100),
  }).eq("id", id);

  // Atomically increment unread counter for the recipient
  await supabase.rpc("increment_unread", { conv_id: id, is_customer_sender: isCustomer });

  // Email notification to recipient (fire-and-forget, best-effort)
  try {
    const admin = createAdminSupabaseClient();
    if (isCustomer) {
      // Sender = customer → notify salon owner
      const { data: salon } = await admin.from("salons").select("owner_id").eq("id", conv?.salon_id).single();
      if (salon?.owner_id) {
        const { data: ownerProfile } = await admin.from("profiles").select("notification_email, locale").eq("id", salon.owner_id).single();
        const { data: ownerUser } = await admin.auth.admin.getUserById(salon.owner_id);
        const ownerEmail = ownerUser?.user?.email;
        if (ownerEmail && ownerProfile?.notification_email !== false) {
          const locale = (ownerProfile?.locale ?? "de") as "de" | "en" | "fr";
          const payload = newMessageNotification(ownerEmail, {
            senderName: (conv as any)?.profiles?.display_name ?? "Kunde",
            preview: content.slice(0, 100),
            conversationUrl: `https://solen.ch/de/dashboard/messages`,
          }, locale);
          await sendEmail(payload);
        }
      }
    } else {
      // Sender = salon → notify customer
      const customerProfile = (conv as any)?.profiles;
      const { data: customerUser } = await admin.auth.admin.getUserById(conv?.customer_id ?? "");
      const customerEmail = customerUser?.user?.email;
      if (customerEmail && customerProfile?.notification_email !== false) {
        const locale = (customerProfile?.locale ?? "de") as "de" | "en" | "fr";
        const salonName = (conv as any)?.salons?.name ?? "Salon";
        const payload = newMessageNotification(customerEmail, {
          senderName: salonName,
          preview: content.slice(0, 100),
          conversationUrl: `https://solen.ch/de/account/messages`,
        }, locale);
        await sendEmail(payload);
      }
    }
  } catch { /* notification failure must not break the message send */ }

  return NextResponse.json({ data: message }, { status: 201 });
}
