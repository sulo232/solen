# Solen iOS app in SwiftUI with Liquid Glass (owner, 2026-10-05)

His words: "start making the app using swiftui native comp new i want alot of liquid glass and yk the structure use our current sh".

## His answers (2026-10-05)

| Question | Answer |
|---|---|
| Relation to the Expo app | **Replace it.** The new app lives in `~/Documents/solen-ios`. `solen-mobile` is frozen as a reference. |
| Tabs | **The website's bottom bar:** Search, Inspo, Saved, Profile |
| How much glass | **Glass on everything that floats:** tab bar, top bars, search, buttons over photos, sheets, Book bar, map controls. Content stays white in the Uber look. |
| First build | **The core booking path with real salons:** home and search, salon page, booking up to a pretend payment. Then page by page, under the same working agreement as `UBER_RENEWAL_2026-10-04.md`. |

## My calls (judgement; he can overrule any)

- **iOS 26 minimum,** because Liquid Glass needs it.
- **Native parts:**
  - SF Symbols in place of Lucide, the system font in place of Inter;
  - system tab bar, minimising on scroll;
  - zoom transition from card to salon;
  - the booking flow opens as a sheet.
- **Shared look:** `Solen/Design/Theme.swift` mirrors `uber/tokens.js`, so the app and the site share one ledger.
- **Main action buttons:** they sit inside floating glass bars, so they are capsules (Apple's glass rule).
  - This touches the open ledger question "main button 8px vs round".
- **Light only,** like the website.
- **English copy first.** All strings go through the String Catalog; German, French and Italian come next.
- **Saved hearts** are kept on the phone until sign-in lands.

## Built (2026-10-05, build succeeded)

- **Search tab:**
  - home with the website's headline, a glass search pill, category chips, and rails of real salons (Top on Solen, Walk-in, top per category);
  - results with a glass search field, filter chips (Open now, 4.5+, category) and a list/map toggle.
- **Salon page:**
  - photos under the glass toolbar, with share and heart;
  - name, rating, open/closed from real hours, address;
  - grey bands between services (grouped, add/remove), team, reviews (3 shown plus "Show all"), about (3 lines plus "Read more"), hours, map with directions, and "Good to know" (only the flags set);
  - a floating glass Book bar.
- **Booking sheet:**
  - services, then person (or no preference), then date and time (21 days, real slots, otherwise sample times from the hours, labelled), then review and pay (details, Apple Pay or card, free cancellation from the real hours setting);
  - "Pay" is simulated, and the done screen says no booking was made.
- **Inspo:** the real feed in a 2-column grid. The detail sheet has "Find …", which maps to the salon category.
- **Saved:** salons from the hearts, plus an empty state.
- **Profile:** links to the help, contact, terms, privacy and imprint pages on the website, plus language.

## Not built yet / blockers

- **Sign-in and account:** a later round. Web code sign-in stays as is.
- **Real payment and real booking creation:** these come after approval.
- **Live times:** `availability_slots` has 0 future rows (nightly jobs off since 07-20), so every salon shows sample times.
- **Walk-in, tips, vouchers, loyalty, notifications:** later rounds.
- **German, French and Italian strings.**
- **Simulator check:** done 2026-10-05 with Xcode's command-line tools (he said "u do that" from his phone).
  - 12 screens saved in `_audits/screenshots/ios-2026-10-05/` (a folder git ignores).
  - Fixed in that pass:
    - Inspo failing to load;
    - times shown in 12-hour format;
    - results cards spilling off the screen;
    - hidden search field;
    - tab bar showing under the Book bar;
    - near-invisible disabled buttons, which now show a hint instead;
    - grey profile page.
  - Still open: on the salon page, scrolled text slides under the top glass buttons with no fade.
  - Debug builds take `-route <screen>` to open any screen directly for checks.

## Next

1. Done: screenshots sent.
2. Page-by-page rounds. Shared changes go in `Theme.swift` and the site ledger together.

## Round 2 (2026-10-05): owner said "all of them looks really ass"; research then rebuild

- **Measured cause:**
  - the glass search bar was invisible (fill 253 on a 255 white page);
  - a slogan took 30% of Home;
  - 16 hard-coded type sizes;
  - website parts transplanted: grey pill fields, boxed payment, a fake Apple Pay row;
  - a colourless page;
  - Inspo stacked text on text.
- **Research:** `_design-system/research/ios-swiftui-liquid-glass-2026-10.md` (Apple HIG and WWDC25, app teardowns, his X saves).
- **Changed:**
  - Apple text styles only.
  - Search is Apple's search tab: a round glass button at the end of the bar that turns into the search field. Its page has photo category tiles and rails of about 2.2 cards. Typing shows compact rows.
  - Glass only on bars and on controls over photos. Hearts on cards use a plain material.
  - Services, person and review steps are native grouped lists and forms.
  - The real Apple Pay button comes first, with card below.
  - Hairlines between salon sections.
  - On the salon page, the title fades in once the photo scrolls away.
- **Contradictions with the site ledger (`UBER_RENEWAL_2026-10-04.md`), raised to him:**
  - Section breaks: the app uses hairlines, the ledger says 4px grey bands.
  - Type: the app uses Apple text styles (28/22/17/15), the ledger says 26/21/18/16.
  - Tab bar: Search moved to Apple's separate round button at the end of the bar. The four destinations are unchanged, but the order differs from the website.
  - Grouped grey form pages (booking, profile) are the native look; this touches his earlier "grey vs white pages" complaint.

## Round 3 (2026-10-05): components redone from his X saves ("so basic … nth clean")

- **Source:** 43 stills from the 58 high-relevance app saves in `_design-system/research/x-saved-2026-09/tags.json` (#23, #30, #279, #346, #370, #404, #414, #432, #475, #614, #666, #72 and others), plus the earlier comparison page `public/_research/x-components/`.
- **What the saves do that we didn't:** everything sits in a white box on a soft shadow; photos are inset inside the card; every meta value has an icon; status shows as a dot badge; numbers sit in grey stat tiles; add is a round button; selected is ink.
- **Built on branch `components-v2` in `solen-ios` (not merged; main stays at round 2 until he approves):**
  - `card()`, `MetaItem`, `StatusBadge`, `StatTile`, `RoundAddButton`, `PressScale` in `Theme.swift`;
  - salon card and search row; salon header sheet over the photo with 3 stat tiles; boxed service groups with active chip; review card rail; hours box with Today; Good to know icon tiles;
  - booking: boxed services and team, slots split Morning / Afternoon / Evening, review and pay as cards with labels above fields and capsule pay buttons.
- **Clashes with the site ledger (`UBER_RENEWAL_2026-10-04.md`), raised to him:**
  - box radius 16 -> 20 (with 12 inside, capsule for taps; the X-saves rule);
  - Uber's flat look -> white cards on a soft two-layer shadow;
  - section breaks: hairline (round 2) -> space only, hairlines only inside a box.
- **Screens:** `_audits/screenshots/ios-2026-10-05/v3/`.
