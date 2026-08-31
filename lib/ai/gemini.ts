// lib/ai/gemini.ts
//
// Single bounded factory for the Gemini SDK. Every getGenerativeModel() call in
// this repo used to construct a model with no `timeout`, so a stalled Gemini
// request could hang forever (unlike this repo's raw fetch() calls, which are
// bounded via AbortSignal.timeout / an AbortController+setTimeout pair /
// Promise.race). RequestOptions.timeout is the SDK's own bound (ms), passed as
// the SECOND argument to getGenerativeModel().
//
// Callers keep their own api-key resolution (getServerEnv().GEMINI_API_KEY vs
// GOOGLE_AI_API_KEY differ by route): this factory only adds the timeout. This
// file never composes a prompt itself (no user-controlled text touches it), so
// wrapUntrustedInput does not apply here; callers still wrap their own prompts.

import { GoogleGenerativeAI, type ModelParams, type GenerativeModel } from "@google/generative-ai";

// 30000ms: text generation. The repo's existing raw-fetch bounds are 8000ms for
// third-party image hosts (lib/ai-vision.ts:230, 268, 286) and 10000ms for short
// gateway calls (lib/sms.ts, app/api/auth/verify-phone/send/route.ts,
// lib/search/embeddings.ts). Text generation is legitimately slower than both of
// those, so it gets a longer bound rather than reusing either one.
export const GEMINI_TIMEOUT_MS = 30000;

// 60000ms: image analysis (lib/ai-vision.ts). Legitimately slower than plain text
// generation, so it gets a longer bound than GEMINI_TIMEOUT_MS.
export const GEMINI_VISION_TIMEOUT_MS = 60000;

export function getGeminiModel(apiKey: string, params: ModelParams, timeoutMs?: number): GenerativeModel {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel(params, { timeout: timeoutMs ?? GEMINI_TIMEOUT_MS });
}
