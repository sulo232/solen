<!-- exists-check: net-new vs docs/audit/fresha-airbnb-solen-audit-part3.md (a Fresha-vs-Airbnb
     FEATURE-PARITY checklist for the HOMEPAGE and discovery sections, points 181-300, no
     booking-flow or staff-step coverage) and _design-system/components/Step.md (the /business
     marketing "how it works" numeral card, unrelated to booking wizard steps). Both read before
     writing. No prior Mobbin screen corpus exists for any booking step: _design-system/sections/
     held only salon-detail/ at the time of writing. `npm run exists` surfaces StaffStep.tsx as the
     IMPLEMENTATION this file researches, which is the intended relationship, not a duplicate. -->

# Booking step: staff / provider selection (corpus research)

**Archetype:** the step in a booking flow where the user chooses WHO performs the service.
**Solen component:** `components-legacy/booking/StaffStep.tsx` (236 lines) · siblings `ServicesStaffStep.tsx`, `StaffProfileSheet.tsx`
**Solen route:** `app/[locale]/salon/[slug]/booking/page.tsx` → `BookingWizard` step `staff`
**Layer:** 2 (flow step) composed of Layer 3 primitives (`Avatar`, `CheckBadge`, `butterPress`, `useStaggerVariants`)
**Researched:** 2026-07-29 · corpus agent `corpus:booking-staff` · `_plans/SCREEN_RESEARCH.md` item A5

---

## Sample

**14 Mobbin queries** (13 `search_screens`, 1 `search_flows`), split across `platform: "ios"` and
`platform: "web"`, each returning real screenshots that were examined as images.

Of everything returned, **47 screens across 22 apps** are on-archetype or directly adjacent to it
(35 iOS, 12 web). Within that, **23 are distinct staff-choice surfaces across 18 apps**, and every
frequency below is counted over those 23 unless stated otherwise.

The 18 apps: Fresha, Careem, Alan, Plazo, Bloom, Zocdoc, Headspace, Future Pro, Open, Ladder,
Centr, Fitbit, TIDE, Ten Percent Happier, Airbnb, Preply, Care.com, Skillshare.

**Named apps I could NOT find in the corpus:** Booksy, Treatwell, Vagaro, StyleSeat, Squire,
Mindbody. Queries naming them returned other apps instead. I did not verify these apps' staff
steps and this document makes no claim about them. Fresha is therefore the only pure
beauty-vertical booking tool in the sample, which is a real limit on how much "the industry does
X" this file can support.

**Honesty notes on measurement:** every px value attributed to a Mobbin screen below is **read off
the screenshot by eye, not measured** with PIL or `getBoundingClientRect`. They are labelled
`est.`. Solen's own values are read from source and are exact. **Motion cannot be observed from
still screenshots**; the motion section separates the two paired-state captures I actually have
from inference, and says which is which.

---

## Dominant anatomy

Top to bottom, the shape that recurs. Frequency = how many of the 23 surfaces carry that band.

```
[ ‹ back            (title)            ✕ ]     nav row, back + dismiss      18/23
  Select professional                          screen title, left-aligned   14/23
  (breadcrumb: Services › Professional › …)    step context, web only        4/12 web
  [ filter chips / tabs ]                      optional narrowing            6/23
  ┌──────────────┐ ┌──────────────┐
  │   ⧉ glyph    │ │   (avatar)   │            "any / auto" FIRST           4/4 where present
  │ Any team …   │ │   Name       │            name                        23/23
  │ Max avail.   │ │   Role/desc  │            second line under name      19/23
  └──────────────┘ └──────────────┘
  … more people …
[ sticky: total · Continue ]                   explicit confirm CTA          6/23
```

**The five findings that hold up:**

