// Shared beauty-profile field config (V3-D348). Single source of truth for the
// onboarding flow (/onboarding) AND the editable Beauty Profile in
// /profile/settings, so the persisted values (female / straight / coiffeur / …)
// never drift between where they're collected and where they're edited.
//
// NOTE: option labels are German for now (the onboarding flow is German-only);
// the surrounding chrome (titles/buttons) is i18n'd. Option-label i18n is a
// follow-up — tracked in QUESTIONS.md.

import * as React from "react";
import { Star, Heart, Droplet, Tag } from "lucide-react";

export type Choice = { value: string; label: string };
export type InterestChoice = Choice & { note?: string; cls: string };

export const GENDER_OPTS: Choice[] = [
  { value: "female", label: "Frau" },
  { value: "male", label: "Mann" },
  { value: "non_binary", label: "Non-binär" },
  { value: "prefer_not_to_say", label: "Keine Angabe" },
];

export const HAIR_OPTS: Choice[] = [
  { value: "straight", label: "Glatt" },
  { value: "wavy", label: "Wellig" },
  { value: "curly", label: "Lockig" },
  { value: "coily", label: "Kraus" },
  { value: "unknown", label: "Weiss nicht" },
];

export const HAIR_LENGTH_OPTS: Choice[] = [
  { value: "short", label: "Kurz" },
  { value: "medium", label: "Mittel" },
  { value: "long", label: "Lang" },
  { value: "very_long", label: "Sehr lang" },
];

export const HAIR_THICKNESS_OPTS: Choice[] = [
  { value: "thin", label: "Dünn" },
  { value: "medium", label: "Mittel" },
  { value: "thick", label: "Dick" },
];

export const HAIR_BEARD_OPTS: Choice[] = [
  { value: "none", label: "Kein Bart" },
  { value: "short", label: "Kurz" },
  { value: "full", label: "Voll" },
];

export const SKIN_OPTS: Choice[] = [
  { value: "dry", label: "Trocken" },
  { value: "normal", label: "Normal" },
  { value: "combination", label: "Mischhaut" },
  { value: "oily", label: "Fettig" },
  { value: "sensitive", label: "Empfindlich" },
];

export const CATEGORY_OPTS: Choice[] = [
  { value: "coiffeur", label: "Coiffeur" },
  { value: "barbershop", label: "Barbershop" },
  { value: "nails", label: "Nails" },
  { value: "spa", label: "Spa & Wellness" },
];

export const INTEREST_OPTS: InterestChoice[] = [
  { value: "top_rated", label: "Top-Salons", cls: "text-s-star" },
  { value: "deals", label: "Deals & Angebote", note: "Gutscheine & Rabatte", cls: "text-s-urgency" },
  { value: "favorites", label: "Favoriten", cls: "text-[#FF3366]" },
  { value: "spa", label: "Spa & Entspannung", cls: "text-s-accent-bright" },
];

// ── icons ─────────────────────────────────────────────────────────
export const CAT_PATHS: Record<string, React.ReactNode> = {
  coiffeur: (<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" /></>),
  barbershop: (<><rect x="4" y="4" width="16" height="6" rx="2" /><path d="M12 10v5M9 18h6" /></>),
  nails: (<path d="M9 21V8a3 3 0 0 1 6 0v13M9 21h6M8 8c0-2 1-5 4-5s4 3 4 5" />),
  spa: (<path d="M11 20A7 7 0 0 1 4 13c0-6 5-9 16-9 0 8-3 14-9 16zM4 20c2-5 6-8 11-9" />),
};

export function CatIcon({ name }: { name: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="butt" strokeLinejoin="miter" aria-hidden>
      {CAT_PATHS[name]}
    </svg>
  );
}

export const INTEREST_ICON: Record<string, React.ReactNode> = {
  top_rated: <Star size={20} strokeWidth={2.2} aria-hidden />,
  deals: <Tag size={20} strokeWidth={2.2} aria-hidden />,
  favorites: <Heart size={20} strokeWidth={2.2} aria-hidden />,
  spa: <Droplet size={20} strokeWidth={2.2} aria-hidden />,
};
