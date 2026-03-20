// lib/content-flags.ts — Auto-flagging for user/salon content
// NOT flagged = auto-publish (status: 'published')
// Flagged = admin review (status: 'flagged')

const BLOCKED_WORDS_DE = [
  "arschloch", "scheiße", "hurensohn", "wichser", "fotze", "missgeburt",
  "nazi", "heil", "neger", "schwuchtel", "spast", "behindert",
];

const BLOCKED_WORDS_EN = [
  "fuck", "shit", "bitch", "nigger", "faggot", "retard", "cunt",
  "asshole", "whore", "slut", "dick", "porn", "nude",
];

const BLOCKED_WORDS_FR = [
  "putain", "merde", "connard", "salope", "enculé", "nègre",
  "pédé", "pute", "bordel", "ta gueule",
];

const ALL_BLOCKED = [...BLOCKED_WORDS_DE, ...BLOCKED_WORDS_EN, ...BLOCKED_WORDS_FR];

interface FlagResult {
  flagged: boolean;
  reasons: string[];
}

/**
 * Check content for auto-flagging.
 * Returns { flagged: false } for clean content (auto-publish).
 * Returns { flagged: true, reasons: [...] } for flagged content (admin review).
 */
export function checkContentFlags(opts: {
  text?: string | null;
  tags?: string[];
  imageWidth?: number;
  imageHeight?: number;
  gender?: string | null;
  dailyPostCount?: number;
}): FlagResult {
  const reasons: string[] = [];

  // Check text for blocked words
  if (opts.text) {
    const lower = opts.text.toLowerCase();
    for (const word of ALL_BLOCKED) {
      if (lower.includes(word)) {
        reasons.push(`blocked_word: ${word}`);
        break; // One match is enough
      }
    }
  }

  // Check tags for blocked words
  if (opts.tags) {
    for (const tag of opts.tags) {
      const lower = tag.toLowerCase();
      for (const word of ALL_BLOCKED) {
        if (lower.includes(word)) {
          reasons.push(`blocked_tag: ${tag}`);
          break;
        }
      }
    }
  }

  // Check image dimensions (too small = suspicious)
  if (opts.imageWidth && opts.imageHeight) {
    if (opts.imageWidth < 200 || opts.imageHeight < 200) {
      reasons.push("image_too_small");
    }
  }

  // Missing gender
  if (!opts.gender) {
    reasons.push("missing_gender");
  }

  // Rate limit: more than 3 posts per day
  if (opts.dailyPostCount !== undefined && opts.dailyPostCount >= 3) {
    reasons.push("daily_rate_exceeded");
  }

  return {
    flagged: reasons.length > 0,
    reasons,
  };
}

/**
 * Check a comment for blocked words.
 */
export function checkCommentFlags(text: string): FlagResult {
  const reasons: string[] = [];
  const lower = text.toLowerCase();

  for (const word of ALL_BLOCKED) {
    if (lower.includes(word)) {
      reasons.push(`blocked_word: ${word}`);
      break;
    }
  }

  // Spam detection: repeated characters
  if (/(.)\1{9,}/.test(text)) {
    reasons.push("spam_repeated_chars");
  }

  // Spam detection: too many URLs
  const urlCount = (text.match(/https?:\/\//g) ?? []).length;
  if (urlCount > 2) {
    reasons.push("spam_too_many_urls");
  }

  return {
    flagged: reasons.length > 0,
    reasons,
  };
}

export type { FlagResult };
