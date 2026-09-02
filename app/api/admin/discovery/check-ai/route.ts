import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

/**
 * GET /api/admin/discovery/check-ai
 * Quick diagnostic — checks if GEMINI_API_KEY is set and working.
 * Admin-only.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const key = getServerEnv().GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ status: "missing", message: "GEMINI_API_KEY not set" });
  }

  const masked = key.slice(0, 8) + "..." + key.slice(-4);

  try {
    // input-abuse-06 (2026-07-27): no wrapUntrustedInput here by decision, not a miss.
    // The only prompt this file ever sends is the compile-time literal below; no
    // request body, DB value, or other outside-trust-boundary field ever reaches it.
    const model = getGeminiModel(key, { model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say 'key works' in 2 words");
    const text = result.response.text().trim();
    return NextResponse.json({ status: "ok", masked_key: masked, model: "gemini-2.5-flash", test_response: text });
  } catch (err) {
    return NextResponse.json({ status: "error", masked_key: masked, error: String(err) });
  }
}
