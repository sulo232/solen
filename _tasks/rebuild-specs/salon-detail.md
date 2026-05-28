# /salon/[slug] Rebuild Spec — 2026-05-26

> **Scope.** Salon-detail route. Mobile-first, then desktop. Target: V3-D193 (SOURCE.md as of 2026-05-26). Out of scope: booking flow (`/salon/[slug]/booking`), gift-card / packages sub-routes, `/api/*`, schema, auth flows.
>
> **Spec authoring rule.** SPEC ONLY this round — no code edits. The "Sequence of mechanical edits" section is intentionally pre-planned but not executed. Each edit is surgical.

---

## §0 · Route topology (where the page actually lives)

There are **TWO implementations of the salon-detail page in the repo right now** — only one is wired to the route.

| File | Role | LoC | Status |
|---|---|---|---|
| `app/[locale]/salon/[slug]/page.tsx` | **THE wired route** — default-exports `SalonProfilePage`. Imports section components from `/components-legacy/salon/*` (V2-D49 / V2-D70 era). | 811 | **Live**, heavy drift |
| `app/[locale]/_components/salon/SalonDetailV3.tsx` | Newer V2-D53.3 orchestrator + 17 colocated section components under `app/[locale]/_components/salon/*.tsx`. Imports `SalonHero / SalonHeader / SalonServices / ...` from the same folder. | 322 | **Dormant** — never imported by `page.tsx` or any route |

This fork is the most important finding of the audit. **The rebuild plan below collapses the fork**: `page.tsx` becomes a 4-line wrapper that mounts `SalonDetailV3`, after V3-rebuild edits land on the V3 component family. The legacy import chain to `/components-legacy/salon/*` is severed.

### Why this matters

- The Mobile screenshots a user sees in production right now come from `SalonProfilePage` (page.tsx). It uses `s-coral`, gradient washes, retired easings, hardcoded `#F3A864` star fills, multiple competing `style={{ background: ... }}` glass overlays — the Aurex / V2-D70 era.
- `SalonDetailV3` is already ~80% on the right track (B&W chrome, `text-s-ink` typography, no `s-coral` references in the orchestrator). The retired-token incidents are concentrated in: the leaked `text-emerald-600` + `text-amber-700` status colors in `SalonHeader` + `SalonSidebar`, hardcoded `#F3A864` star fills in 8 of the 17 sections (should use `s-star` `#FFC32B` per Q1 lock), and a few stale provenance shadows tinted with the retired `rgba(31, 92, 66, …)` emerald.
- The TabKey labels in `_shared.ts` are English (`"Photos" "Services" ...`) while the rest of the page renders German (`"Bewertungen" "Öffnungszeiten"`). i18n drift, fixable in-place.

---

## §1 · Current state — drift summary

### `app/[locale]/salon/[slug]/page.tsx` (THE WIRED ROUTE)

Single-purpose: render the live salon. Severity = HIGH drift. **Not the rebuild surface.** This file's body gets replaced wholesale by a thin wrapper (see §5).

Key drift items (for context, NOT to fix individually before the V3 swap):
- L75-87 `CAT_TAG_COLOURS` map: hardcodes retired warm hex (`#5A4429`, `#4A1E3C`, etc.) — pre-B&W pivot.
- L96 `<Star className="fill-s-amber text-s-amber">`: `s-amber` not in tokens (retired V3-D85).
- L155-176 `OffPeakCountdown`: inline `rgba(27, 77, 27, …)` (retired forest emerald `s-brand-deep`), `text-s-coral`, inline glass styles — retired wholesale.
- L192-237 `NailArtistPreviewCard`: inline glass `backdropFilter: "blur(16px) saturate(1.2)"` + `bg-s-coral` Book button — retired V3-D138.
- L332 404 fallback: `bg-s-coral` button — retired.
- L388-401 breadcrumb: `hover:text-s-coral`, `text-s-ink/45` — `text-s-ink/45` is an arbitrary opacity drift (should use `text-s-ink-3`).
- L414 inline `style={{ color: "#F3A864" }}` for category eyebrow — should be `text-s-accent` (V3-D192 royal blue) per §1 of SOURCE.md.
- L417 `<p className="font-heading text-[24px] sm:text-[32px] md:text-[40px] uppercase …">` for salon name in hero overlay: ALL-CAPS salon name violates §3 sentence-case lock + `font-heading` alias is ambiguous post-V3-D190 (display = Inter Tight via `font-display`).
- L443-447 category pills: inline `style={{ background, color }}` from retired CAT_TAG_COLOURS.
- L463-499 social/contact rows: `hover:text-s-coral` everywhere (8 instances), `rounded-input` on hover bg `bg-s-coral/[0.06]`.
- L524 about-us card: `border border-s-ink/5` arbitrary opacity, `shadow-elevation-1` is fine; `text-s-ink/70` should be `text-s-ink-2`.
- L545-595 atmosphere/expertise/products/transport cards: 4 instances of multi-line inline `style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)", border: "1px solid rgba(255,255,255,.55)", boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.70)" }}` — Aurex glass, retired.
- L652-665 barber roster cards: `hover:shadow-v5-card-hover`, `ease-[cubic-bezier(0.23,1,0.32,1)]` arbitrary easing (retired alias), `group-hover:ring-s-coral/40`.
- L699 / L706 gift-card + packages tiles: `bg-s-coral/5 hover:bg-s-coral/10`, `text-s-blue` (`s-blue` is a retired alias).
- L750 mapbox static URL: `pin-s+E8624A` — terracotta map pin from V2-D70 era (should be `pin-s+0A0A0A` ink for B&W chrome, or transparent + custom pin).

### `app/[locale]/_components/salon/*` (THE V3 DORMANT IMPLEMENTATION)

Severity = MED drift. **This IS the rebuild surface.** Bring it on-spec, then point `page.tsx` at it.

