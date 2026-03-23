export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { INTAKE_TEMPLATES } from "@/lib/intake-templates";

// GET /api/intake/templates — Return all intake form templates
export async function GET() {
  return NextResponse.json({ templates: INTAKE_TEMPLATES });
}
