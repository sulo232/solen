import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { adminTosNotifySchema, validateBody } from "@/lib/validations";
import { sendEmail, tosUpdateNotification } from "@/lib/email";
import { CURRENT_TOS_VERSION, TOS_EFFECTIVE_DATE } from "@/lib/tos-version";
import { getAppUrl } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { data, error: validationError } = validateBody(adminTosNotifySchema, body);
    if (validationError) {
      return NextResponse.json({ error: validationError.message }, { status: 400 });
    }

    let query = supabase
      .from("profiles")
      // using or instead of neq to also capture nulls
      .select("id, email, locale")
      .or(`tos_accepted_version.neq.${CURRENT_TOS_VERSION},tos_accepted_version.is.null`)
      .not("email", "is", null);

    if (data.target === "salon_partners") {
      query = query.eq("role", "salon_owner");
    } else if (data.target === "customers") {
      query = query.eq("role", "customer");
    }

    const { data: users, error: dbError } = await query;
    if (dbError) {
      throw dbError;
    }

    let sentCount = 0;
    const errors = [];
    let siteUrl: string;
    try {
      siteUrl = getAppUrl();
    } catch {
      console.warn("[admin/tos/notify] NEXT_PUBLIC_APP_URL not set, falling back to solen.ch");
      siteUrl = "https://solen.ch";
    }

    for (const user of users) {
      if (!user.email) continue;
      
      const locale = (user.locale as "de" | "en" | "fr" | "it") || "de";
      const payload = tosUpdateNotification(
        user.email,
        {
          tosVersion: CURRENT_TOS_VERSION,
          effectiveDate: TOS_EFFECTIVE_DATE,
          termsUrl: `${siteUrl}/${locale}/terms`
        },
        locale
      );

      try {
        await sendEmail(payload);
        sentCount++;
      } catch (err: any) {
        errors.push({ email: user.email, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      notified_count: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Admin TOS notify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
