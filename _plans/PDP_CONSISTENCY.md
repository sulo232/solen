<!-- batch: owner 2026-07-25, PDP reviews/date/buttons consistency + portfolio overflow + scroll motion -->
# PDP consistency + motion , owner batch 2026-07-25

## Readback (6 asks)
1. Review DATES are too detailed. Today: "Do., 11. Juni 2026 um 18:07". Wanted: "11. Juni 2026" , no weekday, no time.
2. The REVIEWS SECTION is inconsistent across surfaces (PDP section, the see-all full page, and the STYLIST profile page) and does not follow the design system. Needs to be ONE system.
3. Too many BUTTON variations for the same job (book / select / choose). The team section's select in particular does not align.
4. PORTFOLIO overflow: when there are more than 9 photos, the 9th (last visible) tile carries a "+N" overlay, bottom-right.
5. SCROLL MOTION: a frosted, condensing top bar like X/Twitter.
6. More animation generally, "be simple".

## Reference CAPTURED (not described from memory)
`/Users/sulo/solen/screenshots/ScreenRecording_07-25-2026 15-43-36_1.mp4` (5.15s, today 15:43), 10 frames
extracted at 2fps to scratchpad/rec/. It is the X profile of @60fpsdesign being scrolled. Observed behaviour:
  - t=0.0 top bar is minimal over the banner: back arrow + actions only, no title.
  - t=1.5-2.0 as content rises, the bar gains a TRANSLUCENT FROSTED background; content is visibly blurred
    THROUGH it rather than being clipped by it.
  - t=3.0+ the bar CONDENSES: the profile name plus a secondary stat ("60fps" / "4.5K posts") slides INTO
    the bar, and a compact primary action ("Follow") appears on the right.
  - The transition is scroll-linked and continuous, not a binary snap at one threshold.

## Boxes
- [x] C1. `verified:` sha a7f0c92e1 , runtime on /de/salon/cuts-and-culture reads "11. Juni 2026" / "9. Juni 2026", no weekday, no time; fixed in the shared helper so 6 surfaces inherit it; de/en/fr/it checked. Review date format -> day + month + year only, every surface that renders a review date.
- [ ] C2. Reviews SYSTEM: one review-row component + one summary grammar shared by the PDP section, the full reviews page, and the stylist profile page. Audit first, name every divergence, then unify.
- [ ] C3. BUTTON audit: enumerate every book/select/choose variant in the customer surfaces, then ONE rule per job (mockup, owner picks).
- [x] C4. `verified:` sha a7f0c92e1 , runtime: cuts-and-culture 9 photos -> NO badge (correct); atelier-haarwerk 11 -> "+2" on the 9th tile, frosted, bottom-right, tap still opens the gallery. Portfolio overflow "+N" on the 9th tile, bottom-right.
- [x] C5. SERVING + VERIFIED. sha e94c26e8d , /dev/scroll-motion?v=1|2|3 all 200. Frost measured: at scroll 0 the bar is rgba(255,255,255,0) with blur(0px); scrolled past the hero it is rgba(255,255,255,0.8) with blur(4px), i.e. FROST_GLASS's own values, on all three directions. v2/v3 additionally slide the title in ("Cuts & Culture 4.8 (16)"), v3 adds the action. Zero page errors. ROOT CAUSE of the earlier 'route hangs': NOT the route , the dev server's .next cache was wedged and a SIBLING route (/dev/seeall) that had served 200 earlier was also returning 000. Cold restart + rm -rf .next fixed it. My first frost check also under-scrolled (500px) when the hero starts 588px down behind the harness chrome, so it read a false negative.
- [ ] C6. Motion pass beyond C5, kept simple.

## C3 AUDIT RESULT (measured 2026-07-25, grep over customer surfaces, /dev excluded)
FIVE labels are in play for what is largely ONE job:
  - `Buchen` x23
  - `Termin buchen` x10
  - `Jetzt buchen` x7
  - `Auswählen` x4
  - `Anstehen` x3
Rendered by at least 10 components incl. SalonMobileBookBar, SalonSidebar, SalonServices, SalonBundles,
SalonAppCta, SalonCard, CategoryHeroCarousel.
DIAGNOSIS: these are not five decisions, they are five accidents, the same shape as the see-all variants
(three variants whose own comments admitted each existed to copy a neighbouring surface). Copy economy
already says "one primary commit phrasing per screen"; nothing said one phrasing per JOB across screens.
PROPOSED RULE (owner picks): label follows the JOB, not the surface.
  - page-level commit (the sticky bar, the sidebar) = `Termin buchen`
  - a row inside a list whose heading already says services = `Buchen` (the context supplies the noun)
  - a row-commit in a PICKER (choose a stylist) = `Auswählen`
  - the walk-in queue = `Anstehen` , a genuinely DIFFERENT job, legitimately its own word
  - `Jetzt buchen` = RETIRED, it is `Termin buchen` with an adverb that adds nothing
- [x] C3a. Rule confirmed (owner brief 2026-07-25, coder pass): label follows the job, per the mapping above.
- [x] C3b. `verified:` applied across app/[locale], components-legacy, components, messages/{de,en,fr,it}.json. `Jetzt buchen` retired everywhere on customer surfaces (SalonSidebar, StaffProfilePage standalone CTA, the [city]/[category] SEO title, QuickPreviewSheet's ui.preview.book, plus 5 dead/orphaned i18n keys cleaned for grep-zero). Only 2 occurrences remain, both `dashboardWaxing.*` (salon-owner dashboard, not a customer surface, dead/unused code, left as an honest exception). REMOVED.md fed. `npx tsc --noEmit` clean.

## C2 AUDIT RESULT (reviews rendered by THREE separate implementations)
  1. PDP section , `app/[locale]/_components/salon/SalonReviews.tsx` (D3 segmented: tier chips + hairline list)
  2. Full page , `components-legacy/salon/SalonReviews.tsx` (chips + sort pill + write-review + photos + replies + pagination)
  3. Stylist profile , `components-legacy/staff/StaffProfilePage.tsx` + `StaffReviewsSheet.tsx`
Only the DATE was unified this turn (one shared helper, six surfaces). The CARD grammar, the summary
block and the empty state still diverge per surface.
- [ ] C2a. Extract ONE review-row component + one summary grammar, used by all three.
