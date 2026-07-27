import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerEnv } from "@/lib/env";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";

export async function autoTranslateDescription(textDe: string): Promise<string> {
  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey || !textDe.trim()) return "";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // input-abuse-06 (2026-07-27): textDe is a salon owner's own request-body field
    // (a request body is one of the trust-boundary categories wrapUntrustedInput exists
    // for), so it is fenced as data rather than concatenated straight into the prompt.
    const prompt = `Translate the following German salon description into natural, professional English. Ensure the tone is friendly and welcoming. DO NOT include any explanations, markdown formatting, or quotes around the returned text. Only return the translated text.\n\n${wrapUntrustedInput("SALON_DESCRIPTION", textDe)}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("[ai/translate] Failed to auto-translate:", err);
    return "";
  }
}
