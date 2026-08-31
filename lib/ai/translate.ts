import { getGeminiModel } from "@/lib/ai/gemini";
import { getServerEnv } from "@/lib/env";
import { wrapUntrustedInput } from "@/lib/ai/untrusted";

// exists-check: this file already held autoTranslateDescription (German -> English, salon
// description only, called from app/api/salons/route.ts:687 and
// app/api/salons/[slug]/route.ts:122). Owner 2026-07-27: "salon cant rlly translte every
// service they have yk like auto translate dont w ehave api for that". We do, and it was
// already wired , for ONE field in ONE direction. This generalises the SAME Gemini client to
// the four app locales and to any short salon-authored field, and keeps the old export so its
// two callers are untouched.

export type TranslateLocale = "de" | "en" | "fr" | "it";

const LANGUAGE_NAME: Record<TranslateLocale, string> = {
  de: "German",
  en: "English",
  fr: "French",
  it: "Italian",
};

/**
 * REGISTER, and this is a product decision rather than a prompt detail. Solen addresses
 * customers informally in German and Italian (measured 2026-07-27: de 492 informal vs 22
 * formal, it 312 vs 0). French is the outlier at 391 formal, and whether to change that is an
 * open owner question. Until it is answered, machine output follows the CATALOGUE, so
 * auto-translated text never contradicts the hand-written UI sitting around it. Change this
 * map the day the owner settles French, and the next translation run follows.
 */
const REGISTER: Record<TranslateLocale, string> = {
  de: "Address the reader informally (du), matching Solen's German UI.",
  en: "Address the reader in the neutral second person.",
  fr: "Address the reader formally (vous), matching Solen's existing French UI.",
  it: "Address the reader informally (tu), matching Solen's Italian UI.",
};

/**
 * What the field IS, so the model does not turn a service name into a sentence. A service
 * name must stay a name: "Herrenschnitt" becomes "Coupe homme", never "Une coupe de cheveux
 * pour hommes".
 */
const FIELD_RULE: Record<string, string> = {
  name: "This is a SERVICE NAME on a price list. Keep it a short noun phrase of the same shape and length. Do not add articles, explanations or punctuation.",
  // Tightened 2026-07-27 after a dry run produced REWRITES rather than translations
  // ("Urban Barbershop mit praezisen Schnitten" came back as "Barbershop d'excellence").
  // A translation that drops a fact is worse than no translation: the customer is told
  // something different, not something less.
  description: "This is a short description shown to customers. TRANSLATE it, do not summarise, shorten, rewrite or improve it. Every fact in the source must appear in the output: if the source lists what is included, the output lists the same things. Keep the length within 20 percent of the source.",
  about: "This is a salon's own about-us text. Preserve its voice.",
  label: "This is a UI label. Keep it as short as the source.",
};

function getModel() {
  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) return null;
  return getGeminiModel(apiKey, { model: "gemini-2.5-flash" });
}

/**
 * Translate one short salon-authored string into one target locale.
 *
 * Returns "" on any failure and never throws. A caller storing "" leaves the column empty, and
 * lib/i18n/localized-field.ts then falls back to German, which is the correct degraded state:
 * a failed translation must never overwrite a good source, and a half-translated row must
 * never look finished.
 */
export async function translateField(
  text: string,
  from: TranslateLocale,
  to: TranslateLocale,
  fieldKind: string = "description",
): Promise<string> {
  const m = getModel();
  if (!m || !text.trim() || from === to) return "";

  try {
    const rule = FIELD_RULE[fieldKind] ?? FIELD_RULE.description;
    // The text is a salon owner's own request-body field, one of the trust-boundary categories
    // wrapUntrustedInput exists for, so it is fenced as DATA rather than concatenated into the
    // instruction (input-abuse-06).
    const prompt =
      `Translate the following ${LANGUAGE_NAME[from]} text into natural, professional ` +
      `${LANGUAGE_NAME[to]} for a Swiss beauty and wellness booking marketplace.\n` +
      `${rule}\n${REGISTER[to]}\n` +
      `Swiss conventions: prices stay in CHF, and Swiss German spelling uses ss rather than ` +
      `the eszett.\n` +
      `Return ONLY the translated text. No explanation, no markdown, no surrounding quotes.\n\n` +
      wrapUntrustedInput("TEXT_TO_TRANSLATE", text);

    const out = (await m.generateContent(prompt)).response.text().trim();
    // A model that answers with a refusal or an explanation is a failure, not a translation.
    // Four times the source length is generous for any real translation and catches the
    // "I'm sorry, I can't..." shape without rejecting legitimately longer German compounds.
    if (!out || out.length > Math.max(60, text.length * 4)) return "";
    return out;
  } catch (err) {
    console.error("[ai/translate] failed:", err, { from, to, fieldKind });
    return "";
  }
}

/**
 * Translate one string into every OTHER app locale. Returns only the locales that succeeded,
 * so a caller can spread the result into an update without clobbering a column with "".
 *
 * The three targets run in parallel: one salon save costs one round trip, not three.
 */
export async function translateToLocales(
  text: string,
  from: TranslateLocale,
  fieldKind: string = "description",
): Promise<Partial<Record<TranslateLocale, string>>> {
  const targets = (["de", "en", "fr", "it"] as TranslateLocale[]).filter((l) => l !== from);
  const results = await Promise.all(targets.map((to) => translateField(text, from, to, fieldKind)));
  const out: Partial<Record<TranslateLocale, string>> = {};
  targets.forEach((to, i) => {
    if (results[i]) out[to] = results[i];
  });
  return out;
}

/**
 * @deprecated Use translateToLocales. Kept unchanged in behaviour so its two existing callers
 * (app/api/salons/route.ts, app/api/salons/[slug]/route.ts) keep working without an edit.
 */
export async function autoTranslateDescription(textDe: string): Promise<string> {
  return translateField(textDe, "de", "en", "description");
}
