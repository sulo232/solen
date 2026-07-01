// exists-check: dev-only mockup route (notFound in prod), net-new. `npm run exists
// search-fixes` -> 0. Variation mockups for two owner design asks: (C) how the full
// search sheet fills when the keyboard closes (3 fixes), and (D) the Inspo look-card
// design (3 directions). Real tokens, English copy. Neutral image tiles stand in for
// the real Inspo photos , the card TREATMENT is what's under review.
"use client";

import { notFound } from "next/navigation";
import { Search, ArrowUpLeft, Store, Star, ArrowRight, ImageIcon, Heart } from "lucide-react";

function Field({ q }: { q: string }) {
  return (
    <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-[16px] border border-s-border bg-white px-4 py-3">
      <Search size={18} strokeWidth={2} className="text-s-ink-3" />
      <span className="text-[15px] font-medium text-s-ink">{q}</span>
    </div>
  );
}
function Auto({ terms }: { terms: string[] }) {
  return (
    <div className="mx-4 mt-1 divide-y divide-s-border">
      {terms.map((t, i) => (
        <div key={t} className="flex w-full items-center gap-3 py-2.5 text-left">
          <Search size={16} strokeWidth={2} className="shrink-0 text-s-ink-3" />
          <span className={`min-w-0 flex-1 truncate text-[14px] text-s-ink ${i === 0 ? "font-semibold" : "font-medium"}`}>{t}</span>
          <ArrowUpLeft size={15} strokeWidth={2} className="shrink-0 text-s-ink-3" />
        </div>
      ))}
    </div>
  );
}
const Frame = ({ children, h = 560 }: { children: React.ReactNode; h?: number }) => (
  <div className="relative overflow-hidden rounded-[28px] border border-s-border bg-s-bg-sunken" style={{ height: h }}>{children}</div>
);
const Cap = ({ t, d }: { t: string; d: string }) => (
  <div className="mb-2"><div className="text-[13px] font-semibold text-s-ink">{t}</div><div className="text-[12px] text-s-ink-3">{d}</div></div>
);

// ---------- D: Inspo look-card directions ----------
const LOOKS = ["Skin fade", "Textured crop", "Buzz cut", "Low taper", "Crew cut"];

