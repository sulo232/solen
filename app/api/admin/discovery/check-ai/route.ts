import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/admin/discovery/check-ai
 * Quick diagnostic — checks if GEMINI_API_KEY is set and working.
 * Admin-only.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ status: "missing", message: "GEMINI_API_KEY not set" });
  }

  const masked = key.slice(0, 8) + "..." + key.slice(-4);

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say 'key works' in 2 words");
    const text = result.response.text().trim();
    return NextResponse.json({ status: "ok", masked_key: masked, model: "gemini-2.5-flash", test_response: text });
  } catch (err) {
    return NextResponse.json({ status: "error", masked_key: masked, error: String(err) });
  }
}
