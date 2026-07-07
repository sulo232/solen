# Solen V3 — Patterns + Fresha translation playbook

> TOMBSTONE (2026-07-07): Parts 1-3 (the retired emerald/terracotta palette + component pattern library from the pre-B&W-pivot era) were removed as dead weight; they described components and colors superseded by the current design system. Current colors + components: `_design-system/LOCKFILE.md` + `_design-system/COMPONENT_REGISTRY.md`.

> **Operational playbook for any new V3 surface.** Distills what we built on the homepage into reusable patterns + concrete rules + a Fresha→Solen adaptation guide. Auto-loaded by Claude on session start via `CLAUDE.md` "Topic-specific rules" table.
>
> **Hierarchy:** `_design-system/SOURCE.md` (canonical) + `_design-system/LOCKFILE.md` (frozen literals) are the principal *spec* docs. This file is the *playbook*: how to apply those locked specs to new surfaces. When the two disagree, SOURCE.md + LOCKFILE.md win. (The old V2 `_tasks/archive/SOLEN_LIVE_TRUTH.archived.md` is archived; do not treat it as authoritative.)
>
> Last updated 2026-05-10 after V2-D49 series.

---

## Part 4 — Salon detail page adaptation playbook

**The translation principle:** Fresha is a *costume* (visual reference). Solen is the *anchor* (brand voice). For each Fresha element, identify what it COMMUNICATES (info / action / photo / decoration), then deliver that communication using the matching current component from Part 6.

### 4.1 Anticipated element-by-element mappings

| Fresha element | Solen pattern |
|---|---|
| Photo gallery hero | Hero pattern (eyebrow + h1) + photo carousel via ScrollRow + scroll arrows |
| Sticky tab bar (Services / Über / Bewertungen / Standort) | New §SD spec; ink active underline; bg becomes opaque white + `backdrop-blur(12px)` once stuck |
| Service list with prices | SalonCard `variant=service` Row 2 pattern: service name + `ab CHF [price]` with ink price accent |
| Staff section | FeaturedStylists pattern (circular avatar + name + specialty/city + rating pill) |
| Reviews summary | TestimonialsColumn split-tap pattern OR static 3-card grid using same card structure |
| Photo carousel | ScrollRow + circle scroll arrows from SectionTitle |
| Sticky bottom booking CTA | Ink pill at bottom of viewport on mobile (`fixed bottom-4 inset-x-3`); sidebar position on desktop |
| Opening hours table | Custom rows; availability as plain ink text per current semantic rule (no green pill) |
| Map | Deferred to v2 (already locked OUT for now) |

### 4.2 What to keep from Fresha (information architecture)

- Page IA — what content appears, in what order.
- Tab structure (services / about / reviews / location / staff).
- Booking CTA wiring (CTA → booking wizard `/book/[slug]`).
- Per-service "Buchen" buttons.
- Photo gallery order (hero → all photos).

### 4.3 What to drop from Fresha (visual treatment)

- All Fresha colors → current locked palette only (see `_design-system/LOCKFILE.md`).
- All Fresha typography → Inter Tight display + Inter body.
- All Fresha button styles → ink commit CTAs.
- All Fresha card shadows → current depth system (single-shadow, neutral-tinted).
- All Fresha icons → lucide-react only.
- Fresha pill styles → flat-pill discipline (no gradients, no inset gloss, no italic).

### 4.4 What to adapt to Solen voice

- Section h2s → use SectionTitle pattern (with scroll arrows where horizontal lists exist).
- Vertical rhythm → `mb-2 md:mb-4` between sections.
- Cropped giant elements (e.g. salon name as hero) → consider a cropped-wordmark pattern adapted to a top hero band, if one exists in the current component set.

---

## Part 5 — Workflow when the Fresha reference arrives

