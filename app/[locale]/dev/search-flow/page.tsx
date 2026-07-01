"use client";

/**
 * /dev/search-flow , MOCKUP (owner 2026-07-01, #7). Clean PHONE-FIRST preview of the chosen
 * direction "B" (owner picked B as-is + a polish council). Exists-check: `npm run exists
 * search-flow` = 0. Real composer = SearchOverlay.tsx. Real tokens (s-*), Lucide, canonical
 * CATEGORIES + SEARCH_CITIES (no re-invented data), no CDN. Nothing ships until owner approves.
 *
 * Council rules baked in: 3 rows in ONE card (no floating pills), ONE picker open at a time,
 * other rows DIM while editing, a pick -> a chip in place (never disappears), the guessed city =
 * a dashed ghost chip until confirmed.
 */
import { useState } from "react";
import { Search, MapPin, Calendar, X, Scissors } from "lucide-react";
import { notFound } from "next/navigation";
import { SEARCH_CITIES } from "@/lib/cities";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

const CATS = CATEGORIES.map((c) => c.label).slice(0, 4);
const CITIES = (SEARCH_CITIES as readonly string[]).slice(0, 4);

function RefinedRow({ icon: Icon, label, value, ghost, dim, first, onOpen, onClear }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; value: string | null; ghost?: boolean; dim: boolean; first?: boolean;
  onOpen: () => void; onClear?: () => void;
}) {
  return (
    <button onClick={onOpen}
      className={`flex h-14 w-full items-center gap-3 px-4 text-left transition-opacity ${first ? "" : "border-t border-s-border"} ${dim ? "opacity-55" : "opacity-100"}`}>
      {!value && <Icon size={19} className="shrink-0 text-s-ink/40" />}
      {value ? (
        ghost ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-s-border bg-white px-2 py-1 text-[13px] font-medium text-s-ink-2">
            {value}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-s-bg-sunken px-2 py-1 text-[13px] font-medium text-s-ink">
            {value}
            {onClear && <X size={14} className="text-s-ink/30" onClick={(e) => { e.stopPropagation(); onClear(); }} />}
          </span>
        )
      ) : (
        <span className="text-[13px] font-medium text-s-ink-2">{label}</span>
      )}
    </button>
  );
}

function RefinedPicker({ title, options, onPick }: { title: string; options: string[]; onPick: (v: string) => void }) {
  return (
    <div className="border-t border-s-border bg-s-bg-sunken p-3">
      <p className="mb-2 px-1 text-[12px] font-semibold text-s-ink-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onPick(o)}
            className="rounded-full border border-s-border bg-white px-3.5 py-2 text-[13px] font-medium text-s-ink hover:bg-s-bg-sunken">{o}</button>
        ))}
      </div>
    </div>
  );
}

function RefinedB() {
  const [svc, setSvc] = useState<string | null>(null);
  const [city, setCity] = useState<string>("Basel");
  const [cityConfirmed, setCityConfirmed] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [open, setOpen] = useState<"svc" | "city" | "date" | null>(null);
  const tog = (k: "svc" | "city" | "date") => setOpen(open === k ? null : k);
  const any = open !== null;
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-s-border bg-white shadow-elevation-2">
        <RefinedRow icon={Scissors} label="Service oder Kategorie" value={svc} dim={any && open !== "svc"} first onOpen={() => tog("svc")} onClear={() => setSvc(null)} />
        {open === "svc" && <RefinedPicker title="Was suchst du?" options={CATS} onPick={(v) => { setSvc(v); setOpen(null); }} />}
        <RefinedRow icon={MapPin} label="Ort" value={city || null} ghost={!cityConfirmed && !!city} dim={any && open !== "city"} onOpen={() => tog("city")} onClear={() => { setCity(""); setCityConfirmed(true); }} />
        {open === "city" && <RefinedPicker title="Wo?" options={CITIES} onPick={(v) => { setCity(v); setCityConfirmed(true); setOpen(null); }} />}
        <RefinedRow icon={Calendar} label="Wann?" value={date} dim={any && open !== "date"} onOpen={() => tog("date")} onClear={() => setDate(null)} />
        {open === "date" && <RefinedPicker title="Wann?" options={["Heute", "Morgen", "Diese Woche", "Egal"]} onPick={(v) => { setDate(v); setOpen(null); }} />}
      </div>
      <button className="flex w-full items-center justify-center gap-2 rounded-full bg-s-ink px-6 py-3.5 text-[15px] font-bold text-white active:scale-[0.98]" /* selected-ok: the ONE primary commit CTA (Suchen), ink is exempt */>
        <Search size={16} /> Suchen
      </button>
    </div>
  );
}

export default function SearchFlowMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[440px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-3">Mockup , Suche (Variante B)</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">So würde die Suche aussehen</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">Tipp: Service, dann Ort, dann Wann? antippen.</p>

        {/* the composer , full width, like the real overlay would be */}
        <div className="mt-5 rounded-[22px] border border-s-border bg-white p-4 shadow-elevation-2">
          <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-s-border px-4 py-2.5">
            <Search size={16} className="text-s-ink-3" />
            <span className="text-[14px] text-s-ink-3">Wonach suchst du?</span>
          </div>
          <RefinedB />
        </div>

        <ul className="mt-6 space-y-2 text-[13px] text-s-ink-2">
          <li>Die 3 Zeilen liegen in EINER Karte (keine schwebenden Pillen), also kein Überlappen.</li>
          <li>Immer nur ein Feld offen; die anderen werden gedimmt , nichts verschwindet von selbst.</li>
          <li>Auswahl wird zu einem Chip an Ort und Stelle (mit kleinem x zum Entfernen).</li>
          <li>Basel ist ein gestrichelter „geraten"-Chip, bis du ihn antippst und bestätigst.</li>
        </ul>
      </div>
    </main>
  );
}
