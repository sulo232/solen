import { createAdminSupabaseClient } from "@/lib/supabase";

// Blocked words — German, English, French offensive terms (word-boundary matched)
const BLOCKED_WORDS = [
  // German slurs/profanity
  "hurensohn", "missgeburt", "spasti", "behindert", "schwuchtel", "fotze",
  "wichser", "arschloch", "schlampe", "neger", "kanake", "zigeuner",
  // English slurs/profanity
  "nigger", "nigga", "faggot", "retard", "cunt", "whore", "kike", "chink", "spic",
  // French slurs
  "putain", "salope", "enculé", "nègre", "tapette",
];

function containsBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

interface ReviewInput {
  comment: string;
  rating: number;
  user_id: string;
  salon_id: string;
}

interface ModResult {
  flagged: boolean;
  hidden: boolean;
  reason: string | null;
}

export async function checkReview(review: ReviewInput): Promise<ModResult> {
  // Rule 1: Slur filter
  if (containsBlockedWord(review.comment)) {
    return { flagged: true, hidden: true, reason: "Enthält unangemessene Sprache" };
  }

  // Rule 2: Too short
  if (review.comment.length < 10) {
    return { flagged: true, hidden: false, reason: "Sehr kurzer Kommentar" };
  }

  const admin = createAdminSupabaseClient();

  // Rule 3: Duplicate text
  const { data: dupes } = await admin
    .from("reviews")
    .select("id")
    .eq("user_id", review.user_id)
    .eq("comment", review.comment)
    .limit(1);

  if (dupes && dupes.length > 0) {
    return { flagged: true, hidden: true, reason: "Doppelter Kommentar" };
  }

  // Rule 4: Suspicious 5-star rating burst (fake positives)
  if (review.rating === 5) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: recentFives } = await admin
      .from("reviews")
      .select("user_id")
      .eq("salon_id", review.salon_id)
      .eq("rating", 5)
      .gte("created_at", dayAgo);

    if (recentFives && recentFives.length >= 3) {
      // Check how many of those reviewers are new accounts
      // reviews.user_id is nullable; a null entry can never match a profiles.id (never
      // null), so filtering it out preserves the same match set.
      const userIds = recentFives.map((r) => r.user_id).filter((id): id is string => id !== null);
      const { count: newAccounts } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("id", userIds)
        .gte("created_at", twoDaysAgo);

      if ((newAccounts ?? 0) >= 3) {
        return { flagged: true, hidden: true, reason: "Verdächtige Bewertungshäufung" };
      }
    }
  }

  // Rule 5: Review bombing (fake 1-stars)
  if (review.rating === 1) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: recentOnes } = await admin
      .from("reviews")
      .select("user_id")
      .eq("salon_id", review.salon_id)
      .eq("rating", 1)
      .gte("created_at", dayAgo);

    if (recentOnes && recentOnes.length >= 3) {
      const userIds = recentOnes.map((r) => r.user_id).filter((id): id is string => id !== null);
      const { count: newAccounts } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("id", userIds)
        .gte("created_at", twoDaysAgo);

      if ((newAccounts ?? 0) >= 3) {
        return { flagged: true, hidden: true, reason: "Verdächtiges Bewertungsmuster" };
      }
    }
  }

  // Rule 7 (trust-09): one real, established account manufacturing repeat "verified"
  // review signal for the SAME salon. Distinct fraud shape from rules 4/5 above, which
  // both key on NEW-account clustering (created within the last 48h) and so are blind
  // to an older account doing this deliberately. Flag only, never hide: a genuine
  // repeat customer within 30 days (a standing appointment, a touch-up visit) is a
  // real, if unusual, case an admin should glance at, not auto-suppress.
  if (review.user_id && review.user_id !== "guest") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentForSalon } = await admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", review.user_id)
      .eq("salon_id", review.salon_id)
      .gte("created_at", thirtyDaysAgo);

    if ((recentForSalon ?? 0) >= 1) {
      return { flagged: true, hidden: false, reason: "Mehrfache Bewertung desselben Salons innerhalb von 30 Tagen" };
    }
  }

  // Rule 8: No issues
  return { flagged: false, hidden: false, reason: null };
}
