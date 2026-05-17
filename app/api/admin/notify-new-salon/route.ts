export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, adminNewSalonNotification } from "@/lib/email";
import { validateBody } from "@/lib/validations";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import { z } from "zod";

const notifyNewSalonSchema = z.object({
  salon_name: z.string().min(1).max(200),
  email: z.string().email(),
  address: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
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
