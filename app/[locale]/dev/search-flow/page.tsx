"use client";

/**
 * /dev/search-flow , MOCKUP (owner 2026-07-01, #7 category/city flow confusion).
 * Exists-check: `npm run exists search-flow` = 0 matches. The real composer is SearchOverlay.tsx
 * (app/[locale]/_components/search). This is a MOCKUP-FIRST comparison of 3 flow DIRECTIONS from the
 * 3-voice council , NOT a rebuild. Nothing here ships until the owner picks one. Real tokens (s-*),
 * Lucide icons, canonical CATEGORIES + SEARCH_CITIES (no re-invented data), no CDN.
 *
 * Shared council rule (all 3): a field only changes state on a USER action; a filled field COMPRESSES
 * to a dismissible chip IN PLACE (never disappears). The variations differ on auto-advance + date.
 */
import { useState } from "react";
import { Search, MapPin, Calendar, X, Scissors } from "lucide-react";
import { notFound } from "next/navigation";
import { SEARCH_CITIES } from "@/lib/cities";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

const CATS = CATEGORIES.map((c) => c.label).slice(0, 4);
const CITIES = (SEARCH_CITIES as readonly string[]).slice(0, 4);

function Field({ icon: Icon, label, value, active, onClick, onClear }: {
  icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string | null;
  active: boolean; onClick: () => void; onClear?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-2xl border border-s-border px-4 py-3 text-left transition-colors ${
        active ? "bg-s-bg-sunken" : "bg-white"
      }`}
    >
      <Icon size={17} className="shrink-0 text-s-ink-2" />
      {value ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-s-bg-sunken px-2.5 py-1 text-[13px] font-semibold text-s-ink">
          {value}
          {onClear && <X size={13} className="text-s-ink-2" onClick={(e) => { e.stopPropagation(); onClear(); }} />}
        </span>
      ) : (
        <span className="text-[14px] text-s-ink-3">{label}</span>
      )}
    </button>
  );
}

function ExpandedPicker({ title, options, onPick }: { title: string; options: string[]; onPick: (v: string) => void }) {
  return (
    <div className="rounded-2xl border border-s-border bg-white p-3 shadow-elevation-2">
      <p className="mb-2 px-1 text-[12px] font-semibold text-s-ink-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onPick(o)}
            className="rounded-full border border-s-border bg-white px-3.5 py-2 text-[13px] font-medium text-s-ink hover:bg-s-bg-sunken">
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Variation A: Airbnb hybrid + AUTO-ADVANCE (voices 1+2) ────────────────────
function VariantA() {
  const [svc, setSvc] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>("Basel");
  const [date, setDate] = useState<string | null>(null);
  const [step, setStep] = useState<"svc" | "city" | "date" | null>("svc");
  return (
    <div className="space-y-2.5">
      {step === "svc"
        ? <ExpandedPicker title="Was suchst du?" options={CATS} onPick={(v) => { setSvc(v); setStep("city"); }} />
        : <Field icon={Scissors} label="Service" value={svc} active={false} onClick={() => setStep("svc")} onClear={() => setSvc(null)} />}
      {step === "city"
        ? <ExpandedPicker title="Wo?" options={CITIES} onPick={(v) => { setCity(v); setStep("date"); }} />
        : <Field icon={MapPin} label="Ort" value={city} active={false} onClick={() => setStep("city")} onClear={() => setCity(null)} />}
      {step === "date"
        ? <ExpandedPicker title="Wann?" options={["Heute", "Morgen", "Diese Woche", "Egal"]} onPick={(v) => { setDate(v); setStep(null); }} />
        : <Field icon={Calendar} label="Wann?" value={date} active={false} onClick={() => setStep("date")} onClear={() => setDate(null)} />}
      <CommitBar />
    </div>
  );
}

// ── Variation B: PARALLEL, NO auto-advance (voice 3 structure, keeps date) ────
function VariantB() {
  const [svc, setSvc] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>("Basel");
  const [date, setDate] = useState<string | null>(null);
  const [open, setOpen] = useState<"svc" | "city" | "date" | null>(null);
  const tog = (k: "svc" | "city" | "date") => setOpen(open === k ? null : k);
  return (
    <div className="space-y-2.5">
      <Field icon={Scissors} label="Service" value={svc} active={open === "svc"} onClick={() => tog("svc")} onClear={() => setSvc(null)} />
      {open === "svc" && <ExpandedPicker title="Was suchst du?" options={CATS} onPick={(v) => { setSvc(v); setOpen(null); }} />}
      <Field icon={MapPin} label="Ort" value={city} active={open === "city"} onClick={() => tog("city")} onClear={() => setCity(null)} />
      {open === "city" && <ExpandedPicker title="Wo?" options={CITIES} onPick={(v) => { setCity(v); setOpen(null); }} />}
      <Field icon={Calendar} label="Wann?" value={date} active={open === "date"} onClick={() => tog("date")} onClear={() => setDate(null)} />
      {open === "date" && <ExpandedPicker title="Wann?" options={["Heute", "Morgen", "Diese Woche", "Egal"]} onPick={(v) => { setDate(v); setOpen(null); }} />}
      <CommitBar />
    </div>
  );
}

// ── Variation C: LEAN , service + city only, date deferred to results (voice 3) ─
function VariantC() {
  const [svc, setSvc] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>("Basel");
  const [open, setOpen] = useState<"svc" | "city" | null>(null);
  const tog = (k: "svc" | "city") => setOpen(open === k ? null : k);
  return (
    <div className="space-y-2.5">
      <Field icon={Scissors} label="Service oder Salon" value={svc} active={open === "svc"} onClick={() => tog("svc")} onClear={() => setSvc(null)} />
      {open === "svc" && <ExpandedPicker title="Was suchst du?" options={CATS} onPick={(v) => { setSvc(v); setOpen(null); }} />}
      <Field icon={MapPin} label="Ort" value={city} active={open === "city"} onClick={() => tog("city")} onClear={() => setCity(null)} />
      {open === "city" && <ExpandedPicker title="Wo?" options={CITIES} onPick={(v) => { setCity(v); setOpen(null); }} />}
      <CommitBar />
      <p className="px-1 pt-1 text-[12px] text-s-ink-3">Datum wählst du danach als Filter auf der Ergebnisseite (Chip: „Wann?").</p>
    </div>
  );
}

function CommitBar() {
  return (
    <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-s-ink px-6 py-3 text-[15px] font-bold text-white active:scale-[0.98]" /* selected-ok: the ONE primary commit CTA (Suchen), ink is exempt */>
      <Search size={16} /> Suchen
    </button>
  );
}

function Phone({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-[360px] flex-col">
      <div className="mb-2">
        <h3 className="font-heading text-[15px] font-bold text-s-ink">{title}</h3>
        <p className="text-[12px] text-s-ink-2">{tag}</p>
      </div>
      <div className="rounded-[28px] border border-s-border bg-s-bg-sunken p-3">
        <div className="rounded-[22px] bg-white p-3.5">
          <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-s-border px-4 py-2.5">
            <Search size={16} className="text-s-ink-3" />
            <span className="text-[14px] text-s-ink-3">Wonach suchst du?</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── REFINED B (owner's pick + polish council) , the direction to BUILD ───────
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
          // default (guessed) city , dashed ghost chip = "we guessed, tap to change" (council v2)
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
    <main className="min-h-screen bg-white px-5 py-8">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="font-heading text-[22px] font-bold text-s-ink">Search flow , 3 directions (#7)</h1>
        <p className="mt-1 max-w-[760px] text-[13.5px] text-s-ink-2">
          Council-driven. All three fix the confusion the same way: a filled field COMPRESSES to a chip
          in place (never disappears), and state only changes when YOU tap. City always collapses to a
          chip (your call). They differ on auto-advance + whether Date is up front. Recommendation: B
          {" "}, it removes the "yanked / disappearing" feeling without hiding anything. Tap the fields to try.
        </p>

        {/* REFINED B , the owner picked this + the polish council. THIS is what I'd build. */}
        <div className="mt-8 rounded-2xl border border-s-border bg-s-bg-sunken p-5">
          <h2 className="font-heading text-[16px] font-bold text-s-ink">B , refined (your pick) , this is what I'd build</h2>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start">
            <div className="w-full max-w-[360px] shrink-0">
              <div className="rounded-[28px] border border-s-border bg-white p-3">
                <div className="rounded-[22px] bg-white p-3.5">
                  <RefinedB />
                </div>
              </div>
            </div>
            <ul className="max-w-[560px] space-y-1.5 text-[13px] text-s-ink-2">
              <li><b className="text-s-ink">One card, not three pills</b> , the 3 rows live in a single card (hairline dividers), so nothing floats or overlaps (fixes your "overlap").</li>
              <li><b className="text-s-ink">One picker at a time</b> , tapping another row closes the open one; nothing appears/disappears on its own.</li>
              <li><b className="text-s-ink">Other rows dim while editing</b> , one question at a time, but all three stay visible.</li>
              <li><b className="text-s-ink">Pick = a chip in place</b> , grey pill + small dim ×; the row never vanishes.</li>
              <li><b className="text-s-ink">Ort is a dashed "guess" chip</b> (Basel) until you tap to confirm/change , so it doesn&apos;t look like you already set it.</li>
              <li className="pt-1 text-s-ink-3">Try it: tap Service, then Ort, then Wann?. This maps 1:1 to the real SearchOverlay once you approve.</li>
            </ul>
          </div>
        </div>

        <h2 className="mt-10 font-heading text-[15px] font-semibold text-s-ink-2">The 3 directions you picked from (for reference)</h2>
        <div className="mt-3 flex flex-wrap gap-8">
          <Phone title="A , Auto-advance (Airbnb)" tag="Pick a field -> it auto-jumps to the next. Fast, but can feel 'yanked'.">
            <VariantA />
          </Phone>
          <Phone title="B , Parallel, no auto-advance (recommended)" tag="Tap any field to edit; pick -> collapses to a chip in place; YOU hit Suchen. Nothing jumps.">
            <VariantB />
          </Phone>
          <Phone title="C , Lean (date deferred)" tag="Only Service + Ort here; Date becomes a filter chip on the results page.">
            <VariantC />
          </Phone>
        </div>
      </div>
    </main>
  );
}
