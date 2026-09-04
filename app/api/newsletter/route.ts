export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().email().max(255),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP (public route)
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(newsletterSchema, body);
  if (error) {
    return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // newsletter_subscribers: supabase/migrations/20260904120000_coming_soon_and_newsletter_signups.sql
  // Service-role client on purpose: the table has RLS on and no policies, so the anon client
  // (createServerSupabaseClient) is refused on every insert. Same pattern as coming-soon-notify,
  // csp-report and cron_runs. Precedent for the admin client in an edge route: app/api/reviews/route.ts.
  const supabase: SupabaseClient = createAdminSupabaseClient();

  // Upsert to avoid duplicate errors
  const { error: dbError } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email: data.email }, { onConflict: "email" });

  if (dbError) {
    console.error("[newsletter] Supabase error:", dbError.message);
    return NextResponse.json({ message: "Subscription failed", code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
