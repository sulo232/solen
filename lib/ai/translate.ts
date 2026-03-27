import { GoogleGenerativeAI } from "@google/generative-ai";

export async function autoTranslateDescription(textDe: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !textDe.trim()) return "";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Translate the following German salon description into natural, professional English. Ensure the tone is friendly and welcoming. DO NOT include any explanations, markdown formatting, or quotes around the returned text. Only return the translated text.\n\nDescription:\n${textDe}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("[ai/translate] Failed to auto-translate:", err);
    return "";
  }
}