1. **Spec draft** → Record the salon-detail-page spec in `_design-system/SOURCE.md` (canonical) covering Fresha-mapped IA in current voice. Include anatomy diagram, tab structure, sticky bar behavior, motion specs, accessibility map.
2. **Mockup HTML** → mockup-first per CLAUDE.md, rendering full page at desktop + mobile widths. Use real current tokens. No new patterns invented, every element references a Part 6 component by name.
3. **Conflict scan** → Cross-check against the current color rule (`_design-system/LOCKFILE.md`), the SalonCard variant, the SectionTitle scroll-arrow rule, and anti-patterns in `_rules/SOLEN_UI.md`.
4. **User sign-off** on mockup, mockup-first per CLAUDE.md visualize-visual-questions rule.
5. **Implement** under `app/[locale]/salon/[slug]/page.tsx` + components in `app/[locale]/salon/[slug]/_components/`. Reuse Part 6 components verbatim where possible.
6. **Lock** by marking the salon-detail spec as locked in `_design-system/SOURCE.md` + `_design-system/LOCKFILE.md`.

---

## Part 6 — Reusable component inventory (file paths)

**Layout:**
- Header: `app/[locale]/_components/layout/Header.tsx`
- Footer: `app/[locale]/_components/layout/Footer.tsx`

**Homepage components (reusable on salon detail):**
- SalonCard: `app/[locale]/_components/homepage/SalonCard.tsx`
- HeartButton: `app/[locale]/_components/homepage/HeartButton.tsx`
- FeedZone / Section / SectionFrame / SectionTitle / ScrollRow / ScrollCircleButton (all from): `app/[locale]/_components/homepage/SectionHeader.tsx`
- TestimonialsColumn (review marquee): `app/[locale]/_components/homepage/TestimonialsColumn.tsx`
- AtmosphereBlobs: `app/[locale]/_components/homepage/AtmosphereBlobs.tsx`
- AtmosphereGrain: `app/[locale]/_components/homepage/AtmosphereGrain.tsx`
- Both atmosphere layers mounted at the page level via `app/[locale]/page.tsx`; surfaces inheriting via shared layout don't need to remount.

**Homepage feed-section components (page-specific, reuse pattern not the file directly — they wrap SalonCard + Section pattern with section-specific demo data):**
- RecentlyViewed: `app/[locale]/_components/homepage/RecentlyViewed.tsx`
- LastMinute: `app/[locale]/_components/homepage/LastMinute.tsx`
- Nearby: `app/[locale]/_components/homepage/Nearby.tsx`
- Coiffeur (category section): `app/[locale]/_components/homepage/Coiffeur.tsx`
- Reviews: `app/[locale]/_components/homepage/Reviews.tsx`
- Entdecken: `app/[locale]/_components/homepage/Entdecken.tsx`
- WhySolen / SalonRegister B2B: `app/[locale]/_components/homepage/WhySolen.tsx`
- Hero: `app/[locale]/_components/homepage/Hero.tsx`

**Primitives** (`app/[locale]/_components/primitives/`):
- Modal · Sheet · Toast · DateTimePicker · TextInput · Textarea · Checkbox · Radio · Switch · Select · PillToggle · CookieConsent · Logo · SkipLink · FieldLabel · FieldHelper

---

## Part 7 — Verification

When a new surface lands (salon detail, booking wizard, profile, etc):

1. **Visual check** — Render at mobile 375 / 393 (iPhone 16) / desktop 1280. Compare each section against its spec + mockup HTML.
2. **Color rule check**: run `grep -r "bg-s-accent" app/[locale]/<surface>/` and verify every match is a small clickable bit per project CLAUDE.md taste rules, never a big CTA, price, or heading.
3. **Pattern reuse check**: every section uses a Part 6 component by name. No new ad-hoc components unless approved.
4. **Spec lock**: the surface's spec exists in `_design-system/SOURCE.md` with a mockup reference.
5. **End-to-end** — Real-device smoke test of the user funnel that touches the surface.

---

## Part 8 — Anticipated open questions when Fresha arrives

These are product/flow questions to surface via AskUserQuestion early, not assume:

1. **Booking flow integration** — Does "Buchen" go to a wizard route (Phase 2 §BW at `/book/[slug]`) or modal?
2. **Photo gallery interaction** — full-screen lightbox on tap, or just horizontal scroll?
3. **Sticky CTA on mobile** — single button "Termin buchen" or expanded with date+time?
4. **Per-service quick-book** — does each service row have its own "Buchen" or only the overall page CTA?
5. **Auth gate**: does booking require login first? (Guest checkout was already locked OUT of v1.)
6. **Cropped hero treatment**: does the salon name use a cropped-wordmark hero pattern, or stay h1-style?
