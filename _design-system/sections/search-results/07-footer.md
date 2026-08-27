# Global footer , section spec

**Reference:** `_design-system/sections/_measured/search-results.json`, bands 8, 9 and 10. Band 9 is the newsletter title wrapper (a bare `div`, contained in band 8, same heading) and band 10 is the newsletter `form`, also contained in band 8. Both are folded into this file, since the walker promoted them only because a `form` is a landmark tag and the wrapper leads with a heading.
**Component:** `app/[locale]/_components/layout/Footer.tsx`, gated by `FooterGate.tsx`
**Layer:** 1 (chrome)

## Layout

```
y 1374 ┌──────────────────────────────────────────────┐  390 x 880, white
       │  Bleib auf dem Laufenden          17/600     │
       │  Neue Salons, Trends und Tipps.   13/400     │
       │  ┌──────────────────────────────────┐        │  350 x 50, radius 12
       │  │ E-Mail-Adresse            [ ➜ ]  │        │  hairline, no shadow
       │  └──────────────────────────────────┘        │
       │                                              │
       │  Solen.                           22/700     │  wordmark
       │  Für Ihre Stadt. Für die Schweiz. 13/400     │
       │  [ ] [ ] [ ]                                 │  36px social tiles
       │                                              │
       │  Unternehmen   Entdecken   ...    14/700 x4  │  four column headings
       │  link          link               13/400 x13 │
       │  ────────────────────────────────────────    │  border-t hairline
       │  © 2026 Solen.ch Schweiz  🇨🇭     12/700     │
y 2254 └──────────────────────────────────────────────┘
```

## Measured

Band 8 box: top **1374**, left **0**, width **390**, height **880**. Surface `rgb(255, 255, 255)`, padding `0px`, radius `0px`.
Band 9 box: top **1402**, left **20**, width **350**, height **47**.
Band 10 box (the form): top **1465**, left **20**, width **350**, height **50**.

Text roles, band 8, verbatim:

| size | weight | family | colour | line-height | letter-spacing | count | sample |
|---|---|---|---|---|---|---|---|
| 22 | 700 | Inter Tight | `rgb(10, 10, 10)` | 22 | normal | 1 | `Solen` |
| 17 | 600 | Inter Tight | `rgb(10, 10, 10)` | 25.5 | -0.425px | 1 | `Bleib auf dem Laufenden` |
| 16 | 400 | Inter | `rgb(10, 10, 10)` | 24 | normal | 1 | `E-Mail-Adresse` |
| 14 | 700 | Inter | `rgb(10, 10, 10)` | 21 | normal | 4 | `Unternehmen` |
| 13 | 400 | Inter | `rgb(107, 107, 107)` | 19.5 | normal | 13 | `Neue Salons, Trends und Tipps. Einmal im Monat.` |
| 13 | 400 | Inter | `rgb(107, 107, 107)` | 21.13 | normal | 1 | `Für Ihre Stadt. Für die Schweiz.` |
| 13 | 500 | Inter | `rgb(107, 107, 107)` | 19.5 | normal | 1 | `DE` |
| 12 | 700 | Inter | `rgb(107, 107, 107)` | 18 | normal | 1 | `© 2026 Solen.ch Schweiz` |

Card anatomy, bands 8 and 10: radius **12px**, shadow **none**, border **`1px solid rgb(228, 228, 231)`**, background `rgb(255, 255, 255)`, padding **`12px 48px 12px 16px`**, count **1**, example size **350x50**.

Imagery, band 8: **0** images. The Swiss flag is an inline `<svg>`, which the walker skips, and the social tiles are lucide glyphs.

**The 16px `E-Mail-Adresse` role is invisible to a sighted reader, and naming it matters.** `Footer.tsx:242` is `<label htmlFor="footer-newsletter-email" className="sr-only">E-Mail-Adresse</label>`. `sr-only` renders at 1px by 1px, which clears the walker's `rect.width > 0 && rect.height > 0` test, and with no font-size of its own it inherits the 16px root. So this role is a measurement artifact. It is the reason 16px appears in the footer's size list at all, and it inflates the document-wide `distinctSizes` count.

**The input's own 14px does not appear as a role** because a placeholder is not a text node, so `ownText` finds nothing on the input element.

**The measured left padding is 16px and the class says 14px.** `Footer.tsx:251` sets `pl-[14px]`, and the measurement reads `12px 48px 12px 16px`. The file's own comment at that line names the cause: the base input rule in `globals.css` (V3-D-input-fill-2026-07-17) out-specifies a plain utility, which is why the right padding carries `!important` and the left one does not.

## Chrome position

Not applicable to this section. The search pill's box is recorded in `02-search-band.md`.