| File | LoC | Purpose | Drift items (mechanical) |
|---|---|---|---|
| `SalonDetailV3.tsx` | 322 | Orchestrator. Fetches `/api/salons/${slug}`. Manages lightbox state. Composes the page. | L145-162 ambient gradient washes use retired warm/sage/emerald colors (`#F2C49B`, `#5BAE85`, `#D6754F`, `#F0C85A`, `#9CC0A4`, `#E89A88`). 8 absolute `<div>`s with opacity 0.09-0.11. **Whole atmosphere block should be deleted** — V2-D68 retired atmosphere wash. L289 `LoadingSkeleton` uses `animate-pulse` (fine) on `bg-s-bg-sunken` (good), but pattern doesn't match `LoadingStates.md` Pattern 1 (no shimmer keyframe). L307 NotFound h1: `text-s-accent` on "nicht gefunden" — V3-D192 says blue is for small highlight moments, but this is a heading split; acceptable as an inline emphasis. Provenance comments at L31-50 still reference Peace Sans / V2-D49j / emerald action color — stale; needs V3-D193 update note. |
| `SalonBreadcrumb.tsx` | 78 | Top breadcrumb (desktop only). | L44 `replace(/[̀-ͯ]/g, "")` regex strips combining marks — fine. No drift. Clean. |
| `SalonHero.tsx` | 219 | Mobile: full-bleed cover w overlay icons. Desktop: 3-photo gallery (1 big + 2 stacked). | L57 `text-s-ink-3/30` arbitrary opacity (use `text-s-ink-disabled` per §2.1 or a named `/30` ramp). L78 inline `stroke="rgba(255, 255, 255, 0.95)"` + multi-line `drop-shadow` filter — fine, matches §7 "floating-on-photo icons" pattern. L119 photo-count pill: `bg-white/95 backdrop-blur-md` — `backdrop-blur-md` flagged §13 mobile-perf rule (gate behind `md:` or remove). L145 `aspect-[16/7]` desktop hero: `rounded-3xl` (24px) outside the §5 radius scale; should be `rounded-card-lg` (20px) or `rounded-[28px]` if matching hero ambition. |
| `SalonHeader.tsx` | 132 | Title block under hero. Salon name + meta row + Featured pill + desktop share/heart. | L42 `<h1 className="font-body text-[24px] font-bold ... md:text-[36px] lg:text-[44px]">`: title uses **`font-body` (Hanken)**, but §3 type role table says **all H1s = `font-display` Inter Tight 800**. This is the single most visible typography drift. L49 `<Star fill="#F3A864" stroke="none" />`: hardcoded F3A864 (orange-pink, retired warm pearl era). Should be `fill="#FFC32B"` (s-star yellow, Q1 lock). L58-63 status pill: `text-emerald-600` / `text-amber-700` — Tailwind defaults, NOT Solen tokens. Open status = `text-s-success`, closed = `text-s-warning`. L83 Featured pill: `bg-s-accent/15 ... text-s-accent` (and `s-accent` is now royal blue per V3-D192-fix — fine, matches "NEW pill" use case in §2.1). L88 last-minute pill: `bg-amber-100 ... text-amber-900` — should be the Flame badge spec `bg-[#FFF1E6] text-[#9A3412]` per §2.1 signals. |
| `SalonStickyTabNav.tsx` | 136 | Fixed-top tab bar that fades in on scroll past hero. IntersectionObserver scroll spy. Active tab = ink underline. | Clean. Uses `bg-s-ink` underline (correct), `text-s-ink-3` for inactive tabs (correct). L107 `border-b border-s-border` (correct). The only issue is the LABELS come from `_shared.ts TAB_SECTIONS` which is English ("Photos", "Services", "Team", "Reviews", "Portfolio", "About", "Loyalty") — should be German per §17 ("Fotos", "Services", "Team", "Bewertungen", "Portfolio", "Über uns", "Treueprogramm"). i18n drift, locked-out fix. |
| `SalonAppCta.tsx` | 74 | Bottom-of-page repeated CTA + chip-link row to discoverability surfaces. | L65 box-shadow `shadow-[0_4px_16px_rgba(31,92,66,0.20)]`: **retired tinted shadow** — RGB `(31, 92, 66)` is the V2-D49 emerald `s-brand-deep`. Per §5 / §2.3 "Tinted shadows where RGB matches retired brand color" is anti-pattern. Replace with `shadow-elevation-2`. L46 heading uses `font-body` 20-26px — fine as a CTA-section h2 but bumps against §3: section-h2 spec is `font-display` 18-23px. Either keep `font-body` and acknowledge as a CTA-section heading variant, or migrate to `font-display`. Recommendation: this section is page-bottom marketing — bump to `font-display` to match Page H2 size. |
| `SalonContact.tsx` | 80 | Mobile-only contact rows (phone / website / Instagram). | Clean. Uses `text-s-ink` / `text-s-ink-2` / `text-s-ink-3`, lucide icons, no drift. |
| `SalonServices.tsx` | 205 | Filter pills row + service list (mobile divider / desktop bordered cards) + "Alle ansehen" sheet trigger. | L93 active filter pill `border-s-ink bg-s-ink text-white` (correct), inactive `border-s-border bg-white text-s-ink-2` (correct). L128 "Alle ansehen" button: `border border-s-ink bg-white px-8 py-3` — fine. L180 Book button on each service row: same outline-pill style — fine. **No drift.** Only the SectionHeader at L200 is `font-body` not `font-display`. |
| `SalonTeam.tsx` | 114 | Horizontal carousel of staff with floating rating badge. | L36 `<h2 className="font-body text-[18px] font-bold ...">`: same h2 drift (font-body, not font-display). L76 photo ring: `shadow-[0_4px_12px_rgba(31,92,66,0.10)]` — retired tinted emerald shadow. Replace with `shadow-elevation-1`. L99 star `fill="#F3A864"` — Q1 drift, should be `#FFC32B`. |
| `SalonReviews.tsx` | 170 | Avg rating summary + 2-col review cards + "Alle ansehen" expander. | L42 h2 `font-body` drift. L53 + L140 star fill `#F3A864` → `#FFC32B`. L53 empty-star fill `#E8DFD2` (retired cream); should be `#E7E5E4` (`s-border`) for B&W. L119 avatar initial: `font-display` text — fine; uses `avatarColor()` palette which contains retired colors (rose `#FDE2E4` w fg `#9C2B45`, terracotta `#FAF2E5` w fg `#C97A57`, etc.). The whole `AVATAR_PALETTE` in `_shared.ts` is retired V2-D70 era warm tones — should be either neutral grayscale or Hanken-Tight-friendly stable hashes from a fresh palette. (Open: keep colored avatars as content-color, or B&W per Q19 "chrome stays B&W; user content stays color"? Initials with stable hashes are a CHROME element, not user content → should be B&W. Recommend a 3-tone neutral palette: light-gray bg + ink fg, mid-gray bg + ink fg, dark-gray bg + white fg.) |
| `SalonPortfolio.tsx` | 86 | 3-col square photo grid w "+N" overlay. | L37 h2 `font-body` drift + uses `text-s-ink-3` for the count (fine). L77 overlay `font-display text-[24px] font-black text-white` — `font-black` = 900; §3 H1 is 800; **use `font-extrabold` (800)** for systemic consistency. |
| `SalonBuy.tsx` | 76 | Gift-card promo (standalone + sidebar variants). | L61 `<Gift size={24} ... className="text-s-ink ...">` — fine. L46 sidebar variant: outline pill `border-s-ink bg-white px-5 py-2 text-[13px]` — fine. **No drift** — the cream-bg "neutral cream" comment in the docblock is stale (it actually uses `bg-white`, not cream). Provenance comment should be updated. |
| `SalonAbout.tsx` | 119 | About paragraph + map placeholder + address row. | L39 h2 `font-body` drift. L85-110 MapPlaceholder: `bg-gradient-to-br from-s-bg-sunken via-white to-s-bg-sunken` — fine. SVG grid pattern stroke `#A8B89A` (sage, RETIRED V2-D49j) — change to `#E7E5E4` `s-border` for B&W chrome. L106 center pin uses `bg-s-ink text-white` — correct, B&W. Map is a placeholder until `NEXT_PUBLIC_MAPBOX_TOKEN` lands. |
| `SalonOpeningTimes.tsx` | 63 | Day-by-day list w open/closed dot. | L27 h2 `font-body` drift. L47 `bg-emerald-500` / `bg-s-ink-3/40` — emerald-500 is Tailwind default green (`#10B981`), NOT a Solen token. Should be `bg-s-success` (`#16A34A`) for open OR more decisively: per the B&W lock the status dot should be `bg-s-ink` (open) / `bg-s-border` (closed). Open question (raise as Q22): does the open/closed dot get to keep its green tint as a "signal" (like the star yellow)? Recommendation: **`bg-s-ink` for open + `bg-s-border` for closed** — true B&W chrome; the "Open until 19:30" text label communicates status. |
| `SalonAdditionalInfo.tsx` | 92 | Amenity checklist (12 boolean flags → lucide icon + label). | Clean. Uses `text-s-ink` / `text-s-ink-2` / `text-s-ink-3` consistently. L69 h2 `font-body` drift. |
| `SalonLoyalty.tsx` | 105 | 4 program-pillar accordion rows. | L57 h2 `font-body` drift. L71 `<button className="border border-s-border bg-white p-4 transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">` — fine. L74 `text-s-ink` for icon (correct, B&W). |
| `SalonOtherLocations.tsx` | 98 | Sibling-salon cards w image + name + rating + address. | L32 h2 `font-body` drift. L82 star fill `#F3A864` → `#FFC32B`. L67 card hover shadow `shadow-[0_2px_12px_rgba(0,0,0,0.06)]` — fine (warm-ink rgba). |
| `SalonVenuesNearby.tsx` | 171 | Nearby-salons carousel (same category). Fetches from `/api/salons/by-category`. | L86 / L103 h2 `font-body` drift. L155 star `#F3A864` → `#FFC32B`. L113 / L122 arrow buttons `border border-s-border bg-white` — fine, matches §6.4 ScrollCircleButton spec. |
| `SalonSidebar.tsx` | 247 | Sticky desktop sidebar (right rail). Two-state collapse-on-scroll. | L78 chrome shadow `shadow-[0_8px_28px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]` — close to `shadow-elevation-3` but uses arbitrary rgba — replace with token. L90 salon-name uses `font-body` (drift). L96 star `#F3A864` → `#FFC32B`. L106 Featured pill `bg-s-accent/15 text-s-accent` — fine (V3-D192 royal blue use case). L117 Book CTA: `bg-s-ink py-3.5 text-[15px] font-semibold` + `shadow-[0_4px_16px_rgba(31,92,66,0.18)]` — retired tinted emerald shadow. Replace with `shadow-elevation-2` (warm-ink). L144 status `text-emerald-600` / `text-amber-700` — Tailwind defaults, not Solen tokens. |
| `SalonMobileBookBar.tsx` | 38 | Fixed bottom mobile CTA bar. | L28 `bg-white/95 ... backdrop-blur-md` — `backdrop-blur-md` flagged §13 mobile-perf; either gate `md:` or drop blur. L31 Book CTA `bg-s-ink py-3.5 text-[15px]` — fine. No tinted shadow. Clean otherwise. |
| `SalonServicesSheet.tsx` | 541 | Full-screen overlay sheet for service selection (booking step 1). Sticky chip-bar + cart sidebar + mobile bottom-bar. | L243 active chip `border-s-ink bg-s-ink text-white shadow-[0_2px_8px_rgba(31,92,66,0.18)]` — retired tinted shadow (replace with `shadow-elevation-1`). L277 selected service card `border-s-ink shadow-[0_4px_16px_rgba(31,92,66,0.10)]` — same. L396 cart card `shadow-[0_8px_28px_rgba(0,0,0,0.08), 0_2px_6px_rgba(0,0,0,0.04)]` — replace with `shadow-elevation-3`. L429 star fill `#F3A864` → `#FFC32B`. L429 empty-star `#E8DFD2` (retired cream). L505 Continue CTA `bg-s-ink shadow-[0_4px_16px_rgba(31,92,66,0.20)]` — retired tinted shadow. L226 sheet h1 `font-body text-[28px] md:text-[40px]` — should be `font-display text-[clamp(25px,4vw,40px)]` per §3 Page H2. |
| `SalonLightbox.tsx` | 113 | Full-screen photo modal w prev/next + counter. | Clean. Uses `bg-black/95` backdrop, `bg-white/10 ... backdrop-blur-md` for floating control buttons. `backdrop-blur` here is on a fullscreen modal not a scrolling carousel — perf-acceptable. No tinted shadows. |
| `_shared.ts` | 233 | Types + helpers + `TAB_SECTIONS` constant + `avatarColor()` palette + `computeOpenStatus()`. | L175-184 `AVATAR_PALETTE` contains retired colors (rose, terracotta, cream). See SalonReviews drift note. L222-230 `TAB_SECTIONS` labels are English — needs German + i18n routing. |

