// V3-D383 (2026-05-30): display formatting for discovery cards. The feed data is TikTok-scraped, so tags are
// inconsistently cased/joined and creator handles can be pure symbols. These helpers normalize for the card chip +
// creator line. Display-only — they never mutate stored data.

// Common haircut/style compounds that arrive as one word but read better as two.
const COMPOUND_FIX: Record<string, string> = {
  wolfcut: "Wolf Cut",
  buzzcut: "Buzz Cut",
  pixiecut: "Pixie Cut",
  butterflycut: "Butterfly Cut",
  curtainbangs: "Curtain Bangs",
  moneypiece: "Money Piece",
  lowfade: "Low Fade",
  midfade: "Mid Fade",
  highfade: "High Fade",
  taperfade: "Taper Fade",
  skinfade: "Skin Fade",
  babylights: "Babylights",
};

const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** First tag → a clean, consistently-cased chip label. Returns null when there's no usable tag. */
export function formatStyleTag(tags: string[] | null | undefined): string | null {
  const raw = tags?.[0]?.trim().toLowerCase();
  if (!raw) return null;
  if (COMPOUND_FIX[raw]) return COMPOUND_FIX[raw];
  return titleCase(raw);
}

/** Clean a scraped creator handle: strip junk symbols, drop pure-symbol/too-short names. Returns null to hide. */
export function formatCreator(name: string | null | undefined): string | null {
  if (!name) return null;
  // Trim leading/trailing characters that aren't letters, digits, dot or underscore.
  const clean = name.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}._]+$/gu, "").trim();
  // Require at least 2 chars and at least one letter — otherwise it's junk ("☆", "√").
  if (clean.length < 2 || !/\p{L}/u.test(clean)) return null;
  return clean;
}