## Tokens

- Footer surface: `relative z-[1] bg-white`
- Newsletter title: `font-display text-[17px] font-semibold tracking-tight text-s-ink`. Measured tracking 0.425px negative, which is 17 x 0.025.
- Newsletter sub: `font-body text-[13px] text-s-ink-2`
- Input: `rounded-xl` (12), `border-s-border`, white, `text-[14px]`, submit button `h-9 w-9 rounded-[6px] bg-s-ink text-white` inset 6px (12 minus 6, the nested-radius formula)
- Wordmark: `font-display text-[22px] font-bold leading-none tracking-normal text-s-ink`
- Blurb: `font-body text-[13px] leading-relaxed text-s-ink-2`. Measured 21.13 line-height, which is 13 x 1.625.
- Column headings: `font-body text-[14px] font-bold text-s-ink`
- Links: `font-body text-[13px] text-s-ink-2`, hover to `text-s-ink`
- Social tiles: `h-9 w-9 rounded-xl bg-s-bg-sunken text-s-ink-2`, hover inverts to `bg-s-ink text-white`
- Bottom bar: `border-t border-s-border pt-6 font-body text-[12px] font-bold text-s-ink-2`

## Interaction

- Newsletter form POSTs JSON `{ email }` to `/api/newsletter`. On success the form is replaced in place by a `role="status"` line at `text-[14px] text-s-ink`; on failure a `role="alert"` at `text-[12px] text-s-error`.
- Social tiles and column links are ordinary navigation.
- The `DE` control at 13/500 is the language switcher.

## Intentional deviations

- **Two weight-700 roles.** The wordmark at 22/700 and the four column headings at 14/700 are the only 700s on the screen. The design contract caps a screen at 2 distinct weights, and the whole document measures 4 (400, 500, 600, 700). Recorded, not changed.
- **The copyright line is weight 700 at `s-ink-2`.** A bold grey 12px line is the heaviest treatment on the least important string on the page. Recorded, not changed.
- No blur wrapper over the newsletter strip. The file records that a blur over an already-white page washed the strip-to-body seam into a milky band, so it was removed.

## Empty state

None. Every element here is static chrome except the newsletter form's success and error states, which are described above.

## Against the floors

**This band sits entirely below the fold** (top 1374 against a viewport of 844), so it contributes to none of the six first-viewport floors.

- Its 22px wordmark is the largest text in the document. It is still 6px short of the 28px display-anchor floor, so even if the fold were not in the way, nothing on this screen would clear F6.
- It supplies four of the eight distinct sizes in the document (22, 17, 16, 13) and two of the four distinct weights (700, and the 500 on `DE`).
- Of the **23** text elements this band contributes, **7** are weight 600 or more, which is **30.43%** within the band. **Corrected 2026-08-27.** This line read "22 text elements ... 6 ... 27.3%", and both figures are wrong against the JSON. Band 8's `textRoles` counts sum to 1 + 1 + 1 + 4 + 13 + 1 + 1 + 1 = 23, and the members at weight 600 or more are the 22/700 wordmark, the 17/600 newsletter title, the four 14/700 column headings and the 12/700 copyright line, which is 7. This folder's own README depends on the corrected figure: its "132 text and 45 bold" total across every real band only closes if this band contributes 23 and 7.
- Excluding the `sr-only` 16px label named above as a measurement artifact, the same figures read **22** elements and **7** bold, **31.82%**. Both readings are recorded because that label is real to the walker and invisible to a reader, and neither reading is the 6 this file used to claim.

Against the owner's target ladder (`/de/salon/cuts-and-culture`, measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, weight-600 share 30%, 3 elevations, 34.66% photographic): this band holds the document's largest text at 22px, and that is still 8px under the ladder's anchor and 6px under the 28px floor, so nothing on this route reaches either number at any scroll position, above or below the fold. Its 22/700 wordmark and four 14/700 column headings are the only weight-700 elements on the screen while the ladder carries emphasis at weight 500, which makes this the band furthest from the ladder on the route. It is below the fold, so it contributes nothing to the screen's measured 5 elevation levels against the ladder's 3; its own card measures `shadow: none` on a 12px hairline.

## Provenance

- V3-D-input-fill-2026-07-17 , the globals.css base input rule, and the `!important` carve-out it forces on the right padding
- TASTE_LOG.md:187 (2026-07-15), punch-list geometry sweep , radii snapped onto the ladder, `rounded-[10px]` to `rounded-xl` on the input and the social tiles, `rounded-[9px]` to `rounded-[6px]` on the nested submit button
- Owner-measured fix , the blur wrapper removed from the footer surface
