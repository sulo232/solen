import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
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

  const supabase = await createServerSupabaseClient();

  // Upsert to avoid duplicate errors
  const { error: dbError } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email: data.email }, { onConflict: "email" });

  if (dbError) {
    return NextResponse.json({ message: "Subscription failed", code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
