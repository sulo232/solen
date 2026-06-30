"use client";

// exists-check: net-new dev PREVIEW route (no match in `npm run exists search-morph`). Sibling to the
// other app/[locale]/dev/* preview pages. Renders the REAL SearchOverlay (its input + recent searches +
// service/city/date fields) with the new `morphPreview` flag = top-anchored in-place morph + blurred
// backdrop. Faithful (the real overlay, all features) + separate (the live homepage is unchanged, it
// renders SearchOverlay WITHOUT morphPreview). Not linked in nav. Owner-approved direction 2026-06-30.

import { useState } from "react";
import { SearchOverlay } from "@/app/[locale]/_components/search/SearchOverlay";

export default function SearchMorphPreviewPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      {/* page content behind , gives the blur something to blur */}
      <div className="mx-auto max-w-[430px] px-5 pt-14">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-heading text-[26px] font-extrabold tracking-[-0.02em] text-s-ink">Solen</span>
          <span className="grid h-11 w-11 place-items-center rounded-[14px] border border-s-border text-s-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </span>
        </div>
        <p className="mb-1.5 text-[13px] font-medium text-s-ink-3">Beauty & Wellness, all of Switzerland</p>
        <h1 className="mb-5 font-heading text-[27px] font-bold leading-tight tracking-[-0.02em] text-s-ink">
          Appointments,<br />instantly confirmed.
        </h1>

        {/* the rest search bar , tap to open the real overlay with the morph */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-full border border-s-border bg-white px-5 py-4 text-[15px] text-s-ink-3 shadow-[0_8px_24px_rgba(10,10,10,0.10)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          Start your search
        </button>

        <div className="mt-10">
          <h3 className="mb-3 font-heading text-[18px] font-bold text-s-ink">For you</h3>
          <div className="flex gap-3">
            {["Hair", "Barber", "Nails"].map((c) => (
              <div key={c} className="flex h-24 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-s-border text-[12px] text-s-ink-2">
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* the REAL overlay , with the preview morph + blur (homepage uses it WITHOUT morphPreview) */}
      <SearchOverlay open={open} onClose={() => setOpen(false)} locale="de" morphPreview />
    </div>
  );
}
