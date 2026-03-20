// lib/discovery-algorithm.ts — Recommendation algorithm for Discovery feed
// Profile match 50% + popularity 20% + collaborative 20% + implicit 10% + recency boost

interface UserProfile {
  disc_gender: string | null;
  disc_hair_texture: string | null;
  disc_hair_length: string | null;
  disc_face_shape: string | null;
  disc_skin_tone: string | null;
  disc_preferred_categories: string[] | null;
}

interface ScoredItem {
  id: string;
  score: number;
}

interface AlgorithmInput {
  profile: UserProfile | null;
  likedItemIds: string[];
  savedItemIds: string[];
  viewedItemIds: string[];
  items: {
    id: string;
    category: string;
    gender: string;
    texture: string | null;
    length_category: string | null;
    face_shapes: string[];
    skin_tone: string | null;
    like_count: number;
    save_count: number;
    view_count: number;
    created_at: string;
  }[];
}

export function scoreItems(input: AlgorithmInput): ScoredItem[] {
  const { profile, likedItemIds, savedItemIds, viewedItemIds, items } = input;

  // Cold start: no profile → return by trending (popularity + recency)
  if (!profile) {
    return items.map((item) => ({
      id: item.id,
      score: trendingScore(item),
    })).sort((a, b) => b.score - a.score);
  }

  const likedSet = new Set(likedItemIds);
  const savedSet = new Set(savedItemIds);
  const viewedSet = new Set(viewedItemIds);

  // Build collaborative signals: categories liked by user
  const likedCategories = new Map<string, number>();
  for (const item of items) {
    if (likedSet.has(item.id) || savedSet.has(item.id)) {
      likedCategories.set(item.category, (likedCategories.get(item.category) ?? 0) + 1);
    }
  }

  return items.map((item) => {
    let score = 0;

    // 1. Profile match (50%)
    score += profileMatchScore(profile, item) * 0.5;

    // 2. Popularity (20%)
    score += popularityScore(item) * 0.2;

    // 3. Collaborative (20%) — boost categories user has liked
    const catWeight = likedCategories.get(item.category) ?? 0;
    score += Math.min(catWeight / 5, 1) * 0.2;

    // 4. Implicit signals (10%) — penalize already-viewed, boost unseen
    if (viewedSet.has(item.id)) {
      score -= 0.05; // Slight penalty for already seen
    } else {
      score += 0.1; // Boost for fresh content
    }

    // Recency boost
    score += recencyBoost(item.created_at) * 0.1;

    return { id: item.id, score };
  }).sort((a, b) => b.score - a.score);
}

function profileMatchScore(profile: UserProfile, item: {
  category: string;
  gender: string;
  texture: string | null;
  length_category: string | null;
  face_shapes: string[];
  skin_tone: string | null;
}): number {
  let matches = 0;
  let total = 0;

  // Gender match
  total++;
  if (profile.disc_gender && (item.gender === profile.disc_gender || item.gender === "unisex")) {
    matches++;
  }

  // Category preference
  total++;
  if (profile.disc_preferred_categories?.includes(item.category)) {
    matches++;
  }

  // Texture match
  if (profile.disc_hair_texture && item.texture) {
    total++;
    if (item.texture === profile.disc_hair_texture) matches++;
  }

  // Length match
  if (profile.disc_hair_length && item.length_category) {
    total++;
    if (item.length_category === profile.disc_hair_length) matches++;
  }

  // Face shape match
  if (profile.disc_face_shape && item.face_shapes.length > 0) {
    total++;
    if (item.face_shapes.includes(profile.disc_face_shape)) matches++;
  }

  // Skin tone match
  if (profile.disc_skin_tone && item.skin_tone) {
    total++;
    if (item.skin_tone === profile.disc_skin_tone) matches++;
  }

  return total > 0 ? matches / total : 0;
}

function popularityScore(item: { like_count: number; save_count: number; view_count: number }): number {
  // Normalize: likes weigh most, then saves, then views
  const engagement = item.like_count * 3 + item.save_count * 2 + item.view_count * 0.1;
  // Logarithmic scaling to prevent viral items from dominating
  return Math.min(Math.log10(engagement + 1) / 4, 1);
}

function trendingScore(item: { like_count: number; save_count: number; view_count: number; created_at: string }): number {
  return popularityScore(item) * 0.6 + recencyBoost(item.created_at) * 0.4;
}

function recencyBoost(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  // Decay over 7 days
  return Math.max(0, 1 - ageHours / (7 * 24));
}

export type { UserProfile, ScoredItem, AlgorithmInput };
