import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { CURRENT_TOS_VERSION } from "@/lib/tos-version";
import { validateBody, tosAcceptSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const disabled = await checkFeatureEnabled("bookings");
    if (disabled) return disabled;

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const banned = await checkUserBanned(user.id);
    if (banned) return banned;

    const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { data, error: validationError } = validateBody(tosAcceptSchema, body);
    if (validationError) {
      return NextResponse.json({ message: "Invalid request body", details: validationError.message }, { status: 400 });
    }

    if (data.version !== CURRENT_TOS_VERSION) {
      return NextResponse.json({ message: "Invalid TOS version string", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        tos_accepted_version: CURRENT_TOS_VERSION,
        tos_accepted_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (dbError) {
      console.error("Error updating TOS version:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, version: CURRENT_TOS_VERSION });
  } catch (err) {
    console.error("TOS accept error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
