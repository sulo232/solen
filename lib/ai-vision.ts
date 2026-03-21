// lib/ai-vision.ts — Gemini 2.0 Flash for auto-categorization
// Server-side only. GEMINI_API_KEY must never be exposed.

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIVisionResult } from "@/lib/types";

const VISION_PROMPT = `You are an expert beauty and hairstyle analyst. Analyze this image and return a JSON object with these fields:
- category: one of "hair", "beard", "nails", "makeup", "waxing"
- gender: one of "male", "female", "unisex"
- texture: one of "straight", "wavy", "curly", "coily", "protective", "bald" or null (only for hair/beard)
- style_name: a short style name in English (e.g. "Balayage", "French Bob", "Coffin Nails") or null
- tags: array of 3-8 descriptive tags in English
- description_de: 1-2 sentence description in German
- description_en: 1-2 sentence description in English
- description_fr: 1-2 sentence description in French
- description_it: 1-2 sentence description in Italian
- salon_script_de: what to tell the hairdresser in German (1 sentence) or null if not hair/beard
- cut_guide: brief technical cutting guide for professionals or null if not hair/beard

Return ONLY valid JSON, no markdown, no explanation.`;

// Simple in-memory cache to avoid re-analyzing the same image
const cache = new Map<string, AIVisionResult>();

export async function analyzeDiscoveryImage(imageUrl: string): Promise<AIVisionResult | null> {
  // Check cache first
  if (cache.has(imageUrl)) {
    return cache.get(imageUrl)!;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[ai-vision] GEMINI_API_KEY not set");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Fetch image as base64
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      console.error(`[ai-vision] Failed to fetch image: ${imageRes.status}`);
      return null;
    }
    const imageBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageRes.headers.get("content-type") ?? "image/jpeg";

    const result = await model.generateContent([
      VISION_PROMPT,
      { inlineData: { data: base64, mimeType } },
    ]);

    const text = result.response.text();
    // Strip any markdown code fences
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as AIVisionResult;

    // Cache the result
    cache.set(imageUrl, parsed);

    return parsed;
  } catch (err) {
    console.error("[ai-vision] Gemini failed:", err);
    return null; // admin categorizes manually
  }
}

/**
 * Analyze a TikTok video by its thumbnail (since we can't send video to Gemini easily).
 */
export async function analyzeDiscoveryTikTok(
  thumbnailUrl: string,
  title: string
): Promise<AIVisionResult | null> {
  if (!thumbnailUrl) return null;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageRes = await fetch(thumbnailUrl);
    if (!imageRes.ok) return null;
    const imageBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageRes.headers.get("content-type") ?? "image/jpeg";

    const prompt = `${VISION_PROMPT}\n\nAdditional context — this is a TikTok video thumbnail. Video title: "${title}"`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned) as AIVisionResult;
  } catch (err) {
    console.error("[ai-vision] Gemini TikTok analysis failed:", err);
    return null;
  }
}
