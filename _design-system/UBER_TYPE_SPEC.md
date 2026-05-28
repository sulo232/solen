# Uber.com typography spec — observed on mobile, applied to Solen

**Source:** `/Users/sulo/solen/screenshots/IMG_D93620758D3D-1.jpeg` — Uber.com mobile home (Zurich locale), iPhone 393 CSS px viewport, full-page scroll capture (804×11418 raw image @ DPR 2.05).

**Method:** Visual analysis of the rendered hierarchy across 8 distinct sections (Hero, Suggestions, Your Account, Past trips, Get Almost Anything, Plan for Later, Benefits, Planning Your Next Getaway, It's Easier in the Apps, Footer). Pixel-spec-auto failed on this full-page scroll (no card boundaries), so this is a visual estimate cross-checked against cap-height pixel scans.

---

## §1 — Uber's observed type ladder (mobile, 393 CSS px)

| Role | Sample | Est. size | Weight | Notes |
|---|---|---|---|---|
| **Hero H1** | "Request a ride" | **26–28px** | 600 medium-bold | One per page, ONLY thing >24px |
| **Section H2** | "Suggestions" / "Your account and activity" / "Get almost anything delivered" / "Plan for later" / "Benefits" / "Planning your next getaway?" / "It's easier in the apps" | **18–20px** | 600 | ALL section headers same size — no scaling chaos. Reads as a quiet repeating rhythm. |
| **Card title (inside card)** | "Get your ride right with Uber Reserve" / "Download the Uber app" | **16–18px** | 600 | Smaller than section H2 because the card itself is the hierarchy signal |
| **Body / input / paragraph** | "Enter location" / "Choose your exact pickup time" / "From weekend road trip..." | **14–15px** | 400 | Reads natural, never thin |
| **Meta / dates / small labels** | "May 27 · 12:45 AM" / "CHF 9.00" / trip card lines | **13px** | 400-500 | Functional info, never the focus |
| **Eyebrow / footer h3** | "Most recent" / "Past" / "Company" / "Products" / "Travel" | **12–13px** | 500-600 | Sometimes uppercase, sometimes title-case |
| **Tiny legal / copyright** | "© 2025 Uber Technologies Inc" | **11–12px** | 400 | |

**Total tiers: 7.** That's it. No huge `clamp()` ladders. No 40-46px hero on mobile. No Page H2 at 40px.

---

## §2 — What makes Uber feel "premium" + "calm"

1. **Hero H1 is restrained.** "Request a ride" is **26-28px medium-bold**, not 40-46px extrabold. The page never shouts.
2. **All section H2s are the SAME size** (18-20px). No "Page H2 = 40px, Section H2 = 24px" two-tier system. One size repeats across the whole scroll = quiet rhythm.
3. **Weight stays in 400-600 band.** No 700 or 800. Bold-but-medium. Geometric. Looks tech-considered, not marketing-shouty.
4. **Tracking is moderate** (~-0.01em on headers, normal on body). Not aggressive negative tracking.
5. **Card titles are SMALLER than section H2s** (16-18px vs 18-20px) — because being inside a card is already a hierarchy signal. Solen currently does the opposite (subsection H3 at 18-23 is BIGGER than the rule of thumb would want).
6. **Footer typography is COMPACT** — even the "Uber" wordmark in the footer is only ~16px. Solen's footer was sized like a display element.

---

## §3 — Current Solen LOCKFILE vs proposed Uber-aligned scale

| Role | Solen LOCKFILE today | Proposed (Uber-aligned) | Δ |
|---|---|---|---|
| Hero H1 (homepage "Termin in 30 Sekunden") | clamp(32, 8vw, 40) / 600 | **clamp(26, 7vw, 30) / 600** | mobile −6, desktop −10 |
| Salon-PDP H1 (entity name, "Atelier Haarwerk") | 40 / 48 / 700 | **30 / 34 / 600** | mobile −10, desktop −14 |
| Page H2 (/business "Solen für dein Geschäft", /partner hero, etc.) | clamp(25, 4vw, 40) / 800 | **clamp(22, 2.8vw, 26) / 600** | mobile −3, desktop −14 |
| Section H2 (homepage section headers, PDP sections) | clamp(20, 2vw, 24) / 600 | **clamp(18, 2vw, 20) / 600** | mobile −2, desktop −4 |
| Subsection H3 (card titles inside Bento, "Coiffeur"-tile labels) | clamp(18, 1.8vw, 23) / 700 | **clamp(16, 1.6vw, 18) / 600** | mobile −2, desktop −5 |
| Eyebrow | 11-12 / 700 | **11-12 / 600** | weight −1 tier |
| Body | 14-15 / 400 | **14-15 / 400** | unchanged |
| Body small | 13 / 400 | **13 / 400** | unchanged |
| CTA | 14-15 / 600 | **14-15 / 500** | weight −1 tier |

**The big moves:**
- **All H1s shrink** (mobile: −6 to −10 px; desktop: −10 to −14 px)
- **Page H2 drops dramatically** (40 → 26 desktop = −35%)
- **Section H2 + Subsection H3 trim** (smaller, lighter, more breathable)
- **Weights drop 700 → 600 and 600 → 500** in non-H1 roles (Uber rarely uses 700, never 800)

---

## §4 — Implementation plan

### Files to touch (LOCKFILE + 3 representative hero components first)

1. **`_design-system/LOCKFILE.md` §2** — update the typography table with new sizes/weights
2. **`app/[locale]/_components/homepage/Hero.tsx`** — H1 sizes
3. **`app/[locale]/_components/salon/SalonHeader.tsx`** — Salon-PDP H1
4. **`app/[locale]/_components/homepage/SectionHeader.tsx`** + every callsite — Section H2
5. **`app/[locale]/business/page.tsx`** — Page H2 ("Solen für dein Geschäft" hero)
6. **`app/[locale]/_components/business/BentoCard.tsx`** — Subsection H3 (Bento card titles)
7. **`app/[locale]/_components/homepage/CategoryTiles.tsx`** — tile labels
8. **`app/[locale]/_components/salon/Sal*.tsx`** all PDP section H2s — Section H2 sweep

### Approach

- **Round 1** — LOCKFILE update + 3 highest-impact files (Hero, Salon-PDP, /business). Live preview, user confirms.
- **Round 2** — sweep remaining Section H2 + Subsection H3 callsites via grep+sed.
- **Round 3** — eye-walk 5 routes on phone, fix any awkward fallouts.

---

## §5 — Risks

- **Hero "Termin in 30 Sekunden." goes from 2 lines to 1 line** at clamp(26, 7vw, 30) — on 375px viewport, 7vw = 26px. "Termin in 30 Sekunden." at 26px Geist 600 ≈ 250px wide. Fits one line at 375 (acc. for 64px outer padding = 311 usable). Loses the staircase intent — might feel "smaller" rather than "calmer." User must confirm direction.
- **Page H2 going from 40 → 26 on desktop is a big shift.** /business "Solen für dein Geschäft" hero would feel less monumental. Maybe correct — Uber's "Request a ride" isn't monumental either.
- **The whole spirit of Solen pre-V3-D317 was "Uber-modern with display↔body weight contrast"** (Inter Tight 800 + Hanken 300, 3× weight ratio). Going Geist single-family at 600 strips that contrast. We already lost some of it in the Geist swap; this would commit fully to flat hierarchy.

---

## §6 — Open question for user

**Pick one of:**

- **(a) Match Uber exactly** — apply §3 table as-is. Most restrained. Most "calm." Loses pre-existing Solen identity moments.
- **(b) Match Uber for sections, keep Solen's bigger H1** — apply §3 to everything EXCEPT Hero H1 (keep current 32/40). H1 stays as the only "show-off" moment per page; everything else calms down.
- **(c) Partial sweep — Section H2 + H3 only** — leave H1s alone (they were just tuned today). Only trim the section/subsection headers. Smallest delta, lowest risk.
- **(d) Build a side-by-side mockup first** — render the homepage hero + 2 sample sections in current vs proposed, you eyeball before I sweep.

My pick: **(d) mockup first.** This is a 30+ file sweep, worth confirming direction before executing.
