export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Required: 30s+ timeout exceeds Edge limits
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, roadmapLimiter } from "@/lib/ratelimit";
import { validateBody, generateRoadmapSchema } from "@/lib/validations";
import { buildRoadmapSystemPrompt, buildRoadmapUserPrompt } from "@/lib/editor-prompts";

export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("visual_editor");
  if (disabled) return disabled;

  // 2. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Admin role
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Strict rate limit (5/min to control costs)
  const rateLimited = await applyRateLimit(roadmapLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 6. Validation
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { data: validated, error: valError } = validateBody(generateRoadmapSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // 7. Fetch feature request
  const admin = createAdminSupabaseClient();
  const { data: featureReq } = await admin
    .from("feature_requests").select("*").eq("id", validated.requestId).single();
  if (!featureReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // 8. Check API key — Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured. Set it in Vercel environment variables." },
      { status: 500 }
    );
  }

  // 9. Call Gemini API with 60s timeout
  const model = "gemini-2.0-flash";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildRoadmapSystemPrompt() }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: buildRoadmapUserPrompt(featureReq) }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
          },
        }),
        signal: AbortSignal.timeout(60000), // 60s timeout (Gemini can be slower)
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-roadmap] Gemini API error:", response.status, errBody);
      return NextResponse.json({ error: "Roadmap generation failed", details: response.status }, { status: 502 });
    }

    const result = await response.json();
    const roadmapMarkdown = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!roadmapMarkdown) {
      console.error("[generate-roadmap] Empty response from Gemini:", JSON.stringify(result).slice(0, 500));
      return NextResponse.json({ error: "Gemini returned an empty response. Try again." }, { status: 502 });
    }

    // Track token usage for cost monitoring
    const tokenUsage = {
      input_tokens: result.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: result.usageMetadata?.candidatesTokenCount ?? 0,
      model,
      generated_at: new Date().toISOString(),
    };

    // Save roadmap + increment version + store tokens
    const newVersion = (featureReq.roadmap_version ?? 0) + 1;
    await admin.from("feature_requests")
      .update({
        generated_roadmap: roadmapMarkdown,
        status: "roadmap_generated",
        roadmap_version: newVersion,
        token_usage: tokenUsage,
        claude_prompt: buildRoadmapUserPrompt(featureReq), // keeping column name for compat
      })
      .eq("id", validated.requestId);

    return NextResponse.json({
      roadmap: roadmapMarkdown,
      version: newVersion,
      tokenUsage,
    });
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return NextResponse.json({ error: "Gemini API timed out (60s). Try again." }, { status: 504 });
    }
    console.error("[generate-roadmap] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
