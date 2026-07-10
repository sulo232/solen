export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, adminNewSalonNotification } from "@/lib/email";
import { validateBody } from "@/lib/validations";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const notifyNewSalonSchema = z.object({
  salon_name: z.string().min(1).max(200),
  email: z.string().email(),
  address: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  // No caller in the codebase (checked, no route/component references
  // /api/admin/notify-new-salon); admin-gated per the other /api/admin/* routes
  // (mirrors app/api/admin/salon-of-month/route.ts and app/api/admin/commission/route.ts).
  const authSupabase = await createServerSupabaseClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const adminEmail = getServerEnv().ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[notify-new-salon] ADMIN_EMAIL not configured — skipping notification");
    return NextResponse.json({ ok: true, skipped: "admin_email_missing" });
  }

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(notifyNewSalonSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  await sendEmail(adminNewSalonNotification(adminEmail, { salon: validated.salon_name, email: validated.email, address: validated.address ?? "" }));
  return NextResponse.json({ ok: true });
}