function DTile({ variant }: { variant: 1 | 2 | 3 }) {
  return (
    <div className="-mx-1 flex gap-2.5 overflow-hidden px-1">
      {LOOKS.map((name, i) => (
        <div key={i} className="shrink-0">
          {variant === 1 && (
            <div className="grid h-28 w-[84px] place-items-center rounded-[14px] bg-gradient-to-br from-s-bg-sunken to-s-border/70 text-s-ink-3"><ImageIcon size={20} strokeWidth={1.5} /></div>
          )}
          {variant === 2 && (
            <div className="relative h-32 w-[92px] overflow-hidden rounded-[16px] bg-gradient-to-br from-s-bg-sunken to-s-border/70">
              <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-s-ink"><Heart size={13} /></span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-5 text-[12px] font-semibold leading-tight text-white">{name}</span>
            </div>
          )}
          {variant === 3 && (
            <div className="w-[92px]">
              <div className="grid h-[104px] w-full place-items-center rounded-[14px] bg-gradient-to-br from-s-bg-sunken to-s-border/70 text-s-ink-3"><ImageIcon size={18} strokeWidth={1.5} /></div>
              <div className="mt-1.5 truncate text-[12px] font-medium text-s-ink">{name}</div>
              <div className="text-[12px] text-s-ink-3">Barber</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
function DFrame({ variant }: { variant: 1 | 2 | 3 }) {
  return (
    <Frame h={360}>
      <Field q="buzz" />
      <Auto terms={["buzz cut", "buzzcut", "skin fade"]} />
      <p className="mb-2 mt-4 px-4 text-[13px] font-semibold text-s-ink">Looks</p>
      <div className="px-3"><DTile variant={variant} /></div>
    </Frame>
  );
}

// ---------- C: keyboard-closed full search (few results) ----------
function CResults() {
  return (
    <>
      <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-[16px] border border-s-ink bg-white px-4 py-3">
        <Search size={18} strokeWidth={2} className="text-s-ink-3" />
        <span className="text-[15px] font-medium text-s-ink">undercut</span>
      </div>
      <div className="mx-4 mt-1 divide-y divide-s-border">
        {["undercut", "undercut fade"].map((t, i) => (
          <div key={t} className="flex items-center gap-3 py-2.5"><Search size={16} className="text-s-ink-3" /><span className={`flex-1 text-[14px] text-s-ink ${i===0?"font-semibold":"font-medium"}`}>{t}</span><ArrowUpLeft size={15} className="text-s-ink-3" /></div>
        ))}
      </div>
      <p className="mb-1 mt-4 px-4 text-[13px] font-semibold text-s-ink">Salons</p>
      <div className="px-4">
        <div className="flex items-stretch gap-3 rounded-card border border-s-border bg-white p-3">
          <span className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-3"><Store size={20} strokeWidth={1.5} /></span>
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="truncate text-[15px] font-semibold text-s-ink">Old Town Barbers</span>
            <span className="mt-0.5 flex items-center gap-2 text-[12px] text-s-ink-3">
              <span className="inline-flex items-center gap-1"><Star size={12} className="fill-s-star text-s-star" /> 4.3</span>
              <span>Basel</span>
            </span>
            <span className="mt-1 text-[13px] font-semibold text-s-ink">from CHF 35</span>
          </span>
          <ArrowRight size={18} className="shrink-0 self-center text-s-ink" />
        </div>
      </div>
    </>
  );
}
function CV1() { // continuous surface: white sheet fills, no visible gap/edge
  return <Frame><div className="flex h-full flex-col bg-white"><div className="flex-1 overflow-hidden"><CResults /></div></div></Frame>;
}
function CV2() { // content-height sheet: hugs results, backdrop above
  return (
    <Frame>
      <div className="flex h-full flex-col justify-end">
        <div className="mx-2 mb-2 overflow-hidden rounded-[22px] bg-white pb-3 shadow-[0_16px_48px_rgba(10,10,10,0.14)]"><CResults /></div>
      </div>
    </Frame>
  );
}
function CV3() { // fill the space with Trending so it never reads empty
  return (
    <Frame>
      <div className="flex h-full flex-col bg-white">
        <div><CResults /></div>
        <div className="mt-auto px-4 pb-5 pt-4">
          <p className="mb-2 text-[13px] font-semibold text-s-ink">Trending</p>
          <div className="flex flex-wrap gap-2">
            {["Balayage", "Herrenschnitt", "Maniküre", "Bart", "Coloration"].map((t) => (
              <span key={t} className="rounded-full bg-s-bg-sunken px-4 py-2 text-[13px] font-medium text-s-ink-2">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

export default function SearchFixesMock() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">Search , design variations</h1>

        <h2 className="mt-8 font-heading text-[17px] font-bold text-s-ink">C , keyboard closed in full search (results are short, bottom looked empty)</h2>
        <p className="mt-1 text-[13px] text-s-ink-2">Recommended: <b>C2 (content-height sheet)</b> , it hugs the results so there is simply no empty area, matching the calendar sheet we just shipped.</p>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div><Cap t="C1 , Continuous surface" d="Sheet fills the viewport as one white surface. No card edge, so short results read as 'room', not a gap." /><CV1 /></div>
          <div><Cap t="C2 , Content-height sheet (rec.)" d="Sheet shrinks to hug the results; backdrop shows above. Same bottom-sheet model as the new calendar." /><CV2 /></div>
          <div><Cap t="C3 , Fill with Trending" d="Short results get a Trending row pinned to the bottom so the space is always useful." /><CV3 /></div>
        </div>

        <h2 className="mt-12 font-heading text-[17px] font-bold text-s-ink">D , Inspo look card</h2>
        <p className="mt-1 text-[13px] text-s-ink-2">Recommended: <b>D2 (label overlay)</b> , the style name on the photo makes each look scannable + a save heart, without a text row eating height. Applies to the search Looks strip AND the Inspo feed.</p>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div><Cap t="D1 , Bare photo (current)" d="Just the image, rounded. Cleanest, but no name/save; you can't tell looks apart at a glance." /><DFrame variant={1} /></div>
          <div><Cap t="D2 , Label overlay (rec.)" d="Photo + gradient + style name + save heart. Scannable, saveable, no extra height." /><DFrame variant={2} /></div>
          <div><Cap t="D3 , Name below" d="Photo with the name + category beneath. Most legible, but taller and less photo-forward." /><DFrame variant={3} /></div>
        </div>
      </div>
    </div>
  );
}
