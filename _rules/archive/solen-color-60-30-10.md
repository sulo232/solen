# Solen Color Rule — 60-30-10 (Sunset Orange + Teal — D-Teal pivot)

> Pivoted: 2026-05-24 · User selected D-Teal variant from `public/solen-orange-cool-partner.html`
> Decision driven by: llm-council consult (Gemini + Grok) + warm-illustration coherence + iconic orange/teal beauty pairing
> Replaces V3-D107 Fruitful-greens rule (retired). Fruitful palette + supporting cool-only restriction RETIRED.
> Original lock 2026-05-23 · User selected variant C of `public/solen-fruitful-60-30-10.html` (now superseded)
> Source observations: `_audits/2026-05-23-fruitful-brand-spec.md` + 60-30-10 rule (Jesse Showalter) + cross-validation from Mobbin (Origin / Acorns / Wealthsimple / Wise / Stake).
> Mobbin note: Fruitful's app is NOT indexed on Mobbin (verified 3 searches). Discipline observations come from their live web app screenshot + extracted CSS.

## The rule, in one paragraph

Color is a finite budget. **60% neutral substrate, 30% ink for type, 10% green for what you click.** Section tints (peach / wasabi / droplet) carry warmth without spending the green budget — each section becomes its own self-contained 60-30-10 with the tint as the new 60%. The green button (and only the green button) travels through the entire page unchanged.

## The seven hard rules

1. **Green is reserved.** The Fruitful deep forest green `#054F31` (token: `s-brand`) appears ONLY on CTAs — pill buttons, "click me" affordances. Not on icons. Not on dividers. Not on headline word-highlights. Not on logos. Not on section accents.
2. **Logo stays ink.** The wordmark renders in `s-ink` `#1A1C19`, never green. Spending the green budget on the wordmark dilutes the CTA signal.
3. **Section tints are the calm cool warmth.** Each major section gets ONE pale background from the tint family:
   - `s-wasabi` `#D5ECBD` — calm green-yellow (Nearby, Entdecken)
   - `s-droplet` `#DFF0FF` — cool blue rest (FeaturedStylists)
   - `bg-white` — primary content (Hero, RecentlyViewed, SolenStory, CategoryPromos, Coiffeur, Reviews)
   - `s-brand-deep` `#173E26` — dark anchor section (BentoBusiness)
   - **No warm cream / peach.** Retired V3-D112 per user direction. The Solen
     palette is COOL only — green, mint, cool blue, white, ink. Warm beige /
     peach / cream is OFF-VOCABULARY; do not reintroduce ad-hoc.
4. **Locked semantics stay locked.** They are SIGNAL colors and live OUTSIDE the 60-30-10:
   - `s-star` `#1A1A1A` (star rating = ink)
   - `s-love` `#CC4A60` (heart-active, sale chips — Airbnb pattern, unchanged)
   - `s-success` `#16A34A` (available indicator dots)
   - `s-warning` `#F59E0B` (urgency)
   - `s-error` `#D32F2F` (error states)
   - These never reassign to the brand green — that would dilute their signal.
5. **Cards stay white on tinted sections.** Cards inside a peach/wasabi/droplet section render on `#FFFFFF` so the tint becomes the section's stage, not the card's wallpaper.
6. **Hover states tint, don't recolor.** Green CTA hover = `s-brand-mid` `#0B7443` (one step deeper in the same family). Never shifts hue.
7. **No gradients on body type. No green outlines as decoration. No green dividers.**
8. **CTA pill family is locked to TWO variants — period.** Added V3-D117 (2026-05-23) after critique flagged 4 competing pill styles.
   - **PRIMARY** (high-intent: book, search, register, "main action of the section"):
     `bg-s-brand text-white shadow-[0_4px_14px_rgba(5,79,49,0.25)] hover:bg-s-brand-mid`
   - **SECONDARY** (low-intent: learn more, see all, secondary navigation):
     `bg-white text-s-ink border border-s-ink hover:bg-s-ink hover:text-white`
   - **DARK-CONTEXT INVERSE** (NOT a 3rd style — just primary inverted for a colored bg). Pills sitting on the deep-green banner OR overlaid on a full-bleed photo invert:
     `bg-white text-s-ink` (with `bg-white/95 backdrop-blur-md` if over a photo for legibility)
   - **FORBIDDEN pill patterns**:
     - ❌ Green outline pill (`border-s-brand bg-transparent text-s-brand`) — was used in SolenStory V3-D110, retired V3-D117
     - ❌ Dark ink fill pill on white (`bg-s-ink text-white`) — only allowed on green or photo bg
     - ❌ Per-section custom pill hex (each card type minting its own colorway)

## Token assignments (tailwind.config.js)

```js
// s-brand swapped V3-D107 (2026-05-23): orange → Fruitful deep forest greens
"s-brand": {
  DEFAULT: "#054F31",   // Fruitful green-900 — primary CTA (was: #E58840 orange)
  pale:    "#D1FADF",   // Fruitful green-100 — hover wash, subtle bg
  subtle:  "#F2F9EB",   // Fruitful green-50 — ultra-pale wash
  mid:     "#0B7443",   // Fruitful green-800 — hover-deeper, mid CTA
  deep:    "#173E26",   // Fruitful green-1200 — dark section anchor (was: #142F4A navy)
},
// Section tints (V3-D107, peach retired V3-D112)
"s-wasabi":  "#D5ECBD",  // Fruitful wasabi-300 — calm
"s-droplet": "#DFF0FF",  // Fruitful droplet-200 — cool rest
```

## Section sequencing for the homepage

Top to bottom rhythm (V3-D112: peach tints REMOVED per user "remove ths color
like cream everywhere" — RecentlyViewed + Coiffeur reverted to white. `s-peach`
token retained for back-compat / potential re-introduction).

| Section | Background | Notes |
|---|---|---|
| Hero | `bg-white` | Primary CTA green pill |
| RecentlyViewed | `bg-white` | (peach retired V3-D112; no warm tints in system) |
| SolenStory | `bg-white` | Video carries its own atmosphere |
| Nearby | `bg-s-wasabi` | Calm geo browsing |
| CategoryPromos | `bg-white` | Swipeable cards, neutral stage |
| FeaturedStylists | `bg-s-droplet` | Cool rest, faces stand out |
| Coiffeur | `bg-white` | (peach retired V3-D112; no warm tints in system) |
| Entdecken | `bg-s-wasabi` | Looks feed |
| Reviews | `bg-white` | Quote testimony, clean |
| BentoBusiness | `bg-s-brand-deep` (`#173E26`) | B2B dark anchor, ends the page |

## Forbidden zones (what NOT to do)

- ❌ Green text accents inside body copy
- ❌ Green icons in card meta rows
- ❌ Green section dividers / hairlines
- ❌ Green section headers (those stay `s-ink`)
- ❌ Two different tints in the same section
- ❌ Cards picking up the parent section's tint as their bg
- ❌ Recoloring the heart-pink or available-green to "match" the brand green
- ❌ Banner top-strips painted brand green (a thick green bar = squandered budget)

## Verification checklist before claiming done

1. CTA pixel area in the hero ≤ 10% of viewport — confirmed by screenshot
2. Green appears only on pill buttons across all 10 sections — search the codebase for `bg-s-brand`, every match should be a CTA
3. Available badge (`#16A34A` dot) and CTA green (`#054F31` pill) sit on the same screen without competing — both should still read as distinct
4. Heart icon (`#CC4A60`) on saved listings still pops against the new green vocabulary
5. BentoBusiness section reads as a brand-family deep anchor, not a foreign navy intrusion
6. User visually confirms before marking the swap complete
