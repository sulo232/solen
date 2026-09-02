<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md section 6 (components) and
     section 3 (the two structural dialects). GuestBookingForm.tsx already exists and is composed
     here rather than rebuilt. `npm run exists "pay confirm"` returns PayConfirmStep.tsx and one
     graveyard entry. -->

# Contact block (logged-in summary, or the fields) , section spec

**Reference:** `_design-system/sections/_measured/checkout-pay.json`, `bandAnatomy.contactCard`
**Component:** `components-legacy/booking/PayConfirmStep.tsx:516-582`, with `components-legacy/booking/GuestBookingForm.tsx` for the logged-out branch
**Layer:** 1 chrome, with layer 2 accent on the "Ändern" link of the complete-contact variant

## Layout

Three variants. The middle one is what was measured.

```
COMPLETE (name and a 9+ digit phone on the profile):
  +--------------------------------------------------+
  | (user)  QA Test                        Ändern    |  14.5 / 600 + 13.5 accent
  |         +41 79 ...                               |  13px ink-2
  +--------------------------------------------------+

INCOMPLETE, MEASURED (name known, phone missing):
y=499  +--------------------------------------------------+  370 x 140
       | (user)  QA Test                                  |  14.5 / 600
       | [ Telefonnummer                              ]   |  336 x 48, radius 12
       | Für die Terminbestätigung. Wird gespeichert.     |  12px ink-2
       +--------------------------------------------------+
y=639

GUEST (logged out):
  +--------------------------------------------------+
  | <guest title>                                    |  15 / 600
  | <guest subtitle>                                 |  13px ink-2
  | GuestBookingForm: name, email, phone             |
  +--------------------------------------------------+
```

## Measured

| item | value |
|---|---|
| card | [16, 499, 370, 140], radius **16**, border 1px `rgb(228, 228, 231)`, background `s-bg-surface`, padding 16, shadow none |
| name | 14.5px / 600 / Inter / ink / count 1 / "QA Test" |
| phone input | [33, 550, 336, 48], height 48, radius **12**, border 1px `rgb(228, 228, 231)`, background white, font-size 16px, placeholder "Telefonnummer" |
| helper | 12px / 400 / Inter / `rgb(107, 107, 107)` / count 1 / "Für die Terminbestätigung. Wird gespeichert." |

**Two radii, and the difference is the finding.** The card is `rounded-input` and measures 16. The input inside it measures 12. The class named `rounded-input` does not produce the input radius:

- `tailwind.config.js:255` sets `borderRadius.input = "16px"`, with a comment citing DESIGN_SPEC §3.3, "form inputs (stable, not pill)".
- The locked design-contract table says **input 12**, "corrected 2026-07-17".
- `app/globals.css:361-368` styles bare inputs at `border-radius: 12px`, and wins, which is why the measured input is 12 and correct.

So the token is stale against a dated correction, no input is affected because globals overrides it, and the only consumers of the stale token are cards, which happen to want 16 anyway. The rendered result is right; the name is a trap for the next person who reaches for `rounded-input` on an actual input. Recorded, not fixed.

**The input renders at 16px font size.** That is the iOS zoom floor: anything under 16px triggers a zoom on focus. It is also the size that makes this screen's distinct-size count 9 rather than 8, because it is the one real 16px element (the other 16px source is the sr-only skip link).

## Tokens

- Card: `rounded-input border border-s-border bg-s-bg-surface p-4`, flat, no shadow. Both other cards on this screen carry `shadow-elevation-1`, so this one is visually a tier below them.
- Name: `font-body text-[14.5px] font-semibold text-s-ink`
- Phone line, complete variant: `font-body mt-px text-[13px] text-s-ink-2`
- Ändern, complete variant: `font-body text-[13.5px] font-semibold text-s-accent` (13.5, where the summary card's three Ändern links are 13)
- Inputs: bare `<input className="w-full">`, taking the global input law entirely, which is the locked "white fill, 1px `#E4E4E7` resting line, tapping it changes nothing visible, height 48, radius 12"
- Icon: `UserRound size={18} strokeWidth={1.9} text-s-ink-2`

## Interaction

- **Which variant renders is decided by data, not by a control:** complete requires `contactName.trim()` and at least 9 digits in `contactPhone` and `!editingContact` (`:517`).
- "Ändern" sets `editingContact`, which swaps the summary for the fields.
- The phone value is masked as it is typed (`handleContactPhoneChange`) and the name and phone are written to the profile on commit, best effort, with the booking proceeding regardless (`:242-248`).
- **The commit is blocked without them.** `handleConfirm` refuses with `fillRequiredFields` when a logged-in user has no name or fewer than 9 phone digits (`:222-225`). The refusal surfaces in the shared error line, not on the field.
- **No visible focus state, by a dated owner decision.** The locked focus row: white fill, a 1px resting line, and tapping it changes nothing visible. The accepted cost, recorded in the same lock, is that WCAG 2.4.7 asks for a visible focus indicator and this does not give one.

## Against the floors

- **Touch target: PASS on the input** at 48px. **FAIL on "Ändern"** in the complete variant, an unpadded 13.5px text link, not measured here because this run rendered the incomplete variant.
- **Locked input treatment: PASS.** Height 48, radius 12, white fill, `#E4E4E7` line, no halo. Exactly the contract.
- **Locked input radius token: FAIL as a token, PASS as a render.** See the two-radii note above.
- **Edge visibility (FLOORS LAW 4): PASS by option (c)**, hairline kept on a light card.
- **Elevation consistency: FAIL.** Three cards on one screen: two at `shadow-elevation-1` and this one flat, with no rule in the contract that separates them. The contract's surface table gives one signature per card role; a contact block is a form or summary card, the same role as the two above it.
- **iOS zoom floor: PASS.** 16px input font size.
- **Copy economy: PASS.** The helper is one line and it earns its place by saying what the number is for and that it will be stored, which is a consent-adjacent fact rather than padding.

## Intentional deviations

- **Mockup 28/28b, owner-approved 2026-06-12:** complete data shows a quiet summary row rather than pre-filled fields, and anything missing shows only the fields that are missing. That is why a logged-in user with a phone on file sees no form at all on a paid screen.
- **Guests keep the full form**, because they are the type-in case. `GuestBookingForm` is composed, not rebuilt, and the single commit button force-validates it through a ref so field errors surface on press (`:212-218`).

## Empty state

- **Guest variant: NOT MEASURED.** The browser context already carried a Supabase session cookie for the seed owner account (`hiroseseiju@proton.me`, rendering as "QA Test"), so `isLoggedIn` was true and the logged-in branch rendered. Nothing in this folder describes `GuestBookingForm`.
- **Complete variant: NOT MEASURED.** The profile had a name and no usable phone.
- **`contactLoaded` false:** the whole block is absent while the profile fetch is in flight (`:516`), so the screen renders with a gap between the price card and the payment options. Not measured; the fetch resolved before settle.

## Provenance

- Mockup 28/28b, owner-approved 2026-06-12 , the summary-row-when-complete pattern
- SP-1 , the guest contact form, rebuilt to the review-and-confirm mockup as fields-only with a single commit
- Design contract, focus , white fill, 1px resting line, no halo, and the accepted WCAG 2.4.7 cost
- Design contract, input , height 48, radius 12
