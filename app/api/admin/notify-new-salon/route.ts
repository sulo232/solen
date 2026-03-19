export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, adminNewSalonNotification } from "@/lib/email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@solen.ch";

export async function POST(req: NextRequest) {
  const { salon_name, email, address } = await req.json();
  await sendEmail(adminNewSalonNotification(ADMIN_EMAIL, { salon: salon_name, email, address }));
  return NextResponse.json({ ok: true });
}
