export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, profileAcceptTosSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const rawBody = await req.json().catch(() => ({}));
    const { data: validated, error: validationError } = validateBody(profileAcceptTosSchema, rawBody);
    if (validationError) {
      return NextResponse.json({ message: validationError.message }, { status: 400 });
    }
    const { tos_version } = validated;

    const { error } = await supabase
      .from("profiles")
      .update({
        tos_accepted_version: tos_version,
        tos_accepted_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("[api/profile/accept-tos] error:", error);
      return NextResponse.json({ message: "Failed to update TOS" }, { status: 500 });
    }

    await logAuditEvent(req, user.id, "account.tos_accepted", "user", user.id, { tos_version });

    return NextResponse.json({ message: "TOS accepted successfully" });

  } catch (error) {
    console.error("[api/profile/accept-tos] unknown error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
