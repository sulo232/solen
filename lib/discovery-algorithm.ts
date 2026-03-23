// lib/discovery-algorithm.ts — Recommendation algorithm for Discovery feed
// Score = profileMatch * 0.5 + popularity * 0.2 + recency * 0.2 + diversity * 0.1
// Cold start: popularity + recency only. NEVER crash if no profile — always fallback.

interface UserProfile {
  disc_gender: string | null;
  disc_hair_texture: string | null;
  disc_hair_length: string | null;
  disc_face_shape: string | null;
  disc_skin_tone: string | null;
  disc_preferred_categories: string[] | null;
  // Nail preferences (from nail_client_preferences)
  disc_nail_shape: string | null;
  disc_nail_material: string | null;
  disc_nail_style: string | null;
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
    // Nail-specific fields
    nail_shape: string | null;
    nail_style: string | null;
    nail_material: string | null;
    // Barber-specific fields
    barber_style: string | null;
    fade_type: string | null;
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

  // Track categories seen for diversity scoring
  const categoryCounts = new Map<string, number>();
  items.forEach((item) => categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1));
  const maxCatCount = Math.max(...categoryCounts.values(), 1);

  return items.map((item) => {
    let score = 0;

    // 1. Profile match (50%)
    score += profileMatchScore(profile, item) * 0.5;

    // 2. Popularity (20%)
    score += popularityScore(item) * 0.2;

    // 3. Recency (20%)
    score += recencyBoost(item.created_at) * 0.2;

    // 4. Diversity (10%) — boost underrepresented categories + penalize seen content
    const catCount = categoryCounts.get(item.category) ?? 1;
    const diversityScore = 1 - catCount / maxCatCount;
    if (viewedSet.has(item.id)) {
      score += (diversityScore - 0.2) * 0.1; // Penalize already-seen
    } else {
      score += (diversityScore + 0.3) * 0.1; // Boost fresh + diverse
    }

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
  nail_shape: string | null;
  nail_style: string | null;
  nail_material: string | null;
  barber_style: string | null;
  fade_type: string | null;
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

  if (item.category === "nails") {
    // Nail-specific scoring
    if (profile.disc_nail_shape && item.nail_shape) {
      total++;
      if (item.nail_shape === profile.disc_nail_shape) matches++;
    }
    if (profile.disc_nail_style && item.nail_style) {
      total++;
      if (item.nail_style === profile.disc_nail_style) matches++;
    }
    if (profile.disc_nail_material && item.nail_material) {
      total++;
      if (item.nail_material === profile.disc_nail_material) matches++;
    }
  } else if (item.category === "barbershop") {
    // Barber-specific scoring — fade/style match + texture
    if (item.fade_type) {
      total++;
      // Boost fade types matching user preference (inferred from likes)
      if (profile.disc_preferred_categories?.includes("barbershop")) matches++;
    }
    if (item.barber_style) {
      total++;
      if (profile.disc_preferred_categories?.includes("barbershop")) matches++;
    }
    if (profile.disc_hair_texture && item.texture) {
      total++;
      if (item.texture === profile.disc_hair_texture) matches++;
    }
  } else {
    // Hair/beard-specific scoring
    if (profile.disc_hair_texture && item.texture) {
      total++;
      if (item.texture === profile.disc_hair_texture) matches++;
    }
    if (profile.disc_hair_length && item.length_category) {
      total++;
      if (item.length_category === profile.disc_hair_length) matches++;
    }
    if (profile.disc_face_shape && item.face_shapes.length > 0) {
      total++;
      if (item.face_shapes.includes(profile.disc_face_shape)) matches++;
    }
  }

  // Skin tone match (applies to both hair and nails)
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
