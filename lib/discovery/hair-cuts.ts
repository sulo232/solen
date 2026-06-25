// Curated cut taxonomy for the Inspo HAIR progressive filter (L2). Each texture maps to a list of
// { label, tag } pairs: the label is the human-facing chip text, the tag is the real discovery_items.tags
// value threaded into discovery_feed(p_tags_any). Owner-approved set (mockup drill.html v3), single source
// of truth so the chip text and the tag filter never drift apart.

export interface HairCut {
  /** Display label rendered on the chip (Inter, sentence case). */
  label: string;
  /** The exact discovery_items.tags value; passed into discovery_feed's p_tags_any array. */
  tag: string;
}

export const HAIR_CUTS: Record<string, HairCut[]> = {
  straight: [
    { label: "Textured Crop", tag: "textured crop" },
    { label: "Curtain Bangs", tag: "curtain bangs" },
    { label: "French Crop", tag: "french crop" },
    { label: "Blunt Cut", tag: "blunt cut" },
    { label: "Taper Fade", tag: "taper fade" },
    { label: "High Fade", tag: "high fade" },
    { label: "Shag", tag: "shag" },
    { label: "Bob", tag: "bob" },
  ],
  wavy: [
    { label: "Curtain Bangs", tag: "curtain bangs" },
    { label: "Shag", tag: "shag" },
    { label: "Textured Crop", tag: "textured crop" },
    { label: "Butterfly Cut", tag: "butterfly cut" },
    { label: "Modern Mullet", tag: "modern mullet" },
    { label: "Bob", tag: "bob" },
    { label: "Lob", tag: "lob" },
    { label: "French Crop", tag: "french crop" },
  ],
  curly: [
    { label: "Taper Fade", tag: "taper fade" },
    { label: "Low Fade", tag: "low fade" },
    { label: "Skin Fade", tag: "skin fade" },
    { label: "Textured Crop", tag: "textured crop" },
    { label: "Mid Fade", tag: "mid fade" },
    { label: "Line-up", tag: "line-up" },
    { label: "Fringe", tag: "fringe" },
  ],
  coily: [
    { label: "Braids", tag: "braids" },
    { label: "Cornrows", tag: "cornrows" },
    { label: "Box Braids", tag: "box braids" },
    { label: "Twists", tag: "twists" },
    { label: "Knotless Braids", tag: "knotless braids" },
    { label: "Taper Fade", tag: "taper fade" },
    { label: "Low Fade", tag: "low fade" },
    { label: "Line-up", tag: "line-up" },
  ],
};
