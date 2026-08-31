import { getGeminiModel } from "@/lib/ai/gemini";
import type { SalonCategory } from "@/lib/types";
import { getServerEnv } from "@/lib/env";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";

const VALID_CATEGORIES: SalonCategory[] = [
  "coiffeur", "barbershop", "nails", "spa"
];

/**
 * Use Gemini to detect which category a search query belongs to.
 * Returns null if ambiguous or not detectable.
 */
export async function detectCategory(
  query: string
): Promise<SalonCategory | null> {
  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = getGeminiModel(apiKey, { model: "gemini-2.0-flash" });

  const prompt = `You are a beauty/wellness category classifier for a Swiss booking platform.
Given a user search query, return ONLY the single most likely category from this list:
coiffeur, barbershop, nails, spa

If the query is ambiguous or not related to beauty, return "unknown".

${wrapUntrustedInput("SEARCH_QUERY", query)}

Return ONLY the category word, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().toLowerCase();
    if (VALID_CATEGORIES.includes(text as SalonCategory)) {
      return text as SalonCategory;
    }
    return null;
  } catch {
    return null;
  }
}
