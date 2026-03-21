/**
 * Nail art AI generation prompt templates for fal.ai image generation.
 * Variables: [SHAPE], [LENGTH], [MATERIAL], [STYLE], [COLORS], [SKIN_TONE], [HAND_POSE]
 */

export type NailShotType = "hero" | "detail" | "lifestyle";

export interface NailPromptParams {
  shape: string;
  length: string;
  material: string;
  style: string;
  colors: string;
  skinTone?: string;
  handPose?: string;
  shotType: NailShotType;
}

const SHOT_DESCRIPTIONS: Record<NailShotType, string> = {
  hero: "full hand photograph showing all 5 nails clearly visible, fingers spread naturally, elegant pose against a clean minimal background",
  detail: "extreme close-up macro photograph of a single nail, sharp focus on nail surface texture and design details, shallow depth of field",
  lifestyle: "lifestyle photograph of a hand in natural context, holding a coffee cup or resting on marble surface, nails as focal point with soft bokeh background",
};

export function buildNailPrompt(params: NailPromptParams): string {
  const {
    shape,
    length,
    material,
    style,
    colors,
    skinTone = "neutral medium",
    handPose = "relaxed natural",
    shotType,
  } = params;

  const shotDesc = SHOT_DESCRIPTIONS[shotType];

  return [
    `Professional nail art photography, ${shotDesc}.`,
    `Nail specifications: ${shape} shape, ${length} length, ${material} material.`,
    `Design style: ${style} with color palette of ${colors}.`,
    `Hand details: ${skinTone} skin tone, ${handPose} hand pose.`,
    "Studio lighting, high-end beauty editorial quality, 8K resolution, photorealistic.",
    "No text, no watermarks, no logos, no artifacts.",
  ].join(" ");
}

export const STYLE_PRESETS: { value: string; label: string }[] = [
  { value: "french tip classic", label: "French Classic" },
  { value: "ombre gradient", label: "Ombré" },
  { value: "marble swirl", label: "Marble" },
  { value: "chrome mirror metallic", label: "Chrome" },
  { value: "glitter encapsulated sparkle", label: "Glitter" },
  { value: "minimal line art geometric", label: "Minimalist" },
  { value: "floral botanical hand-painted", label: "Floral" },
  { value: "abstract art expressionist", label: "Abstract" },
  { value: "cat eye magnetic", label: "Cat Eye" },
  { value: "3D textured sculptural", label: "3D Art" },
];

export const COLOR_PRESETS: { value: string; label: string; hex: string }[] = [
  { value: "soft pink nude", label: "Nude Pink", hex: "#E8C4B8" },
  { value: "classic red", label: "Rot", hex: "#C41E3A" },
  { value: "deep burgundy wine", label: "Burgundy", hex: "#722F37" },
  { value: "pastel lavender lilac", label: "Lavendel", hex: "#C8A2C8" },
  { value: "emerald green", label: "Smaragd", hex: "#50C878" },
  { value: "cobalt blue electric", label: "Blau", hex: "#0047AB" },
  { value: "coral peach warm", label: "Koralle", hex: "#E8624A" },
  { value: "black matte dark", label: "Schwarz", hex: "#1A1209" },
  { value: "white cream milky", label: "Weiss", hex: "#FAF6EF" },
  { value: "gold champagne metallic", label: "Gold", hex: "#D4870A" },
];

export const SKIN_TONE_PRESETS: { value: string; label: string }[] = [
  { value: "fair light porcelain", label: "Hell" },
  { value: "light medium beige", label: "Mittel-Hell" },
  { value: "medium olive warm", label: "Mittel" },
  { value: "medium dark tan", label: "Mittel-Dunkel" },
  { value: "dark deep rich", label: "Dunkel" },
];
