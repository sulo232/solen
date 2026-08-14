# /salon/[slug] section docs

Per-section specs for the salon-detail route. Each section .md file follows the same shape:

- **Reference:** path to the screenshot we measured against
- **Component:** file path of the React component
- **Layout:** the visual + structural target (numbers measured, not eyeballed)
- **Tokens:** color/font/spacing tokens used
- **Interaction:** what each tap does
- **Intentional deviations:** Solen brand choices that differ from the reference
- **Provenance:** V3-D{n} lock(s) that drove the section

## Sections (top to bottom on mobile)

| # | File | Section | Component |
|---|---|---|---|
| 1 | `01-hero.md` | Hero gallery | `salon/SalonHero.tsx` |
| 2 | `02-sticky-tab-nav.md` | Sticky tab nav | `salon/SalonStickyTabNav.tsx` |
| 3 | `03-header.md` | Title block + meta + featured pill | `salon/SalonHeader.tsx` |
| 4 | `04-services.md` | Services list + filter chips | `salon/SalonServices.tsx` |
| 5 | `05-team.md` | Team carousel | `salon/SalonTeam.tsx` |
| 6 | `06-reviews.md` | Reviews summary + cards | `salon/SalonReviews.tsx` |
| 7 | `07-portfolio.md` | 3-col photo grid | `salon/SalonPortfolio.tsx` |
| 8 | `08-buy.md` | Gift cards promo | `salon/SalonBuy.tsx` |
| 9 | `09-about.md` | About paragraph + map placeholder + address | `salon/SalonAbout.tsx` |
| 10 | `10-opening-times.md` | 7-day hours list | `salon/SalonOpeningTimes.tsx` |
| 11 | `11-additional-info.md` | Amenity checklist | `salon/SalonAdditionalInfo.tsx` |
| 12 | `12-contact.md` | Mobile-only contact rows | `salon/SalonContact.tsx` |
| 13 | `13-loyalty.md` | Treueprogramm cards | `salon/SalonLoyalty.tsx` |
| 14 | `14-other-locations.md` | Chain locations carousel | `salon/SalonOtherLocations.tsx` |
| 15 | `15-venues-nearby.md` | Same-category nearby carousel | `salon/SalonVenuesNearby.tsx` |
| 16 | `16-app-cta.md` | Bottom "Verwöhne dich" CTA + chip row | `salon/SalonAppCta.tsx` |
| 17 | `17-mobile-book-bar.md` | Mobile sticky bottom Book bar | `salon/SalonMobileBookBar.tsx` |
| 18 | `18-sidebar.md` | Desktop sticky right rail | `salon/SalonSidebar.tsx` |
| 19 | `19-services-sheet.md` | Full-screen Services sheet (booking step 1) | `salon/SalonServicesSheet.tsx` |
| 20 | `20-lightbox.md` | Photo lightbox modal | `salon/SalonLightbox.tsx` |

## Reference set

User-curated Fresha screenshots (gold standard):
- `/Users/sulo/solen/screenshots/IMG_4728.png` — Hero + title + status + bottom CTA
- `/Users/sulo/solen/screenshots/IMG_4729.png` — Sticky tab nav + Services chips + service rows + Book buttons
- `/Users/sulo/solen/screenshots/IMG_4730.png` — Services overflow + "Alle anzeigen" + Team section start
- `/Users/sulo/solen/screenshots/IMG_4731.png` — Team avatar + rating + Bewertungen summary stars
- `/Users/sulo/solen/screenshots/IMG_4732.png` — Reviews cards w avatar initials + 5-star rows
- `/Users/sulo/solen/screenshots/IMG_4733.png` — Tab nav scrolled to Portfolio + 3-col grid
- `/Users/sulo/solen/screenshots/IMG_4734.png` — Portfolio grid 9 tiles + "+N" overlay + Öffnungszeiten start
- `/Users/sulo/solen/screenshots/IMG_4735.png` — Öffnungszeiten full week + Zusätzliche Informationen start
- `/Users/sulo/solen/screenshots/IMG_4736.png` — Amenities list + map placeholder
- `/Users/sulo/solen/screenshots/IMG_4737.png` — Address + "Route" link + "Anbieter in der Nähe" carousel
- `/Users/sulo/solen/screenshots/IMG_4738.png` — "Gönn dir ein Verwöhnprogramm" CTA + category chip row
- `/Users/sulo/solen/screenshots/IMG_4739.png` — Fresha footer (skip — out of scope)
- `/Users/sulo/solen/screenshots/IMG_4740.png` — Fresha footer continued (skip)

Solen audit captures:
- `_audits/screenshots/salon-detail/03-mobile-top.png` — Solen mobile hero + title
- `_audits/screenshots/salon-detail/10-mobile-haarwerk-c1.png` — Solen mobile hero through Bewertungen start (populated seed)
- `_audits/screenshots/salon-detail/10-mobile-haarwerk-c2.png` — Solen mobile Portfolio through Kontakt
- `_audits/screenshots/salon-detail/10-mobile-haarwerk-c3.png` — Solen mobile Treueprogramm through footer
- `_audits/screenshots/salon-detail/05-desktop-top.png` — Solen desktop hero + title + sticky sidebar
- `_audits/screenshots/salon-detail/06-desktop-services.png` — Solen desktop services + sidebar

## Locked decisions affecting this route

- **V3-D192-fix** — primary CTAs stay `bg-s-ink` (not accent blue)
- **V3-D193** — pure-white substrate, atmosphere washes deleted
- **V3-D197** — three-layer color system (Chrome / Brand accent / Semantic UI)
- **V3-D199** — saturation contract for any new color token
- **V3-D200** — star yellow `#FFC32B` universal
- **V3-D201** — StatusPill single-source open/closed
- **V3-D202** — full A-phase detox (font swap to Inter Tight, retired-token migration, shadow tokens)
- **V3-D203** — no emoji in code/files/UI
- **V3-D204** — accent flipped to `#276EF1` royal blue
- **V3-D205** — universal-components rule (no category branches)
- **V3-D206** — salon-detail audit: sticky tab nav z-[60] + category eyebrow under H1
