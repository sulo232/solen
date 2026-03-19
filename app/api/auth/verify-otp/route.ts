export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";

const otpSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6, "Code muss 6 Ziffern haben"),
  type: z.enum(["signup", "email"]).default("signup"),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const parsed = otpSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ message: firstError }, { status: 400 });
  }

  const { email, token, type } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ session: data.session, user: data.user });
}
