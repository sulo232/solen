# R35 — Last Minute Page V3 + LastMinuteCard Plum Glass

> Apply V3 plum dark glass treatment to the Last Minute page and redesign the LastMinuteCard component to use the plum glass card spec from the rulebook.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| Phase 1 — LastMinuteCard redesign | 🟡 Medium | Shared across homepage + last-minute page |
| Phase 2 — Last Minute page section | 🟢 Low | Page-level layout update |
| Phase 3 — Bebas Neue discount % | 🟢 Low | Typography-only |

---

## Phase 1 — LastMinuteCard: Plum Glass Treatment

### ⚠️ BE CAREFUL
- `LastMinuteCard.tsx` (3,890 bytes) is used in both `HomePage.tsx` and the `/last-minute` page — changes affect both. Test both after change.
- Card background must be `rgba(74,30,60,.92)` with `backdrop-filter: blur(16px)` — NOT just a Tailwind opacity class. Use inline style for the exact spec.
- Discount percentage: `font-display` (Bebas Neue), `52px`, `text-s-yellow`.
- Card hover: `translateY(-4px)` + shadow upgrade (warm-xl). NO blob morph.

### Files to modify

#### [MODIFY] [LastMinuteCard.tsx](file:///c:/Users/sulod/solen/components/LastMinuteCard.tsx)
Full V3 plum glass card:

✅ DO:
```tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { LastMinuteSlot } from "@/lib/types";

export default function LastMinuteCard({ slot, locale }: { slot: LastMinuteSlot; locale: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [.4,0,.2,1] }}
      className="relative rounded-[20px] overflow-hidden cursor-pointer"
      style={{
        background: "rgba(74,30,60,.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,.10)",
        boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07)",
      }}
    >
      {/* Deco circles */}
      <div className="absolute w-[160px] h-[160px] rounded-full bg-white/05 right-[-40px] top-[-40px] pointer-events-none" />
      <div className="absolute w-[80px] h-[80px] rounded-full bg-s-coral/18 left-[-20px] bottom-[-20px] pointer-events-none" />
      
      <Link href={`/${locale}/salon/${slot.salon_slug}`} className="block p-5 relative z-10">
        <p className="font-heading font-semibold text-[9px] uppercase tracking-[.16em] text-white/40 mb-2">Last Minute</p>
        <div className="font-display text-[52px] text-s-yellow leading-none mb-1.5">
          −{slot.discount_percent}%
        </div>
        <p className="font-heading font-bold text-white text-[15px] mb-0.5">{slot.salon_name}</p>
        <p className="text-xs text-white/45 mb-3">
          {slot.quartier} · ★ {slot.rating} · Normalpreis CHF {slot.original_price}
        </p>
        <span className="inline-block font-heading font-bold text-[11px] uppercase tracking-[.10em] text-s-coral bg-s-coral/16 px-2.5 py-1 rounded-btn mb-4">
          Heute {slot.time_slot} · {slot.spots} {slot.spots === 1 ? "Platz" : "Plätze"}
        </span>
        <div>
          <span className="inline-flex items-center justify-center px-4 py-2 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] shadow-coral-glow hover:bg-s-coral-hover transition-all">
            Buchen · CHF {slot.discounted_price}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
```

❌ DON'T:
```tsx
// Don't use Tailwind opacity classes for the plum glass bg
className="bg-s-plum/90" // → wrong opacity, wrong blur implementation
// Don't use blob shapes on the card container
style={{ borderRadius: "... blob ..." }}
```

**Verification:** `npm run build` — LastMinuteCard renders plum glass on both homepage and /last-minute page.

**Git commit:** `git add components/LastMinuteCard.tsx && git commit -m "R35-P1: LastMinuteCard → plum glass, Bebas Neue discount %, warm shadows"`

---

## Phase 2 — Last Minute Page: Full Dark Section Layout

### ⚠️ BE CAREFUL
- The page at `app/[locale]/last-minute/page.tsx` may have its own layout — check and apply plum dark bg to the entire page section, not just the hero.
- Zone: Last Minute page = Zone 1 (it's a discovery page). Use `<BlobBackground zone={1} />` but with the plum background, blob colours need to be coral and blue (not default).

### Files to modify

#### [MODIFY] Last Minute page (check path: `app/[locale]/last-minute/page.tsx` or local page file)
```tsx
// Page wrapper:
<div className="min-h-screen bg-s-plum relative overflow-hidden">
  {/* Deco blobs on plum bg */}
  <div className="absolute w-[400px] h-[400px] rounded-full bg-s-coral/14 right-[-80px] top-[-80px] pointer-events-none" />
  <div className="absolute w-[300px] h-[300px] rounded-full bg-s-blue/08 left-[-60px] bottom-[-60px] pointer-events-none" />
  
  {/* Hero */}
  <section className="pt-32 pb-16 relative z-10">
    <div className="max-w-5xl mx-auto px-4">
      <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-yellow mb-3">Last Minute</span>
      <h1 className="font-display text-white leading-[0.87] mb-4"
        style={{ fontSize: "clamp(56px, 8vw, 110px)" }}>
        SPARE BIS<br /><span className="text-s-coral">ZU 50%</span>
      </h1>
      <p className="font-body italic text-white/60 text-[17px] leading-[1.82] max-w-md mb-8">
        Kurzfristige Termine zu vergünstigten Preisen — nur für heute.
      </p>
    </div>
  </section>

  {/* Cards grid */}
  <section className="pb-20 relative z-10">
    <div className="max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {slots.map(slot => <LastMinuteCard key={slot.id} slot={slot} locale={locale} />)}
      </div>
    </div>
  </section>
</div>
```

**Verification:** `npm run build` — `/last-minute` page renders with dark plum background, white text, coral accent.

**Git commit:** `git add app/[locale]/last-minute && git commit -m "R35-P2: Last Minute page V3 plum dark layout"`

---

## Phase 3 — Bebas Neue Discount % as Section Stat

### ⚠️ BE CAREFUL
- In the hero, add the Bebas Neue stat of max discount currently available.
- This is fetched data — only show if `maxDiscount` > 0.

### Files to modify

#### [MODIFY] Last Minute page
Add a glass stat card (same as hero floating card on homepage):
```tsx
{maxDiscount > 0 && (
  <div className="inline-flex items-center gap-4 px-6 py-4 rounded-[20px] bg-white/[0.08] border border-white/[0.12] backdrop-blur-[16px] shadow-warm-lg mt-6">
    <span className="font-display text-[52px] text-s-yellow leading-none">−{maxDiscount}%</span>
    <div>
      <p className="text-white font-heading font-bold text-sm">Max. Rabatt</p>
      <p className="text-white/45 text-xs font-body">heute verfügbar</p>
    </div>
  </div>
)}
```

**Verification:** `npm run build` — stat card shows if data exists, hidden if none.

**Git commit:** `git add app/[locale]/last-minute && git commit -m "R35-P3: Last Minute hero Bebas Neue max discount stat card"`

---

## Dependency Ordering

| Step | Depends On |
|---|---|
| Phase 1 — LastMinuteCard | Must be done first (used in Phase 2 page) |
| Phase 2 — page layout | Phase 1 complete |
| Phase 3 — stat card | Phase 2 complete |
