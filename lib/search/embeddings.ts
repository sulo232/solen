import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerEnv } from "@/lib/env";

const EMBEDDING_MODEL = "text-embedding-004";

/**
 * Generate a 768-dim embedding for a text string using Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Build a searchable text representation of a service for embedding.
 */
export function buildServiceEmbeddingText(service: {
  name_de: string;
  name_en?: string;
  category: string;
  price?: number;
}): string {
  const parts = [
    service.name_de,
    service.name_en ?? "",
    `Kategorie: ${service.category}`,
  ];
  if (service.price) parts.push(`${service.price} CHF`);
  return parts.filter(Boolean).join(" | ");
}