### Aggregate drift count (V3 implementation only — the rebuild surface)

| Drift class | Hits | Severity |
|---|---|---|
| Hardcoded `#F3A864` star (Q1: should be `#FFC32B`) | 8 sites | HIGH (rating color, repeated everywhere) |
| Empty-star `#E8DFD2` (retired cream) | 3 sites | MED (should be `#E7E5E4` `s-border`) |
| H2 uses `font-body` instead of `font-display` | 11 sites | HIGH (every section heading) |
| H1 uses `font-body` not `font-display` | 1 site (SalonHeader L42) | HIGH (highest-visibility title) |
| Tinted emerald shadow `rgba(31, 92, 66, ...)` | 6 sites | MED |
| Tailwind default `text-emerald-600` / `text-amber-700` (not Solen tokens) | 2 sites (SalonHeader + SalonSidebar) | MED |
| Tailwind default `bg-emerald-500` for open dot | 1 site (SalonOpeningTimes) | MED |
| Avatar palette retired warm tones | 1 source (`_shared.ts` propagates everywhere) | MED |
| `backdrop-blur-md` on mobile scrolling chrome | 2 sites (SalonHero photo-count pill, SalonMobileBookBar) | LOW (mobile perf §13) |
| English `TAB_SECTIONS` labels (i18n) | 1 source | MED |
| Retired warm gradient washes in orchestrator | 1 site (8 `<div>`s) | HIGH (remove block) |
| Tailwind defaults `font-black` (900) where §3 wants `font-extrabold` (800) | 2 sites (SalonHero monogram, SalonPortfolio overlay) | LOW |

**Total V3-implementation fixable items: ~38 grep-able edits across 14 files. None require a structural rewrite. All fit the §15 "surgical edits only" rule.**

---

## §2 · Target IA (Fresha-mapped)

Order from top to bottom of the page on mobile (single column). Desktop uses a 2-col grid (`1fr 340px`) where the right column is a sticky booking sidebar — the left column matches the mobile order below.

References:
- **Mobbin Fresha screens captured 2026-05-26** — 10 screens delivered, covering hero/title/tabs/services/team/reviews/buy/about/services-sheet/service-detail-sheet. (See screenshot IDs in §2.1 below.)
- **Fresha live capture (Q20 fallback)** — `public/_pixel-refs/fresha/salon-detail/fresha-mobile-full-375.png` (Lash Bar London full-page screenshot at 375px). For sections Mobbin's curated set doesn't show (e.g. the dense "Additional Info" amenities list, the Reviews summary CTA, the Venues-Nearby carousel positioning at end of page).

### §2.1 · Sections (top to bottom, mobile)