1. **The screen title is the anchor, never a person's name.** In all 14 titled surfaces the title
   is the largest text on screen and the cards stay quiet. The two exceptions in the corpus are
   not pickers: Airbnb's [Meet your host](https://mobbin.com/screens/d71700a0-2e5e-4274-9d02-75b399408802)
   card is a profile, and [Future Pro's RECOMMENDED COACHES](https://mobbin.com/screens/50e21fab-5c26-4e05-a830-f99c0d1c6212)
   is a marketing pitch with one coach per slide.

2. **When an "any / no preference" option exists, it is always first and always a glyph.** 4 of 4.
   [Fresha iOS](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122) ("Any team member /
   Maximum availability", two-person outline glyph, top-left of a 2-col grid),
   [Fresha web](https://mobbin.com/screens/d0b3a99b-2e01-4f12-b796-cda8596736c7) ("Any professional /
   for maximum availability", same glyph, top-left of a 3-col grid, and **pre-selected on arrival**),
   [Careem](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) ("Auto assign / We'll
   assign the best professional", sparkle glyph, leftmost card, **pre-selected**, teal ring),
   [Centr](https://mobbin.com/screens/bee8ba17-a7a8-44f9-88cf-f955d076ede7) ("All", leftmost avatar
   with a green check). Never a photo, never mid-list, never last.

3. **Per-staff ratings are the exception, not the rule.** Only 4 of 23 surfaces show a rating, plus
   one partial. This is the number I most expected to be wrong and it was not. Fresha iOS renders
   `5.0 ★` on **Emily only**; Anna and Tiffany carry no rating on the same screen, so it renders
   per-person when data exists and is silently omitted otherwise. Fresha web shows **no**
   professional rating at all (the `5.0 ★★★★★ (2)` in the right rail is the salon's). The four
   that do: [Careem](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) (`★ 4.8`,
   placed ABOVE the name), [Zocdoc](https://mobbin.com/screens/88323fcb-190e-4ca7-8147-59ad08394221)
   (`★ 4.67 · 709 reviews`), [Airbnb co-hosts](https://mobbin.com/screens/f14b5359-aca7-43b3-8a95-3f6854076c0e)
   (`★ 4.91 guest rating` inside a 3-stat row), [Care.com](https://mobbin.com/screens/45dd673c-8a9f-4874-bda2-85f98b5a229b)
   (five orange stars + count).

4. **Name-only is legal only when the control is a FILTER.** All 4 surfaces showing a bare name
   under an avatar are filter rails, not booking commitments:
   [Future Pro CHANGE COACH](https://mobbin.com/screens/73eae9f9-18d3-47d6-be50-50c03c1d5142),
   [Open's teacher filter](https://mobbin.com/screens/9e91d33f-702e-4d96-bf7f-be78bf019ad5),
   [Centr](https://mobbin.com/screens/bee8ba17-a7a8-44f9-88cf-f955d076ede7),
   [Ten Percent Happier](https://mobbin.com/screens/82c96124-a92c-4866-a8b8-8dfe9ec2ed06). Every
   surface where the tap COMMITS you to a person carries a second identifying line (19/23).

5. **The choice is echoed downstream, not forgotten.** Fresha pins the chosen professional as a
   full row at the top of the next step
   ([Select services with Anna pinned](https://mobbin.com/screens/0bb10804-5a32-4526-866a-5a548fb3e9ae):
   avatar + name + role + chevron), then shrinks it to a dropdown chip on the time step
   ([`EL Emily ▾`](https://mobbin.com/screens/fb91848d-b343-447d-a948-eed9397f037d)). On web the
   right-rail line changes from `10 mins with any professional` to
   [`10 mins with Denise`](https://mobbin.com/screens/325d386d-25e9-4eb0-a7a2-d0c09569f0a2), Denise
   rendered as a link. Alan and Zocdoc both lead their confirm screens with the provider card.

**The sharpest split in the corpus:** health apps front-load availability on the choice screen
(4 of 4: [Alan](https://mobbin.com/screens/02c485ac-64fd-48f1-a11c-6d099c0bcf85) "Available on
Thursday" vs a grey "No availability"; [Plazo](https://mobbin.com/screens/5ab1ce07-b8cf-4a4f-9761-817a2799ec0f)
a per-person next-slot line plus a green/red status dot;
[Zocdoc](https://mobbin.com/screens/febf2279-5b8c-4bed-a7e8-0b286bfb13e5) a per-provider date strip
with yellow `3 appts` columns and grey `No appts` columns;
[Headspace web](https://mobbin.com/screens/df49bfbd-7da0-4a5d-962f-580f39e4d1e9) "4 clinicians
available" under each time band). Beauty apps defer it entirely to the time step (0 of 2).

**No app in the corpus showed a per-person PRICE on the staff step.** Fresha web echoes one price
in the rail and it is **identical** across the any-professional and the Denise states
(`Lips US$10 / Total $10` in both). Preply, Skillshare, Care.com and Fiverr do show per-person
prices, but those are marketplace listings where you are choosing a seller, not a staff step inside
one venue's flow. If Solen ever wants per-stylist pricing, this corpus offers neither a precedent
nor an anti-precedent.

---

## Pattern table

| # | Pattern | Frequency | Evidence | Verdict for Solen |
|---|---|---|---|---|
| 1 | "Any / no preference" pinned FIRST, glyph not portrait | 4 of 4 where it exists; 3 of 3 beauty-booking surfaces | [Fresha iOS](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122) · [Fresha web](https://mobbin.com/screens/d0b3a99b-2e01-4f12-b796-cda8596736c7) · [Careem](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) · [Centr](https://mobbin.com/screens/bee8ba17-a7a8-44f9-88cf-f955d076ede7) | **Already adopted, keep.** `StaffStep.tsx:104-124` pins "Egal" first with a Lucide `Users` glyph in a 56px white circle. Exact match, no change. |
| 2 | "Any" is PRE-SELECTED on arrival | 2 of 4 (Fresha web ring on `Any professional`; Careem teal ring on `Auto assign`) | [Fresha web](https://mobbin.com/screens/d0b3a99b-2e01-4f12-b796-cda8596736c7) · [Careem](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) | **Already adopted, keep.** `selectedStaffId` defaults to `'any'` in `lib/booking-context.tsx`. Matches the defaults-as-recommendation law and means Continue is never disabled on arrival. |
| 3 | Screen title is the display anchor; cards stay quiet | 14 of 14 titled surfaces | [Fresha iOS](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122) (title est. 28-30px vs card name est. 15px) | **Adopt, and verify Solen has it.** `StaffStep.tsx` renders **no title of its own**, it starts at the `<ul>`, so the title must come from `BookingWizard`. FLOORS LAW 6 wants one ≥28px anchor per customer screen. Confirm on the rendered page, do not assume. |
| 4 | Full-width ROWS rather than a 2-col grid | rows 8 of 23 · 2-col grid 4 · 3-col 1 · horizontal rail 6 | rows: [Alan](https://mobbin.com/screens/02c485ac-64fd-48f1-a11c-6d099c0bcf85) · [Plazo](https://mobbin.com/screens/5ab1ce07-b8cf-4a4f-9761-817a2799ec0f) · [Zocdoc](https://mobbin.com/screens/88323fcb-190e-4ca7-8147-59ad08394221) · [Headspace](https://mobbin.com/screens/6d26d0ea-2cf7-4bf0-b1cf-51e45442bd08) · [Preply](https://mobbin.com/screens/594bdecb-90a8-4e8d-9952-7d9cf4cd5fac) · [Care.com](https://mobbin.com/screens/45dd673c-8a9f-4874-bda2-85f98b5a229b) | **Keep Solen's rows. Explicitly REJECT Fresha's grid**, and log it as a deliberate DUAL-AXIS exception: STRUCTURE normally = Fresha, but Fresha's tile fits only name + role. Solen's row carries languages + rating + review count + a profile link. Every corpus surface needing more than name+role also chose rows. Owner already decided this 2026-07-09 (Direction B). |
| 5 | Second identifying line under the name | 19 of 23; name-only survives only on filter rails (4 of 4) | role: [Fresha](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122) "Nail Tech" · [Zocdoc](https://mobbin.com/screens/88323fcb-190e-4ca7-8147-59ad08394221) "Dermatologist" · descriptor: [Bloom](https://mobbin.com/screens/f7e8ee82-734b-4bcc-93ab-f9ab193a2d6a) "Direct & Empowering" | **Adopt as a floor.** Solen uses UPPERCASE languages (`DE / EN`), reinstated by the owner 2026-07-24 against Fresha ref IMG_6696. Legal and evidenced. **But** it renders only `if (languages)`, so a null value drops the row to name-only, which the corpus says is legal for filters and not for commits. Needs a non-null fallback. |
| 6 | Per-staff rating with review count | 4 of 23 full, 1 partial | [Careem](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) · [Zocdoc](https://mobbin.com/screens/88323fcb-190e-4ca7-8147-59ad08394221) · [Airbnb](https://mobbin.com/screens/f14b5359-aca7-43b3-8a95-3f6854076c0e) · [Care.com](https://mobbin.com/screens/45dd673c-8a9f-4874-bda2-85f98b5a229b) | **Already adopted, keep, and keep it conditional.** `StaffStep.tsx:141-146` renders the star row only when `rating != null && reviewCount > 0`. Fresha does exactly the same (Emily 5.0, Anna and Tiffany nothing). Per-person omission on null data is the corpus norm, not a gap. |
| 7 | Explicit selected state on the same screen | 5 of 23; of those: colored ring 3, ink border 1, check badge 1 | ring: [Fresha web purple](https://mobbin.com/screens/325d386d-25e9-4eb0-a7a2-d0c09569f0a2) · [Careem teal](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) · ink border: [Bloom selected](https://mobbin.com/screens/7b1531dd-6257-41e2-80a0-256b7007c93d) · check: [Centr](https://mobbin.com/screens/bee8ba17-a7a8-44f9-88cf-f955d076ede7) | **Adapt, do not copy.** The corpus majority is a brand-colored ring, which collides head-on with Solen's locked selected state (gray `#F4F4F5` + ink + semibold, never a ring; `no-focus-ring-gate` refuses halos). Solen's ink check badge (`StaffStep.tsx:230-236`) is the Centr treatment and is the only corpus option compatible with the lock. Keep it. |
| 8 | Explicit Continue CTA vs tap-to-advance | tap-to-advance 16 of 23; explicit CTA 6 | CTA: [Fresha web](https://mobbin.com/screens/d0b3a99b-2e01-4f12-b796-cda8596736c7) · [Careem](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) · [Bloom](https://mobbin.com/screens/f7e8ee82-734b-4bcc-93ab-f9ab193a2d6a) · tap-to-advance: [Fresha iOS](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122) | **Keep Solen's CTA, reject the tap-to-advance majority.** Solen's sticky bar carries the running total and item count, which tap-to-advance cannot host, and it satisfies the sticky-CTA contract row (hierarchy-density-06). Fresha iOS can advance on tap precisely because it has no running total to show. |
| 9 | Chosen person echoed on later steps | 4 apps (Fresha both platforms, Alan, Zocdoc) | [Fresha pinned row](https://mobbin.com/screens/0bb10804-5a32-4526-866a-5a548fb3e9ae) · [Fresha chip](https://mobbin.com/screens/fb91848d-b343-447d-a948-eed9397f037d) · [Fresha web rail](https://mobbin.com/screens/325d386d-25e9-4eb0-a7a2-d0c09569f0a2) | **Adopt if absent.** Not verified in Solen's `DateTimeStep.tsx` in this pass. The cheapest version is Fresha's chip, and it doubles as the change-your-mind affordance. |
| 10 | Availability shown per person on the choice screen | 5 of 23 overall; 4 of 4 health apps; **0 of 2 beauty apps** | [Alan](https://mobbin.com/screens/02c485ac-64fd-48f1-a11c-6d099c0bcf85) · [Plazo](https://mobbin.com/screens/5ab1ce07-b8cf-4a4f-9761-817a2799ec0f) · [Zocdoc](https://mobbin.com/screens/febf2279-5b8c-4bed-a7e8-0b286bfb13e5) · [Headspace](https://mobbin.com/screens/df49bfbd-7da0-4a5d-962f-580f39e4d1e9) | **Reject for now, on the existing reasoning.** `StaffStep.tsx`'s own comment already refuses a "soonest slot" line because there is no live per-staff next-availability endpoint and inventing one is fabricated data. That call is correct and stands. It is also exactly why pattern 11 matters. |
| 11 | Escape hatch when the chosen person has nothing free | Fresha web offers THREE: next available date, all professionals, waitlist | [Fresha web "Denise is fully booked on this date"](https://mobbin.com/screens/2d59480f-6238-48cd-a235-a03d498894f4) | **ADOPT. Highest-value gap in this corpus.** Solen `DateTimeStep.tsx:233-249` offers **only** the waitlist. The missing "Check all professionals" is the one that undoes the staff choice, which pattern 10's deliberate omission makes necessary: the user commits blind, so un-committing must be cheap. Needs no new data source, availability is already known at that step. |
| 12 | Per-staff PRICE on the choice screen | 0 of 23 | Fresha web rail total is unchanged between the any-professional and Denise states | **Reject.** No precedent in the corpus. If Solen ever wants per-stylist pricing it is a net-new invention that must be mocked and approved on its own, never smuggled in as "industry standard". |
| 13 | Filter or tab narrowing above the list | 6 of 23 | [Alan Specialty + English dropdowns](https://mobbin.com/screens/02c485ac-64fd-48f1-a11c-6d099c0bcf85) and its [filter sheet](https://mobbin.com/screens/778f0462-d2f1-4eef-a9f1-75097d952e95) · [Alan Medical team tabs](https://mobbin.com/screens/bfecd3f1-4509-418e-8ac6-d0aa78bbd7ec) | **Reject at current scale.** Filters appear where the list is long (Alan 7+, Zocdoc 265 providers). A Swiss salon's bookable team is small. Revisit only if the rich-data ceiling (hierarchy-density-03) is ever reached here. Solen already narrows invisibly and better: `StaffStep.tsx:79-86` keeps only staff who can perform EVERY selected service. |
| 14 | Avatar is a circle | 15 of 22 that show an avatar | circles: Fresha, Careem, Alan, Plazo, Zocdoc, Headspace, Future Pro, Open, Centr, TIDE, Airbnb · full-bleed portrait: [Bloom](https://mobbin.com/screens/f7e8ee82-734b-4bcc-93ab-f9ab193a2d6a), [Ladder](https://mobbin.com/screens/e1e3ba47-289b-4c55-837c-12d2f700d008) | **Already adopted, keep.** `<Avatar size={56}>`. Ties to FLOORS LAW 8: the same person must render through the same component here and in `SalonTeam` (88px there). A documented size VARIANT is legal; a second implementation is not. |
| 15 | Monogram-initial fallback when there is no photo | 2 of 23 confirmed by eye | [Fresha iOS](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122) (`A` / `TK` / `EL`) · [Fresha web](https://mobbin.com/screens/d0b3a99b-2e01-4f12-b796-cda8596736c7) (`M` / `D` / `T` / `N`) | **Already adopted, keep.** Solen's `Avatar` primitive handles it, same as `SalonTeam`. Note Fresha's monograms sit on *tinted* fills (dark green, lavender); Solen's stay B&W per the deviation already logged in `05-team.md`. |

---

## Grid

Solen's step is a single-column stack of full-width entity cards: `flex flex-col gap-2.5`, each
card `rounded-card` (16) + `border-s-border` hairline + `p-4`, avatar 56px, `gap-3.5` to the text
column. That is the **row** family, 8 of 23 in the corpus and the majority whenever more than
name+role has to fit.

The grid family, recorded for the rejection: Fresha iOS is 2-col with cards that read roughly
square (est. 16px page gutter, est. 12px inter-card gap, est. 56px centered avatar). Fresha web is
3-col inside a left pane at roughly 55-58% of content width, against a fixed right rail at roughly
30%. Careem is a horizontal scroller showing about 2.5 cards with the third visibly cropped, which
is the scroll promise our own density floor asks for.

The web pattern worth flagging separately: **every Fresha web step in this flow keeps the same
persistent right rail** (salon thumbnail + name + rating, line items, total, and a black Continue
pinned to the rail's bottom). The rail is the constant; only the left pane changes. Solen is
mobile-first with a sticky bottom bar, which is the correct mobile translation of the same idea:
one persistent commitment surface that survives every step.

Density: the corpus never paginates or caps this list. Observed card counts run 3 to 7 people. The
density floors do not bind here (a salon team is not a services list) and the rich-data ceiling is
not in play at Swiss salon scale.

---

## Type

Read off the Mobbin screenshots, so `est.` throughout:

- **Fresha iOS**: title est. 28-30px bold · card name est. 15px semibold ink · card subtitle est.
  13px grey. **Three sizes on the whole screen.** Clears Solen's ≤4-size ceiling with room, and
  clears the ≥28px display anchor on the title alone.
- **Fresha web**: title est. 32px bold · tile name est. 13-14px · tile subtitle est. 11-12px ·
  rail heading est. 14px · rail body est. 12px. More sizes, because two panes each carry a hierarchy.
- **Careem**: section question est. 17px semibold · sub-line est. 12px grey · name est. 13px ·
  rating est. 13px.
- **Zocdoc**: name est. 17px bold · specialty est. 15px grey · rating row est. 14px.
- **Airbnb**: name est. 22-24px and it IS the largest thing in its card, because that card is a
  profile rather than a picker.

Solen's exact values, from source: name `text-[15px] font-heading`, weight `font-medium` →
`font-semibold` when selected; subtitle `text-[13px] text-s-ink-2`; rating `text-[12px]`; profile
link `text-[12px]`; sticky-bar price `text-xl font-bold tabular-nums`; CTA `text-sm font-semibold`.
That is 15 / 13 / 12 / 20 / 14 = **five distinct sizes inside `StaffStep.tsx` alone**, before
whatever title `BookingWizard` contributes.

**This is the one measurable ceiling risk in the file.** The ≤4-sizes floor is measured on the
RENDERED first viewport, and the 20px and 14px both live in the fixed bottom bar, which is always
in view. Whether it actually trips depends on the rendered page and on whether the title adds a
sixth. It must be measured with `getBoundingClientRect` on the live step. **I did not render it.**

The weight change on select (`font-medium` → `font-semibold`) is a cheap, good selected cue that
costs no new size, and it is exactly what the locked selected state names.

---

## Motion

**What I can actually evidence:** two apps published paired states of the same screen, which shows
the state change happens in place rather than via a page transition.
[Fresha web unselected](https://mobbin.com/screens/d0b3a99b-2e01-4f12-b796-cda8596736c7) vs
[Fresha web with Denise chosen](https://mobbin.com/screens/325d386d-25e9-4eb0-a7a2-d0c09569f0a2)
differ only by which tile carries the ring and by the rail line reading `with any professional` vs
`with Denise`. [Bloom unselected](https://mobbin.com/screens/f7e8ee82-734b-4bcc-93ab-f9ab193a2d6a)
vs [Bloom with Mike chosen](https://mobbin.com/screens/7b1531dd-6257-41e2-80a0-256b7007c93d) differ
only by the card border. The Fresha
[flow capture](https://mobbin.com/flows/06fbe8b6-3747-48e7-847c-39da91a611a0) runs
Select professional → Select services, so on iOS the tap also navigates.

**Everything beyond that is inference and is labelled as such:** durations, easings, whether the
ring animates in, whether the list staggers on enter. **Mobbin returns stills. None of it is
observable here.** Any motion claim in a downstream spec needs a real capture (Playwright video per
the binary-triggers table), not this file.

Solen's own motion, from source and therefore exact: list enter uses the shared
`useStaggerVariants()` ENTER RECIPE (reduced-motion safe); rows use `butterPress('row')`; the CTA
uses `butterPress('cta')` plus a chevron whose shaft draws in on hover via `stroke-dashoffset` over
300ms `ease-glide`. The selected check is deliberately **static**: the file's B4 note records that
a spring/pop was removed so an already-selected row never re-announces itself on re-render. That is
a better decision than anything this corpus can prove, and a future "add delight" pass must not
undo it.

---

## Components

Registry mapping, per FLOORS LAW 9 (compose, do not redraw):

| Element | Solen component | Status |
|---|---|---|
| Person row | `StaffStep.tsx` inline: `rounded-card` + hairline, gap-separated | Individual entity-card grammar per the radius lock ("ONE card per DISTINCT entity, a stylist/person"). The lock already anticipated this exact screen. |
| Avatar + monogram fallback | `Avatar` primitive, `size={56}` | Shared with `SalonTeam` (88/112px there). A size variant of one component, which FLOORS LAW 8 permits. Do not fork it. |
| Star | `fill-s-star` + Lucide `Star size={11}` | Matches the `#FFC32B` universal-yellow lock and `SalonTeam`'s rating badge. |
| "Any" glyph | Lucide `Users size={22}` in a 56px white circle | Lucide-only rule satisfied. Occupies the avatar slot so the row rhythm never breaks. |
| Selected indicator | `CheckBadge`: 24px ink circle + white check | Local to this file. **Promotion candidate**: the corpus shows this is the one selected treatment compatible with Solen's no-ring lock, so other pick-one surfaces will want it. |
| Profile escape | `StaffProfileSheet` (read-only) | Exists specifically so mid-booking profile viewing cannot become mid-booking service switching (B7 / B19). |
| Sticky commit bar | inline in `StaffStep.tsx`, duplicated from the services step by the file's own note | **Extraction candidate.** The design contract's sticky-CTA row already names two per-surface implementations; this is a third. Three copies of one bar is the FLOORS LAW 9 failure mode. |

---

## Solen gap

**Solen's staff step is already closer to the corpus consensus than most of the corpus is.** It has
the pinned-first "Egal" with a glyph (4/4 pattern), it pre-selects it (2/4), it carries a second
line under every name (19/23), it renders the rating conditionally exactly as Fresha does, its
avatar is a circle (15/22), and it has the running-total commit bar that the tap-to-advance
majority cannot host. The row-over-grid choice diverges from Fresha but sits with the corpus
majority for information-dense pickers, and it is a dated owner decision (2026-07-09, Direction B),
so it stands.

**Four items for the parent agent, in priority order:**

1. **The fully-booked dead end (adopt).** `DateTimeStep.tsx:233-249` offers only a waitlist when
   the chosen day has no free slots. Fresha offers three exits at that same moment, and the missing
   one, "Check all professionals", is the one that undoes the staff choice. Because Solen
   deliberately shows no per-staff availability on the choice screen (correctly: no endpoint, no
   fabrication), the user commits blind, which makes a cheap un-commit the necessary counterpart.
   Source: [Fresha web fully-booked](https://mobbin.com/screens/2d59480f-6238-48cd-a235-a03d498894f4).

2. **Five font sizes in one component (measure, then decide).** 15 / 13 / 12 / 20 / 14, before the
   step title, with the 20 and 14 in the always-visible bottom bar. This may or may not trip the
   ≤4 ceiling on the rendered viewport. It has to be measured live; this file does not measure it.

3. **The subtitle can fall back to nothing.** `languages` renders only `if (languages)`, so a null
   value degrades the row to name-only, which the corpus says is legal for filter rails and not for
   commits. Needs a non-null fallback (role/specialty is the corpus's 9-of-23 default). Separately,
   the subtitle is ALL-CAPS, which is on the mockup-banned list, and copy rule 4 bans language tags
   by name at checkout. The owner reinstated it 2026-07-24 against a Fresha reference and that call
   is dated and stands, but the two rules are in tension and that should be known rather than
   rediscovered.

4. **Third copy of the sticky commit bar.** Extraction candidate, not a defect today.

**One thing I checked and did NOT find, recorded so it is not re-investigated:** I suspected the
locked gray selected fill (`bg-s-bg-sunken`) would go invisible if the booking body were also
sunken. I grepped `BookingWizard.tsx` and `app/[locale]/salon/[slug]/booking/page.tsx` and found no
`bg-s-bg-sunken` on either body, so the selected fill reads against white. **The collision does not
exist today.** It would appear the moment this step moves onto a sunken tray, which the
Edge-visibility floor does push toward for grouped content, so it is worth knowing in advance.

---

## Provenance

- Corpus swept 2026-07-29 by agent `corpus:booking-staff` for `_plans/SCREEN_RESEARCH.md` item A5.
- Solen behaviour read from source (`components-legacy/booking/StaffStep.tsx`, 236 lines;
  `DateTimeStep.tsx`; `salon/[slug]/booking/page.tsx`), not from memory.
- Direction B row treatment: owner-picked 2026-07-09 from `/dev/stylist-directions`.
- Language subtitle reinstated: owner 2026-07-24, Fresha ref IMG_6696 "Teammitglied auswählen".
- Individual-entity card grammar: owner 2026-07-19 ("stylists are individual not groups").
