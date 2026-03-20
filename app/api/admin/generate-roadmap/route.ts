export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Required: 30s timeout exceeds Edge limits
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

  // 8. Check API key — try multiple common env var names
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    // List which env vars we checked so the user knows exactly what to set
    return NextResponse.json(
      { error: "No Anthropic API key found. Checked: ANTHROPIC_API_KEY, CLAUDE_API_KEY, ANTHROPIC_KEY. Set one in Vercel environment variables." },
      { status: 500 }
    );
  }

  // 9. Call Claude API with 30s timeout
  const model = "claude-sonnet-4-20250514";
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: buildRoadmapSystemPrompt(),
        messages: [{ role: "user", content: buildRoadmapUserPrompt(featureReq) }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-roadmap] Claude API error:", response.status, errBody);
      let detail = `Claude ${response.status}`;
      try {
        const errJson = JSON.parse(errBody);
        detail = errJson.error?.message || errBody.slice(0, 300);
      } catch {
        detail = errBody.slice(0, 300);
      }
      return NextResponse.json({ error: `Roadmap generation failed: ${detail}` }, { status: 502 });
    }

    const result = await response.json();
    const roadmapMarkdown = result.content?.[0]?.text ?? "";

    if (!roadmapMarkdown) {
      console.error("[generate-roadmap] Empty response from Claude:", JSON.stringify(result).slice(0, 500));
      return NextResponse.json({ error: "Claude returned an empty response. Try again." }, { status: 502 });
    }

    // Track token usage for cost monitoring
    const tokenUsage = {
      input_tokens: result.usage?.input_tokens ?? 0,
      output_tokens: result.usage?.output_tokens ?? 0,
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
        claude_prompt: buildRoadmapUserPrompt(featureReq),
      })
      .eq("id", validated.requestId);

    return NextResponse.json({
      roadmap: roadmapMarkdown,
      version: newVersion,
      tokenUsage,
    });
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return NextResponse.json({ error: "Claude API timed out (30s). Try again." }, { status: 504 });
    }
    console.error("[generate-roadmap] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
