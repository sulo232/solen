export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, messageLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"];
const BLOCKED_EXTENSIONS = [".exe", ".sh", ".bat", ".cmd", ".ps1", ".scr"];

// POST /api/conversations/[id]/upload — Upload media to Supabase Storage
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  const disabled = await checkFeatureEnabled("messaging");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(messageLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Verify user is a participant
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, customer_id, salon_id")
    .eq("id", conversationId)
    .single();

  if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const admin = createAdminSupabaseClient();
  const fileName = `${conversationId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data: uploadData, error: uploadError } = await admin.storage
    .from("chat-media")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = admin.storage
    .from("chat-media")
    .getPublicUrl(uploadData.path);

  return NextResponse.json({
    url: publicUrl,
    type: file.type.startsWith("video/") ? "video" : "image",
  });
}
