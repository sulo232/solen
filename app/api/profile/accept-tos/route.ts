export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { tos_version } = await req.json();

    if (!tos_version) {
      return NextResponse.json({ message: "Missing TOS version" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        tos_version,
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
