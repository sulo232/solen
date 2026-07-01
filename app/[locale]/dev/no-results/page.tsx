// exists-check: dev-only mockup route (notFound in prod), net-new. `npm run exists
// no-results-variants` -> 0. Renders 3 DISTINCT design directions for the search
// no-results empty state so the owner can compare + pick one; uses the real Tailwind
// tokens (not a from-scratch redraw). The shipped state lives in SearchTemplate EmptyState.
"use client";

import { notFound } from "next/navigation";
import {
  SearchX,
  Globe,
  Compass,
  ChevronRight,
  ArrowRight,
  Scissors,
  MapPinOff,
} from "lucide-react";

// Variant A , editorial list (the current shipped direction): calm, minimal, ink icon,
// tappable list rows with hairline dividers.
function VariantA() {
  const rows: [typeof Globe, string, string][] = [
    [Globe, "Überall in der Schweiz suchen", "12 Salons"],
    [Compass, "Alle Coiffeur anzeigen", "8 Salons"],
  ];
  return (
    <div className="flex flex-col items-center px-6 pt-10 pb-8 text-center">
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-s-bg-sunken shadow-[0_2px_8px_rgba(10,10,10,0.06)]">
        <SearchX size={32} strokeWidth={1.5} className="text-s-ink" />
      </div>
      <h2 className="font-display mt-5 text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        Keine Salons gefunden.
      </h2>
      <p className="font-body mt-4 max-w-md text-[14px] leading-relaxed text-s-ink-2">
        Versuche eine andere Stadt oder lass die Filter weg.
      </p>
      <div className="mt-8 w-full border-t border-s-border pt-6 text-left">
        <p className="mb-1 text-[12px] font-semibold text-s-ink-3">Vorschläge</p>
        {rows.map(([Icon, label, count], i) => (
          <button
            key={i}
            className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3.5 border-b border-s-border px-2 py-3.5 text-left transition-colors duration-150 hover:bg-s-bg-sunken"
          >
            <Icon size={20} strokeWidth={1.75} className="shrink-0 text-s-ink-2" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-s-ink">{label}</span>
              <span className="block text-[12px] text-s-ink-3">{count}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-s-ink-2" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Variant B , action cards: the suggestions become elevated cards with a prominent count.
// More visual weight, more "reward for tapping".
function VariantB() {
  return (
    <div className="flex flex-col items-center px-5 pt-10 pb-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-s-bg-sunken">
        <SearchX size={28} strokeWidth={1.5} className="text-s-ink" />
      </div>
      <h2 className="font-display mt-5 text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        Keine Treffer in Bern
      </h2>
      <p className="font-body mt-3 text-[14px] text-s-ink-2">Aber es gibt Wege weiter.</p>
      <div className="mt-6 flex w-full flex-col gap-3">
        <button className="flex items-center gap-4 rounded-card border border-s-border bg-white p-4 text-left shadow-[0_1px_3px_rgba(10,10,10,0.06)] transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(10,10,10,0.10)]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-s-accent/10 text-s-accent">
            <Globe size={22} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-s-ink">Überall suchen</span>
            <span className="block text-[13px] text-s-ink-2">12 Salons in der Schweiz</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-s-ink" />
        </button>
        <button className="flex items-center gap-4 rounded-card border border-s-border bg-white p-4 text-left shadow-[0_1px_3px_rgba(10,10,10,0.06)] transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(10,10,10,0.10)]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink">
            <Scissors size={20} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-s-ink">Alle Coiffeur</span>
            <span className="block text-[13px] text-s-ink-2">8 Studios</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-s-ink" />
        </button>
      </div>
    </div>
  );
}

// Variant C , conversational with one primary CTA: warmer copy, a single ink commit button
// for the main broaden, secondary actions as text links (Airbnb-style focused recovery).
function VariantC() {
  return (
    <div className="flex flex-col items-center px-6 pt-12 pb-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-s-bg-sunken">
        <MapPinOff size={34} strokeWidth={1.5} className="text-s-ink-2" />
      </div>
      <h2 className="font-display mt-6 text-[22px] font-semibold leading-snug tracking-[-0.02em] text-s-ink">
        Nichts für „Coiffeur" in Bern.
      </h2>
      <p className="font-body mt-3 max-w-[17rem] text-[14px] leading-relaxed text-s-ink-2">
        Kein Problem. Probier es schweizweit.
      </p>
      <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink px-6 py-3.5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-black">
        <Globe size={18} strokeWidth={2} /> In der ganzen Schweiz suchen
      </button>
      <button className="mt-4 text-[14px] font-medium text-s-accent hover:underline">
        Alle Coiffeur ansehen (8)
      </button>
      <button className="mt-3 text-[13px] font-medium text-s-ink-3 transition-colors hover:text-s-ink">
        Neue Suche
      </button>
    </div>
  );
}

const VARIANTS: { key: string; label: string; note: string; el: React.ReactNode }[] = [
  { key: "A", label: "Variante A , Editorial-Liste", note: "Aktuell live. Ruhig, minimal, ink Icon, Listenzeilen mit Hairlines.", el: <VariantA /> },
  { key: "B", label: "Variante B , Aktionskarten", note: "Vorschläge als erhöhte Karten mit Zahl. Visueller, mehr Gewicht.", el: <VariantB /> },
  { key: "C", label: "Variante C , Ein klarer CTA", note: "Wärmere Copy, EIN ink Hauptbutton, Rest als Textlinks. Fokussiert.", el: <VariantC /> },
];

export default function NoResultsVariantsPage() {
  if (process.env.NODE_ENV === "production") notFound(); // dev preview only

  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[440px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">
          No-Results , 3 Varianten
        </h1>
        <p className="font-body mt-2 text-[14px] text-s-ink-2">
          Suche „Coiffeur" in Bern (0 Treffer). Drei Richtungen zum Vergleichen. Empfehlung: A oder C.
        </p>
        <div className="mt-8 flex flex-col gap-10">
          {VARIANTS.map((v) => (
            <div key={v.key}>
              <div className="mb-2">
                <div className="font-body text-[13px] font-semibold text-s-ink">{v.label}</div>
                <div className="font-body text-[12px] text-s-ink-3">{v.note}</div>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-s-border bg-white">
                {v.el}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
