export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

// POST /api/coming-soon-notify — Email capture for Coming Soon pages
// Does NOT require authentication — anyone can sign up for notifications
export async function POST(request: NextRequest) {
  let body: { email?: string; feature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const feature = (body.feature ?? "default").slice(0, 64);

  if (!email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("coming_soon_signups")
      .upsert({ email, feature }, { onConflict: "email,feature" });

    if (error) {
      // Table may not exist yet — fail silently so the UX still works
      console.error("[coming-soon-notify] Supabase error:", error.message);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[coming-soon-notify] Unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
