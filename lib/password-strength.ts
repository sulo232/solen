/**
 * Local password strength scorer (V3-D453, 2026-07-16, ig1).
 *
 * Replaces composition gating (uppercase / digit required) with a real entropy
 * read. The server schema (`lib/validations.ts` signupSchema) only enforces
 * `min(8).max(200)`: composition rules were pure friction that rejected
 * strong passphrases the server would happily accept. This scorer backs the
 * strength bar on the register + reset-password auth pages.
 *
 * No `zxcvbn` dependency (owner directive: don't npm install it). This is a
 * small local heuristic, not a full dictionary-attack model:
 *   - length is the dominant signal (longer = safer, by a wide margin)
 *   - distinct character classes are a MINOR bonus, never a requirement
 *   - a tiny blocklist penalizes the handful of obviously-weak patterns:
 *     the password being (a substring of) the user's own email, "solen",
 *     "password"/"passwort", a repeated run ("aaaa"), or a sequential run
 *     ("1234", "abcd").
 */

export type PasswordStrengthLevel = "weak" | "fair" | "strong";

export type PasswordStrengthCause =
  | "tooShort"
  | "commonWord"
  | "emailMatch"
  | "repeated"
  | "sequential"
  | "addLength"
  | "clear";

export interface PasswordStrengthResult {
  /** 0 (empty/trivial) to 4 (strong). Gate submit on score >= 2. */
  score: 0 | 1 | 2 | 3 | 4;
  /** Bucketed label for the strength bar / copy. */
  level: PasswordStrengthLevel;
  /** The single most relevant reason for the current score. "clear" = no issue to report. */
  cause: PasswordStrengthCause;
}

const BLOCKLIST_WORDS = ["password", "passwort", "solen"];

/** 3+ identical characters in a row, e.g. "aaaa", "1111". */
function hasRepeatedRun(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

/** 4+ consecutive ascending or descending char codes, e.g. "abcd", "4321". */
function hasSequentialRun(password: string, minLen = 4): boolean {
  const s = password.toLowerCase();
  let asc = 1;
  let desc = 1;
  for (let i = 1; i < s.length; i++) {
    const prev = s.charCodeAt(i - 1);
    const curr = s.charCodeAt(i);
    if (curr === prev + 1) {
      asc++;
      desc = 1;
    } else if (curr === prev - 1) {
      desc++;
      asc = 1;
    } else {
      asc = 1;
      desc = 1;
    }
    if (asc >= minLen || desc >= minLen) return true;
  }
  return false;
}

function levelFromScore(score: number): PasswordStrengthLevel {
  if (score >= 4) return "strong";
  if (score >= 2) return "fair";
  return "weak";
}

/**
 * Score a candidate password. `email` (optional) lets the email-prefix check
 * run, pass the value currently in the email field, unvalidated is fine.
 *
 * scorePassword("Tr0ub4dor&3") -> length-dominant, no pattern hit
 * scorePassword("solen2026") -> commonWord ("solen")
 * scorePassword("maxmuster123", { email: "maxmuster@gmail.com" }) -> emailMatch
 */
export function scorePassword(password: string, opts?: { email?: string }): PasswordStrengthResult {
  if (!password) return { score: 0, level: "weak", cause: "tooShort" };

  const lower = password.toLowerCase();

  // Length is dominant.
  let lengthPoints = 0;
  if (password.length >= 16) lengthPoints = 3;
  else if (password.length >= 12) lengthPoints = 2;
  else if (password.length >= 8) lengthPoints = 1;

  // Distinct character classes are a minor bonus only, never a requirement.
  let classes = 0;
  if (/[a-z]/.test(password)) classes++;
  if (/[A-Z]/.test(password)) classes++;
  if (/[0-9]/.test(password)) classes++;
  if (/[^a-zA-Z0-9]/.test(password)) classes++;
  const classBonus = classes >= 3 ? 1 : 0;

  // Tiny blocklist penalty, most severe cause wins.
  let penalty = 0;
  let cause: PasswordStrengthCause = "clear";

  if (BLOCKLIST_WORDS.some((w) => lower.includes(w))) {
    penalty += 2;
    cause = "commonWord";
  }

  const emailPrefix = opts?.email?.split("@")[0]?.toLowerCase().trim();
  if (cause === "clear" && emailPrefix && emailPrefix.length >= 3 && lower.includes(emailPrefix)) {
    penalty += 2;
    cause = "emailMatch";
  }

  if (hasRepeatedRun(password)) {
    penalty += 1;
    if (cause === "clear") cause = "repeated";
  }

  if (hasSequentialRun(password)) {
    penalty += 1;
    if (cause === "clear") cause = "sequential";
  }

  const raw = lengthPoints + classBonus - penalty;
  const score = Math.max(0, Math.min(4, raw)) as PasswordStrengthResult["score"];

  if (password.length < 8) {
    cause = "tooShort";
  } else if (cause === "clear" && score < 2) {
    cause = "addLength";
  }

  return { score, level: levelFromScore(score), cause };
}
