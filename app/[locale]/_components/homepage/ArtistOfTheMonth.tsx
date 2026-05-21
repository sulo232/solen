import {
  AnimatedTestimonials,
  type Testimonial,
} from "@/components/ui/animated-testimonials";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";

/**
 * Artist of the Month — V3-D75 (2026-05-18).
 *
 * SUPERSEDES the V2-D70 "Last-Minute heute" section on the homepage. New
 * structural slot: curated showcase of top stylists/artists, presented one at
 * a time via Aceternity-style AnimatedTestimonials carousel. Photo + name +
 * salon + city + signature quote per stylist. Auto-rotates every 6s.
 *
 * Backend wiring deferred (Phase 2 — see _audits/2026-05-10-v3-wireup-audit.md):
 *   - `/api/stylists/featured?limit=5&period=month` query
 *   - Real `stylist_profiles.portrait_url` (currently Unsplash demo)
 *   - Real `stylist_profiles.signature_quote` or featured client quote from
 *     `reviews` filtered by stylist_id (currently inline demo copy)
 *
 * Why this section replaces LastMinute:
 *   - User feedback Round 12: "i wanna add a section for like best artist of
 *     the month or smth instead of last minute". Curated > urgency.
 *   - LastMinute showed 15 cards with discount badges — promotional vibe.
 *     ArtistOfTheMonth is editorial — featured talent, not deals.
 *   - LIVE_TRUTH §Q51.1 LastMinute → marked for deprecation in V3-D75 entry.
 */

const STYLISTS: Testimonial[] = [
  {
    name: "Elena Rossi",
    designation: "Coiffeur · Salon Maria, Basel",
    quote:
      "Ich liebe Schnitte, die mitwachsen — du musst nicht jede Woche wieder kommen, der Look bleibt zwei Monate frisch.",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=900&fit=crop&q=80",
    slug: "salon-maria",
    bio: "Elena schneidet seit 12 Jahren in Basel — vier Jahre Vidal Sassoon London, dann zurück nach Hause. Sie spezialisiert sich auf wachstumsorientierte Schnitte, die mit deinem Haar mitarbeiten statt gegen es.",
    whySelected:
      "97% Wiederbuchungs-Rate im letzten Quartal. Kund:innen sagen wörtlich: \"Ich gehe seit drei Jahren nur noch zu Elena.\"",
    specialties: ["Damen-Schnitt", "Balayage", "Pflegeschnitt", "Beratung"],
    portfolio: [
      { src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=480&h=640&fit=crop&q=80", caption: "Voluminous Layers" },
      { src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=480&h=640&fit=crop&q=80", caption: "Soft Balayage" },
      { src: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=480&h=640&fit=crop&q=80", caption: "Curtain Bangs" },
    ],
  },
  {
    name: "Marcus Chen",
    designation: "Barbershop · Studio Nord, Zürich",
    quote:
      "Fade, Bart-Konturen, klassische Schere — was reinkommt, kommt mit klarer Vision raus. Keine Zeit verschwendet.",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=900&fit=crop&q=80",
    slug: "studio-nord",
    bio: "Marcus kommt aus Toronto, war drei Jahre bei einem Old-School-Barber in Brooklyn, lebt jetzt in Zürich. Schnitte in 35 Minuten, kein Smalltalk wenn du nicht willst.",
    whySelected:
      "5.0 / 5 Sterne · 247 Bewertungen. Schnitt-Konsistenz ist hier kein Glück — es ist Technik.",
    specialties: ["Fade", "Beard-Trim", "Hot Towel Shave", "Skin Fade"],
    portfolio: [
      { src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=480&h=640&fit=crop&q=80", caption: "Classic Fade" },
      { src: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=480&h=640&fit=crop&q=80", caption: "Modern Crop" },
      { src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=480&h=640&fit=crop&q=80", caption: "Beard Sculpt" },
    ],
  },
  {
    name: "Sophie Dubois",
    designation: "Nails · Nail Lab, Bern",
    quote:
      "Gel-Nails sind nicht Deko — sie sind Schmuck. Ich arbeite mit dir, bis sie sich richtig anfühlen.",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&h=900&fit=crop&q=80",
    slug: "nail-lab",
    bio: "Sophie hat in Paris und Tokyo gearbeitet bevor sie 2021 Nail Lab in Bern aufgemacht hat. Spezialisiert auf japanische Nail-Art-Techniken und langlebige Gel-Strukturen.",
    whySelected:
      "Längste Tragezeit in der Stadt — durchschnittlich 4-5 Wochen vor Refill. Bei anderen sind's 3.",
    specialties: ["Gel-Maniküre", "Nail-Art", "Strukturen", "Pflege-Behandlung"],
    portfolio: [
      { src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=480&h=640&fit=crop&q=80", caption: "Sage Glow" },
      { src: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=480&h=640&fit=crop&q=80", caption: "Japanese Art" },
      { src: "https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=480&h=640&fit=crop&q=80", caption: "Bridal Minimal" },
    ],
  },
  {
    name: "Luca Bernasco",
    designation: "Spa & Wellness · Rhein Spa, Lugano",
    quote:
      "Ein Massage-Termin ist Zeit für dich. Ich bin nur die Hände — die Pause gehört dir.",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=900&h=900&fit=crop&q=80",
    slug: "rhein-spa",
    bio: "Luca ist Physiotherapeut UND Spa-Masseur — beste Kombi für tiefe Verspannungen ohne Schnickschnack. 8 Jahre Erfahrung mit Sport-Klientel.",
    whySelected:
      "Die einzige Adresse in Lugano, die echte myofasziale Arbeit mit klassischer Spa-Atmosphäre kombiniert. Stille auf Wunsch.",
    specialties: ["Tiefen-Massage", "Sport-Massage", "Aromatherapie", "Hot Stone"],
    portfolio: [
      { src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=480&h=640&fit=crop&q=80", caption: "Stille Räume" },
      { src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=480&h=640&fit=crop&q=80", caption: "Hot Stone" },
      { src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=480&h=640&fit=crop&q=80", caption: "Aroma Setup" },
    ],
  },
  {
    name: "Anna Keller",
    designation: "Coiffeur · Atelier Coiffure, Luzern",
    quote:
      "Color isn't risky if you trust the artist. Ich zeige dir vor jedem Schritt, wie's wird — kein Surprise.",
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=900&fit=crop&q=80",
    slug: "atelier-coiffure",
    bio: "Anna ist Color-Spezialistin — sechs Jahre bei Wella Master Academy. Sie arbeitet ausschließlich mit Polaroids: jede Color-Idee wird vor dem Pinsel skizziert.",
    whySelected:
      "Null Color-Reklamationen in 2 Jahren. Wer zu Anna geht, weiß VOR dem Termin wie's wird.",
    specialties: ["Balayage", "Color-Correction", "Highlights", "Beratung"],
    portfolio: [
      { src: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=480&h=640&fit=crop&q=80", caption: "Honey Balayage" },
      { src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=480&h=640&fit=crop&q=80", caption: "Copper Tones" },
      { src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=480&h=640&fit=crop&q=80", caption: "Ash Blonde" },
    ],
  },
];

export default function ArtistOfTheMonth() {
  return (
    <Section>
      <SectionFrame>
        <SectionTitle title="Artist des Monats" />
        <div className="mt-6 md:mt-10">
          <AnimatedTestimonials testimonials={STYLISTS} autoplay />
        </div>
      </SectionFrame>
    </Section>
  );
}
