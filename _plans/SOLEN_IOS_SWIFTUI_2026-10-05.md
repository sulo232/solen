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
