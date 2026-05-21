export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { z } from "zod";

const suggestSchema = z.object({
  customerMessage: z.string().min(1).max(1000),
  salonName: z.string().min(1).max(200),
  salonServices: z.array(z.string()).max(50).default([]),
});

// POST /api/chat/suggest — Get AI-suggested reply for salon owner
export async function POST(req: NextRequest) {
  // If no Gemini key configured, return 204 silently
  const geminiKey = getServerEnv().GEMINI_API_KEY;
  if (!geminiKey) {
    return new NextResponse(null, { status: 204 });
  }

  const disabled = await checkFeatureEnabled("messaging");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(suggestSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Du bist ein freundlicher Assistent für den Salon "${data.salonName}".
Der Salon bietet folgende Services an: ${data.salonServices.join(", ")}.
Ein Kunde hat folgende Nachricht geschrieben: "${data.customerMessage}"
Antworte kurz, freundlich und professionell auf Deutsch. Maximal 2 Sätze.`,
            }],
          }],
        }),
      }
    );

    if (!response.ok) {
      return new NextResponse(null, { status: 204 });
    }

    const result = await response.json();
    const suggestion = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!suggestion) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ suggestion });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