| # | Section | IA reference | Solen pattern | Status |
|---|---|---|---|---|
| 1 | **Hero gallery** | Mobbin `f2b83609` (full-bleed cover w back-arrow + share + heart top icons + "1/10" counter bottom-right) | `SalonHero` mobile branch: full-bleed cover photo, overlay icons. **No category eyebrow on the photo** (Fresha doesn't, neither do we now). | Exists in V3 component family; needs photo-count pill repositioned + radius lock |
| 2 | **Sticky tab nav** (shown once user scrolls past hero) | Mobbin `f2b83609` (Photos · Services · Team · Reviews · Buy · About) | `SalonStickyTabNav` — fixed top, IntersectionObserver scroll-spy, ink underline on active tab. | Exists, clean. Needs German labels (§17). |
| 3 | **Title block** | Mobbin `eddf7b74` ("Creation beauty & Nail lounge" 800-weight, "5.0 (83)" rating row, address row, "Closed opens on Wednesday at 10:00 AM" status, "Featured" pill in purple) | `SalonHeader` — but title must move from `font-body` to **`font-display`** (Inter Tight 800) per §3 Page H2 spec. Featured pill stays `s-accent` (royal blue per V3-D192). | Exists; **HIGH-priority font swap.** |
| 4 | **Services list** | Mobbin `f2b83609` + `d656849a` (h2 "Services" + filter chips "Featured · Nails · Facial · Lash extensions" + service rows: name + duration + price + outline "Book" button + "Mehr lesen" 2-line description) | `SalonServices` — filter pills + first 5 services + "Alle ansehen" button (opens `SalonServicesSheet`). | Exists, on-spec for tokens; needs h2 → `font-display`. |
| 5 | **Team grid** | Mobbin `e88ff6f4` (3-up horizontal carousel: large round avatar + name + role + floating rating badge bottom-left of avatar) | `SalonTeam` — horizontal scroll w 112-136px avatars, floating rating badge. | Exists; star fill fix + shadow detox. |
| 6 | **Reviews** | Mobbin `e88ff6f4` (5-star summary row + numeric rating + count + review cards w avatar initial circle + 2-line clamp) | `SalonReviews` — average + count + 2-col grid (mobile single col). Each card: avatar circle + name + date + stars + comment (line-clamp-3). | Exists; star fix + avatar palette swap. |
| 7 | **Buy** (gift cards / packages) | Mobbin `1d97a892` ("Buy" h2 + 3 rows: Memberships / Vouchers / Gift cards, each w description + outline "Buy" button right) | `SalonBuy` standalone variant (only gift-card live; packages defer). | Exists, clean. |
| 8 | **About** | Mobbin `1d97a892` ("About" h2 + paragraph "Founded in 2013 by …") | `SalonAbout` — about text + map placeholder + address w directions link. | Exists; h2 → `font-display`, map sage grid → `s-border`. |
| 9 | **Opening hours** | (Fresha pattern — bottom of About / side-by-side w Additional Info) | `SalonOpeningTimes` — day list w open/closed dot. | Exists; h2 → `font-display` + open dot B&W. |
| 10 | **Additional info** | (Fresha amenity list: Instant booking, Cancellation, Pet-friendly, etc.) | `SalonAdditionalInfo` — vertical checklist of 12 flags, lucide icon + label. | Exists, clean (just h2 swap). |
| 11 | **Mobile contact** | Fresha shows phone/website/Instagram in title-block contact icons; we show on the page body for mobile. | `SalonContact` (mobile-only). | Exists, clean. |
| 12 | **Loyalty / Treueprogramm** | (Fresha doesn't have this; Solen-only — keep) | `SalonLoyalty` — 4-row accordion. | Exists; h2 + shadows. |
| 13 | **Other locations (if chain)** | (Fresha shows on chain salons, carousel of sibling-salon cards) | `SalonOtherLocations` — 1 fullwidth OR 2+ carousel. | Exists; h2 + star fix. |
| 14 | **Venues nearby** | Mobbin doesn't show; our Solen pattern. | `SalonVenuesNearby` — horizontal carousel from `/api/salons/by-category`. | Exists; h2 + star + arrow shadow. |
| 15 | **Marketing CTA / "Verwöhne dich"** | Mobbin doesn't capture; Fresha bottom-page repeat-CTA pattern. | `SalonAppCta` — h2 + chip-row + repeated Book CTA. | Exists; tinted shadow fix. |
| 16 | **Mobile sticky bottom book bar** | Mobbin `f2b83609` ("136 services available · Book now" — Fresha uses a dual-info bar; we use a single full-width CTA per V2-D49j brand discipline) | `SalonMobileBookBar` — fixed bottom, ink-pill CTA. | Exists; clean. |
| 17 | **Service detail sheet** (opens from any "Buchen" tap) | Mobbin `965598a3` (drawer w service name + "Read more" + radio options + "Add to booking") | NOT BUILT. **Defer to booking-flow rebuild** — out of scope per §0. |
| 18 | **Services selection sheet** (opens from "Alle ansehen" tap) | Mobbin `d656849a` + `deb5055f` + `b82c55c4` (full-screen w step breadcrumb "Services › Profi › Zeit › Bestätigen", chip filter, sticky cart sidebar) | `SalonServicesSheet` — already V2-D53.3, very close. | Exists; tinted-shadow detox + h1/h2 fonts. |

### §2.2 · Two-column desktop grid

```
┌─ Breadcrumb (desktop only) ──────────────────────────────────┐
├─ Hero gallery (full width, 16:7) ─────────────────────────────┤
├─ Title block ───────────────────────────────┬─ Sidebar ───────┤
├─ Services ──────────────────────────────────┤  Booking card    │
├─ Team ──────────────────────────────────────┤  (sticky)        │
├─ Reviews ───────────────────────────────────┤                  │
├─ Portfolio ─────────────────────────────────┤                  │
├─ Buy (mobile only — sidebar has its own) ───┤                  │
├─ About + map ───────────────────────────────┤                  │
├─ Opening hours + Additional info (2-col on md+) ──────────────┤
├─ Mobile contact (mobile only) ──────────────┤                  │
├─ Loyalty ───────────────────────────────────┤                  │
├─ Other locations (if chain) ────────────────┤                  │
├─ Venues nearby ─────────────────────────────┤                  │
├─ Verwöhne dich CTA ─────────────────────────┘                  │
└─ Mobile book bar (mobile only, fixed bottom) ─────────────────┘
```

**Sticky sidebar** (`SalonSidebar`) only renders at `lg:` (1024px+). Between 768-1023px the mobile bottom book bar takes over. This is locked behavior per V2-D53.3 user feedback.

---

## §3 · Per-section spec (against SOURCE.md V3-D193)

For each section, this is the target state. **All section h2s use `font-display text-[clamp(18px,2vw,23px)] font-bold leading-[1.2] tracking-[-0.03em] text-s-ink`** per §3 Section H2 spec. The h1 (salon name) uses `font-display text-[clamp(28px,4.5vw,44px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-s-ink` — a Page H2 / Hero H1 variant scaled for in-page surface use.

### §3.1 · Hero gallery (`SalonHero`)

- Mobile: full-bleed `aspect-[4/3]` photo (V3 keeps), no crop. Photo-count pill bottom-right uses `bg-s-ink/85 text-white rounded-full px-3 py-1 text-[12px] font-semibold` (drop the `backdrop-blur-md` — solid ink-on-photo reads cleaner + perf-friendly on iOS).
- Overlay icons: ArrowLeft + Share top-left/right, HeartButton top-right corner. All use white-stroke + drop-shadow (`filter: drop-shadow(0 1px 3px rgba(0,0,0,0.45))`) per §7 floating-on-photo pattern. HeartButton component handles itself.
- Desktop: 3-photo grid (1 large col-span-2 + 2 stacked right). Outer `rounded-card-lg` (20px) instead of `rounded-3xl` (24px) to align with §5 radius scale.

### §3.2 · Title block (`SalonHeader`)

- **Salon name h1**: `font-display text-[clamp(28px,4.5vw,44px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-s-ink`. Mobile 28-32px, tablet 36px, desktop 44px.
- Meta row: `font-body text-[13px] md:text-[14px] text-s-ink-2 font-light`. Star yellow `#FFC32B` 14px + rating bold + `(reviewCount)` in `text-s-ink-3` + `·` middle-dot + status pill + `·` + address chip + Wegbeschreibung link (`text-s-ink font-semibold hover:underline`).
- **Status colors:** open = `text-s-success` (`#16A34A` token, off-budget signal — distinct from retired `s-brand` green per §2.1), closed = use `text-s-warning` (`#F59E0B`) — OR plain `text-s-ink-2` text with a status word. (Open Q22 in QUESTIONS.md: "Should open/closed status use semantic green/amber tokens or stay B&W with text-only signal?" — Recommendation: **`text-s-success` for open, `text-s-ink-2` for closed**; "Geöffnet" feels deserving of a small green hit, "Geschlossen" needs no extra signal beyond the word.)
- Featured pill: `bg-s-accent/15 text-s-accent font-bold uppercase tracking-[0.06em] text-[11px] px-3 py-1 rounded-full` — accent is now royal blue `#1638C4`. Use case matches V3-D192-fix "NEW/status pills." LGTM.
- Last-minute pill: replace `bg-amber-100 text-amber-900` with `bg-[#FFF1E6] text-[#9A3412] border border-[rgba(154,52,18,0.22)]` — Flame badge spec per §2.1 inline urgency.
- Desktop share/heart cluster: outline-only icons in `text-s-ink`, HeartButton at the end. Right-aligned. No card chrome around the cluster.

### §3.3 · Sticky tab nav (`SalonStickyTabNav`)

- Already on-spec for chrome. Migrate labels in `_shared.ts TAB_SECTIONS` to German + use `next-intl` `useTranslations("salonDetail.tabs")`:
  - `photos` → "Fotos"
  - `services` → "Services" (loanword, fine)
  - `team` → "Team"
  - `reviews` → "Bewertungen"
  - `portfolio` → "Portfolio"
  - `about` → "Über uns"
  - `loyalty` → "Treueprogramm"
- Active state: `text-s-ink` + 2px underline `bg-s-ink` at bottom of tab.
- Inactive: `text-s-ink-3 hover:text-s-ink`.
- z-30 stays (above content, below site header which is z-50, but Header.tsx hides on scroll so they don't collide — current behavior).

### §3.4 · Services (`SalonServices` + `SalonServicesSheet`)

- Section h2 "Services" → `font-display ...` per §3.
- Filter chip row: active `border-s-ink bg-s-ink text-white`, inactive `border-s-border bg-white text-s-ink-2 hover:border-s-ink hover:text-s-ink`. (Already on-spec.)
- Service row (mobile divider): name `font-body text-[15px] font-semibold text-s-ink`, description `text-[13px] text-s-ink-3 line-clamp-2`, duration `text-[12px] text-s-ink-3 + Clock icon 12px`, price `text-[14px] font-semibold text-s-ink`. Book button `outline pill border-s-ink bg-white px-5 py-2 text-[13px] font-semibold text-s-ink hover:bg-s-ink hover:text-white`. (Already on-spec.)
- Desktop variant: same content in a bordered `rounded-2xl border-s-border bg-white p-6` card. (Already on-spec.)
- "Alle ansehen" button opens `SalonServicesSheet` overlay.
- `SalonServicesSheet`:
  - Sheet h1 "Services" → `font-display text-[clamp(25px,4vw,40px)] font-extrabold` (Page H2 spec).
  - Active chip shadow `shadow-elevation-1` instead of tinted-emerald.
  - Selected service card shadow `shadow-elevation-2` instead of tinted-emerald.
  - Cart card shadow `shadow-elevation-3` (was multi-line arbitrary).
  - Stars `#FFC32B` (8 instances in this file).
  - Continue CTA shadow `shadow-elevation-2`.

### §3.5 · Team (`SalonTeam`)

- Section h2 → `font-display`.
- Avatar ring shadow `shadow-elevation-1` (replace tinted emerald).
- Floating rating badge: star `#FFC32B`, bg `bg-white shadow-elevation-1` (already close).
- Carousel: `-mx-4 mt-5 flex gap-5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory` (already on-spec).

### §3.6 · Reviews (`SalonReviews`)

- Section h2 "Bewertungen" → `font-display`.
- Summary row: 5 stars (filled `#FFC32B`, empty `#E7E5E4` `s-border`) + numeric rating `text-[18px] font-bold` + count in parens `text-[13px] text-s-ink-3`.
- Review card avatar palette: replace warm V2-D70 palette in `_shared.ts AVATAR_PALETTE` with 3-tone B&W neutrals:
  ```
  [
    { bg: "#F5F5F4", fg: "#0A0A0A" },  // sunken + ink
    { bg: "#E7E5E4", fg: "#0A0A0A" },  // border + ink
    { bg: "#0A0A0A", fg: "#FFFFFF" },  // ink + white
  ]
  ```
  (Or 4 if more variety needed: add `{ bg: "#6B6B6B", fg: "#FFFFFF" }`.)
  Hash function stays the same (`charCodeAt(0) % len`) — produces stable per-name color.
- Comment text `font-body text-[14px] leading-relaxed text-s-ink-2 line-clamp-3`. "Mehr lesen" toggle = `text-s-ink font-semibold hover:underline`.
- "Alle ansehen" expander → outline pill, same spec as Services.

### §3.7 · Buy (`SalonBuy`)

- Already clean. Standalone variant: `<Link>` wrapping a card `rounded-2xl border-s-border bg-white p-4` with Gift icon + title + subtitle + ChevronRight. Sidebar variant: same content, compact, w outline-pill "Kaufen" button right.

### §3.8 · About + map (`SalonAbout`)

- Section h2 "Über uns" → `font-display`.
- About paragraph: `font-body text-[14px] md:text-[15px] leading-relaxed text-s-ink-2 max-w-3xl`.
- Map placeholder: SVG grid stroke `#E7E5E4` (`s-border`) instead of `#A8B89A` (retired sage). Center pin `bg-s-ink text-white` rounded-full w rating text. Caption pill `bg-white/90 text-s-ink-3 text-[11px] font-semibold rounded-full px-3 py-1`.
- Address row: `MapPin` 14px + address `text-s-ink-2` + Wegbeschreibung link `text-s-ink font-semibold hover:underline`.

### §3.9 · Opening hours (`SalonOpeningTimes`)

- Section h2 "Öffnungszeiten" → `font-display`.
- Day list `space-y-2.5 text-[14px]`. Today's row `font-semibold text-s-ink`, others `text-s-ink-2`.
- Open/closed dot:
  - Option A (locked-out B&W): open = `bg-s-ink`, closed = `bg-s-border`.
  - Option B (current behavior with semantic signal): open = `bg-s-success`, closed = `bg-s-border`.
  - **Recommendation: B** — open is a positive signal worth a small green hit (matches the meta-row status text decision in §3.2).

### §3.10 · Additional info (`SalonAdditionalInfo`)

- Section h2 "Zusatzinformationen" → `font-display`.
- 12 amenity flags rendered as `flex items-start gap-3` rows: lucide icon (16px stroke 2) + label `text-[14px] text-s-ink`. (Already on-spec for chrome.)

### §3.11 · Mobile contact (`SalonContact`)

- Mobile-only (md:hidden). Title-block "Kontakt" h2 `font-body text-[18px] font-bold` (Section H2 is `font-display` but this is a small mobile-only sub-h2 — acceptable variant; or migrate). **Recommendation: migrate to `font-display`** for consistency.
- 3 rows: phone (tel:), website (target=_blank), Instagram (target=_blank). Each `flex items-center gap-3 text-[14px] text-s-ink hover:text-s-ink`. (Already on-spec for chrome.)

### §3.12 · Loyalty (`SalonLoyalty`)

- Section h2 "Treueprogramm" → `font-display`.
- 4 cards, each `<button>` `rounded-2xl border-s-border bg-white p-4 hover:shadow-elevation-2 transition-shadow duration-200 ease-glide` (replace arbitrary shadow w token). lucide icon (Diamond/Sparkles/Crown/UserPlus) `text-s-ink`. Title `text-[14px] font-semibold`, subtitle `text-[12px] text-s-ink-3`. ChevronRight rotates 90° on open.

### §3.13 · Other locations (`SalonOtherLocations`)

- Section h2 "Andere Standorte" → `font-display`.
- 1 sibling: full-width card. 2+: horizontal carousel `gap-4 snap-x mandatory`. Card: photo `aspect-[4/3] rounded-2xl` + name + star `#FFC32B` + rating + address + category eyebrow `text-[11px] uppercase tracking-[0.04em] text-s-ink-3`.

### §3.14 · Venues nearby (`SalonVenuesNearby`)

- Section h2 "In der Nähe" → `font-display`.
- Horizontal carousel of nearby salons (same category). 4-up skeleton while loading. Card photo `aspect-[4/3] rounded-xl`, name `text-[14px] font-semibold`, star `#FFC32B` + rating, category eyebrow.
- Desktop arrow buttons: `h-10 w-10 rounded-full border-s-border bg-white hover:bg-s-bg-sunken disabled:opacity-30`. (Already on-spec.)

### §3.15 · Marketing CTA (`SalonAppCta`)

- Section h2 "Verwöhne dich jederzeit, überall" → `font-display text-[clamp(20px,2.5vw,26px)] font-bold` (Section H2 with slight bump).
- Chip row: `rounded-full border-s-border bg-white px-4 py-2 text-[13px] font-medium text-s-ink-2 hover:border-s-ink hover:text-s-ink`. (Already on-spec.)
- Repeated Book CTA: `bg-s-ink px-7 py-3.5 text-[14px] font-semibold text-white shadow-elevation-2 hover:bg-black active:bg-black`. **Replace tinted shadow with `shadow-elevation-2`.**

### §3.16 · Mobile book bar (`SalonMobileBookBar`)

- Fixed bottom, `border-t border-s-border bg-white px-4 py-3` (drop `bg-white/95 backdrop-blur-md` — solid white is cleaner + perf-friendly).
- CTA full-width pill `bg-s-ink py-3.5 text-[15px] font-semibold text-white rounded-full hover:bg-black active:bg-black + ChevronRight 16px`. (Already on-spec.)

### §3.17 · Sticky sidebar (`SalonSidebar`)

- Outer card `rounded-2xl border-s-border bg-white p-5 md:p-6 shadow-elevation-3 transition-all duration-300 ease-glide`. (Replace arbitrary shadow.)
- Salon name `font-display text-[clamp(20px,1.5vw,22px)] font-bold` (Section H2 spec, since the sidebar acts like a card-level title).
- Star `#FFC32B` 13px + bold rating + count in parens.
- Featured pill: `bg-s-accent/15 text-s-accent` (royal blue).
- Primary CTA "Termin buchen": `bg-s-ink py-3.5 text-[15px] font-semibold text-white rounded-full + shadow-elevation-2 hover:bg-black active:bg-black + ChevronRight 15px`.
- Status row (tappable to expand hours): `text-s-success` if open / `text-s-ink-2` if closed (recommend Option B in §3.9). Chevron rotates on expand.
- Hours table: `rounded-lg bg-s-bg-sunken/50 px-3 py-2.5` mini-card. Today row bold.
- Address w directions link. Phone/website/Instagram (sidebar contact rows). Gift Cards via `<SalonBuy variant="sidebar">`.

---

## §4 · New components needed

**Three.** All currently inlined or partially repeated across existing files.

### §4.1 · `StatusPill`

**Purpose:** Render salon open/closed state. Currently lives inline in `SalonHeader` and `SalonSidebar` with inconsistent classes (one uses `text-emerald-600`, the other uses `text-emerald-600` too but the dot color in `SalonOpeningTimes` uses `bg-emerald-500`). Need a single source.

**File:** `app/[locale]/_components/salon/StatusPill.tsx` (colocated, salon-scoped).
**Doc:** `_design-system/components/StatusPill.md`.

**Public API:**
```ts
export interface StatusPillProps {
  isOpen: boolean;
  label: string;  // e.g. "Geöffnet bis 19:30", "Geschlossen · Öffnet 10:00"
  size?: "sm" | "md";  // sm = inline (in meta rows), md = block (in sidebar)
  showDot?: boolean;  // default true; some surfaces want text-only
}
```

**Visual signature:**
- Inline (sm): `inline-flex items-center gap-1.5 text-[13px] font-semibold`. Dot `h-2 w-2 rounded-full bg-s-success` (open) / `bg-s-border` (closed). Text `text-s-success` (open) / `text-s-ink-2` (closed).
- Block (md): same content, larger paddings.

**Motion:** None — informational.

**Tokens:** `s-success`, `s-border`, `s-ink-2`. No retired colors.

### §4.2 · `MetaDot`

**Purpose:** The bullet `·` separator used between meta-row segments in `SalonHeader`, `SalonReviews`, `SalonAppCta`. Currently inlined as `<span className="text-s-ink-3" aria-hidden>·</span>` 12+ times. One source.

**File:** Same `salon/StatusPill.tsx` file OR `salon/MetaDot.tsx` colocated. **Recommendation: inline-export from `_shared.ts`** since it's 1 line + zero logic.

**Public API:**
```ts
export function MetaDot() {
  return <span className="text-s-ink-3" aria-hidden>·</span>;
}
```

No doc needed (too small) — references SOURCE.md §3 inline emphasis rules.

### §4.3 · `TabPill` (already inline in SalonServices + SalonServicesSheet)

**Purpose:** Active/inactive segmented filter pill. Repeated as a `<button>` shape with the same `border-s-ink bg-s-ink text-white` / `border-s-border bg-white text-s-ink-2` cva-style ternary in 3 files (`SalonServices.tsx`, `SalonServicesSheet.tsx`, plus future booking-flow chips).

**File:** Either `app/[locale]/_components/primitives/TabPill.tsx` (if reused beyond salon) or `salon/TabPill.tsx` (if scoped). **Recommendation: `primitives/TabPill.tsx`** — it's a generic UI primitive, will appear on search/filter pages too.

**Doc:** `_design-system/components/TabPill.md` (write in same turn per CLAUDE.md rule).

**Public API:**
```ts
export interface TabPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";  // sm = 13px height-2 inline, md = 14px height-2.5 sticky
  variant?: "outline" | "ghost";  // outline = w border; ghost = bare background (for sticky-bar variants)
}
```

**Visual signature:**
- Outline-active: `border-s-ink bg-s-ink text-white shadow-elevation-1`.
- Outline-inactive: `border-s-border bg-white text-s-ink-2 hover:border-s-ink hover:text-s-ink`.
- Ghost-active: `bg-s-ink text-white` (no border).
- Ghost-inactive: `text-s-ink-3 hover:text-s-ink`.
- All use `rounded-full font-body font-semibold transition-colors duration-200 ease-glide` base.

**Motion:** Hover color transition 200ms; active state instant.

---

## §5 · Sequence of mechanical edits

This is the implementation order. Each edit is surgical (per CLAUDE.md `🚨 Surgical edits only`). NO whole-file rewrites except the page.tsx swap.

### Phase A — V3-implementation drift detox (no behavior change, no new components)

Order: bottom-up by component complexity, so the simple pieces are right before they're composed by orchestrator.

| # | File | Edit | Why |
|---|---|---|---|
| A1 | `app/[locale]/_components/salon/_shared.ts` | Replace `AVATAR_PALETTE` (L175-184) with 3-4-tone B&W palette. Migrate `TAB_SECTIONS` labels from English to German (or wire to `useTranslations` keys). | Touch one source; review-card avatars and tab labels both flow through. |
| A2 | `SalonHero.tsx` | L57: `text-s-ink-3/30` → `text-s-ink-disabled`. L119 photo-count pill: drop `backdrop-blur-md`, change `bg-white/95` → `bg-s-ink/85 text-white`. L145 desktop hero outer `rounded-3xl` → `rounded-card-lg`. | Mobile perf + scale + token. |
| A3 | `SalonHeader.tsx` | L42 h1: `font-body text-[24px] ... lg:text-[44px]` → `font-display text-[clamp(28px,4.5vw,44px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-s-ink`. L49 star fill `#F3A864` → `#FFC32B`. L58-63 status: replace inline `text-emerald-600` / `text-amber-700` w `<StatusPill isOpen={status.isOpen} label={status.label} size="sm" />` (after A4 lands). L83 Featured pill: stays. L88 last-minute pill: `bg-amber-100 text-amber-900` → `bg-[#FFF1E6] text-[#9A3412] border border-[rgba(154,52,18,0.22)]`. | H1 typography + star token + Flame badge. |
| A4 | New: `app/[locale]/_components/salon/StatusPill.tsx` | Create. Export the pill described in §4.1. | Single-source open/closed pill. |
| A4-doc | New: `_design-system/components/StatusPill.md` | Write doc per CLAUDE.md "no new shared components without docs" rule. | Doc-debt enforcement. |
| A5 | `SalonStickyTabNav.tsx` | No code change — labels come from `_shared.ts` (fixed in A1). | German labels. |
| A6 | `SalonServices.tsx` | L200 SectionHeader: `font-body text-[18px] font-bold` → `font-display text-[clamp(18px,2vw,23px)] font-bold tracking-[-0.03em]`. L93 chip row: extract to `<TabPill>` (after A7). | h2 + chip primitive. |
| A7 | New: `app/[locale]/_components/primitives/TabPill.tsx` | Create. Export the primitive described in §4.3. | Reusable chip. |
| A7-doc | New: `_design-system/components/TabPill.md` | Write doc. | Doc-debt. |
| A8 | `SalonTeam.tsx` | L36 h2: `font-body text-[18px]` → `font-display text-[clamp(18px,2vw,23px)] font-bold tracking-[-0.03em]`. L76 ring shadow: `shadow-[0_4px_12px_rgba(31,92,66,0.10)]` → `shadow-elevation-1`. L99 star fill `#F3A864` → `#FFC32B`. | h2 + shadow + star. |
| A9 | `SalonReviews.tsx` | L42 h2: same swap. L53 / L140 star fill `#F3A864` → `#FFC32B`. Empty-star `#E8DFD2` → `#E7E5E4`. Avatar palette pulled from updated `_shared.ts` (already done in A1). | h2 + star + empty-star + palette. |
| A10 | `SalonPortfolio.tsx` | L37 h2: same swap. L77 overlay `font-display ... font-black` → `font-display ... font-extrabold`. | h2 + weight. |
| A11 | `SalonBuy.tsx` | Update L20 docblock "neutral cream" → "bg-white" + add V3-D193 provenance note. (No visual change — just doc cleanup.) | Provenance accuracy. |
| A12 | `SalonAbout.tsx` | L39 h2: same swap. L98 SVG grid stroke `#A8B89A` → `#E7E5E4`. | h2 + sage. |
| A13 | `SalonOpeningTimes.tsx` | L27 h2: same swap. L47 open/closed dot: keep semantic — `bg-emerald-500` → `bg-s-success` (token-aware). | h2 + token. |
| A14 | `SalonAdditionalInfo.tsx` | L69 h2: same swap. | h2 only. |
| A15 | `SalonContact.tsx` | L26 h2: same swap (or accept as mobile-only sub-h2 — see §3.11 recommendation, prefer swap). | h2. |
| A16 | `SalonLoyalty.tsx` | L57 h2: same swap. L71 button hover shadow `shadow-[0_2px_12px_rgba(0,0,0,0.04)]` → `hover:shadow-elevation-2`. | h2 + shadow. |
| A17 | `SalonOtherLocations.tsx` | L32 h2: same swap. L82 star fill `#F3A864` → `#FFC32B`. | h2 + star. |
| A18 | `SalonVenuesNearby.tsx` | L86 + L103 h2: same swap. L155 star fill `#F3A864` → `#FFC32B`. | h2 + star. |
| A19 | `SalonSidebar.tsx` | L78 outer shadow → `shadow-elevation-3`. L90 salon-name: `font-display text-[clamp(20px,1.5vw,22px)] font-bold tracking-[-0.03em]`. L96 star fill `#F3A864` → `#FFC32B`. L117 CTA shadow → `shadow-elevation-2`. L144 status: replace inline `text-emerald-600` / `text-amber-700` w `<StatusPill ... size="md" showDot={false} />`. | h2 + star + shadow + status. |
| A20 | `SalonMobileBookBar.tsx` | L28: drop `bg-white/95 backdrop-blur-md` → `bg-white`. | Perf. |
| A21 | `SalonServicesSheet.tsx` | L226 sheet h1: `font-body text-[28px] md:text-[40px]` → `font-display text-[clamp(25px,4vw,40px)] font-extrabold tracking-[-0.03em]`. L243 active chip shadow → `shadow-elevation-1`. L265 cat h2 (inside sheet): `font-body text-[22px] md:text-[26px]` → `font-display text-[clamp(20px,2.5vw,26px)] font-bold tracking-[-0.03em]`. L277 selected card shadow → `shadow-elevation-2`. L396 cart card shadow → `shadow-elevation-3`. L429 star fills × 2 → `#FFC32B`. Empty-star `#E8DFD2` → `#E7E5E4`. L505 Continue CTA shadow → `shadow-elevation-2`. Filter pills: migrate to `<TabPill>`. | Full sheet detox. |
| A22 | `SalonAppCta.tsx` | L46 h2: `font-body text-[20px] md:text-[26px]` → `font-display text-[clamp(20px,2.5vw,26px)] font-bold tracking-[-0.03em]`. L65 CTA shadow `shadow-[0_4px_16px_rgba(31,92,66,0.20)]` → `shadow-elevation-2`. | h2 + shadow. |
| A23 | `SalonDetailV3.tsx` | **DELETE L145-162** — the entire ambient gradient washes block (8 absolute `<div>`s in retired warm/sage colors). | Substrate is pure white per V3-D193 atmosphere-revert. |
| A24 | `SalonDetailV3.tsx` | L289 `LoadingSkeleton`: replace `animate-pulse bg-s-bg-sunken` w skeleton-shimmer keyframe per `LoadingStates.md` Pattern 1. | Loading polish. |
| A25 | `SalonDetailV3.tsx` | L31-50 provenance docblock: update for V3-D193 (drop Peace Sans, drop emerald, document the V3 swap). | Provenance hygiene. |

### Phase B — Wire V3 into the route (single edit)

| # | File | Edit | Why |
|---|---|---|---|
| B1 | `app/[locale]/salon/[slug]/page.tsx` | **Replace entire 811-line body** with: `"use client"; import { SalonDetailV3 } from "@/app/[locale]/_components/salon/SalonDetailV3"; export default function Page() { return <SalonDetailV3 />; }` | Live route now renders the V3 implementation. |
| B2 | `app/[locale]/_components/salon/SalonDetailV3.tsx` | Add `<JsonLd>` rendering (currently lives in legacy page). The orchestrator does NOT render JSON-LD today — `generateSalonSchema` exists in `lib/seo.ts`, import + render via `<script type="application/ld+json">` at top of the component. | SEO parity preserved. |
| B3 | `app/[locale]/_components/salon/SalonDetailV3.tsx` | Add the `posthog.capture("salon_profile_viewed")` + `/api/analytics/track-view` POST + `trackSalonView()` localStorage push (all currently in legacy page L303-318). | Analytics parity preserved. |

### Phase C — Allowlist the rebuilt route (drift-checker hardening)

| # | File | Edit | Why |
|---|---|---|---|
| C1 | `_design-system/_rebuilt_routes.json` | Add to `strict_globs`:<br>`"app/[locale]/salon/[slug]/page.tsx"`<br>`"app/[locale]/_components/salon/*.tsx"`<br>`"app/[locale]/_components/salon/_shared.ts"` | Drift-checker treats salon-detail as strict; legacy `components-legacy/salon/*` stays informational. |

### Phase D — Legacy purge (cleanup, deferrable)

| # | File | Edit | Why |
|---|---|---|---|
| D1 | `components-legacy/salon/*` (12 files) | Mark for deletion. Move to `components-legacy/_archive/` OR delete outright in a follow-up cleanup PR. **Defer to a separate task** — out of this rebuild's scope. | Removes the temptation to revert; keeps grep results clean. Risk: any other route still importing from `/components-legacy/salon/*` will break. (Audit before deletion.) |
| D2 | `tailwind.config.js` retired-token cleanup | Per Q3 / Q15 — soft delete when usage drops to zero. After Phase A lands, run drift-checker; remaining usage indicates legacy callsites we missed. **Defer.** | Coordinated with site-wide retired-token sweep. |

---

## §6 · Verification plan (round 1 + round 2)

Per CLAUDE.md rule 9 verifier-loop. Page-level rebuild = 2 rounds budgeted.

### Round 1 — Code-level

After Phase A + B + C lands. Spawn `design-verifier` agent w spec:
- Project root: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7`
- Stack: Next.js 15 App Router + Supabase + Tailwind + Hanken Grotesk + Inter Tight
- Dev-server URL + test entity: `http://localhost:3000/de/salon/{seed-slug}` (any existing seed salon)
- SPEC VERBATIM: this file's §3 per-section spec
- Known intentional deviations: status uses `text-s-success` (not `text-s-ink` per pure B&W) — flagged as Option B locked-in §3.2/§3.9. Open/closed dot color same. Avatar palette is 3-tone B&W (no warm colors).
- Files to inspect (exhaustive): all 17 in `app/[locale]/_components/salon/` + the new `StatusPill.tsx` + the new `primitives/TabPill.tsx` + the rewritten `page.tsx`
- Output: PASS or per-item punch list w `file:line` proof. Read-only.

### Round 2 — Visual

After round 1 punch-list fixes land. Playwright capture at 375 / 768 / 1440 widths against a seed salon. Compare to Fresha reference at `public/_pixel-refs/fresha/salon-detail/fresha-mobile-full-375.png` + the 10 Mobbin screens. Spawn verifier with screenshots embedded.

PASS condition: zero OFF/MISSING items on §3 spec. Documented Option-B status colors do not count as drift.

---

## §7 · Risks / open questions

| ID | Item | Why it's open | Recommendation |
|---|---|---|---|
| R1 | **Open/closed status color** | §3.9 Option A (pure B&W) vs Option B (semantic green hit). Locks the system's tone — pure B&W reads austere, green-hit reads alive. | **Option B** — `text-s-success` is off-budget signal, not chrome. Matches the Q19 framing (signals like star yellow are exceptions, status green can be too). Raise as **Q22 in QUESTIONS.md** to formalize. |
| R2 | **Avatar palette** for review cards | Current `AVATAR_PALETTE` is V2-D70 warm tones. Migrate to 3-4 B&W neutrals OR keep colored (initials are content-like, vibrancy makes the reviews grid scan)? | **B&W neutrals.** Per Q19 logic — initials are chrome (system-generated), not user content. 3 tones is enough variety w/o color noise. |
| R3 | **TabPill location** | `primitives/` (reusable everywhere) vs `salon/` (scoped). | **`primitives/`** — search, category, booking-flow chips will all want this primitive. |
| R4 | **Legacy `/components-legacy/salon/*` deletion** | `page.tsx` is the only known importer. But other routes might import too. | Audit before deleting in a follow-up PR. `grep -rn "components-legacy/salon" app/` first. |
| R5 | **Drift-checker strict-mode noise** | After C1, drift-checker will flag every new finding in `app/[locale]/_components/salon/*` as strict. Phase A may have missed something. | Run drift-checker after Phase A + B locally. Fix any new strict findings before merging. |
| R6 | **JSON-LD + analytics parity** | Phase B2 + B3 migrates these from legacy `page.tsx`. Risk: missed a side-effect. | Diff the original `page.tsx` useEffect blocks against `SalonDetailV3` after migration. Particularly: PostHog `capture()` + the analytics fetch POST + the trackSalonView localStorage push. |
| R7 | **`is_featured` / `last_minute_discount_percent` data presence** | Legacy `page.tsx` doesn't render either field; V3 `SalonHeader` does (L80-92). If seed data has these flags, they'll appear post-swap. | Acceptable — they're real data. If the visual feels too busy on heavy-pill salons, raise as Q23. |
| R8 | **Map placeholder vs real map** | V3 implementation has `MapPlaceholder` (SVG grid + center pin). Legacy has live Mapbox static image with retired pin color. After Phase B the live map disappears. | Acceptable for now — the map is a deferred feature ("Karte folgt"). When `NEXT_PUBLIC_MAPBOX_TOKEN` ships in production, swap in Mapbox per `SalonAbout` spec (B&W chrome: `pin-s+0A0A0A` ink, no terracotta). |
| R9 | **Stylist-availability per-staff calendar view** | Mobbin curated set didn't have one. We didn't capture from Fresha live for this. | Defer — it's a deeper booking-flow page, OUT of this rebuild's scope. When the booking-flow rebuild lands, capture Fresha live then. |
| R10 | **`SalonAppCta` chip routing** | `/${locale}/${city.toLowerCase()}` and `/${locale}/${city.toLowerCase()}/${quartier.toLowerCase()}` routes may not exist yet. | Phase A doesn't touch routing — but each `<Link>` w no destination is §11 drift. **Recommend audit + add destinations** OR change to `/search?city=X` (safe fallback) in a polish pass. |

---

## §8 · Estimated effort

| Phase | Hours | Notes |
|---|---|---|
| A (drift detox: 23 sub-edits + 2 new primitives + 2 docs) | ~3-4h | Surgical, no logic risk. New components are small (~50-80 LoC each). |
| B (route swap + JSON-LD + analytics migration) | ~1h | Mechanical move. JSON-LD is `<script>` blob; analytics are 3 useEffect blocks. |
| C (allowlist) | ~5min | 3-line JSON edit. |
| D (legacy purge) | DEFERRED | Separate cleanup PR. Includes audit + delete of `/components-legacy/salon/*`. |
| Verification rounds (1 + 2) | ~1h | Spawn verifier, fix punch list, re-spawn. |
| **Total in scope** | **~5-6h wall-clock** | Excludes the deferred D phase. |

---

*End of rebuild spec. Last updated 2026-05-26. Authored against SOURCE.md V3-D193 + QUESTIONS.md Q1-Q21 resolved + 10 Mobbin Fresha references + 1 live Fresha capture at 375px.*
