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
      const userIds = recentFives.map((r) => r.user_id);
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
      const userIds = recentOnes.map((r) => r.user_id);
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

  // Rule 6: No issues
  return { flagged: false, hidden: false, reason: null };
}
