# Round-3 kit

Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits, none
of them a kit/systems/component module (they cover the TRAY look system, the home A/B/C
directions, the empty-state directions, the search heading line, the review count, the round-2
index's kit-preview switcher block, and the salon-book-button harness, all owner-rejected on
2026-09-06, see `_design-system/REMOVED.md`). No existing round-3 kit or systems module. This
folder does not build a new kit: it re-exports the round-2 kit
(`app/[locale]/dev/directions-0905-r2/_kit/index.ts`), which this same turn was extended to carry
the three round-3 candidates. See that folder's own `README.md` for the full component list
(Pill, Card, StatusBadge, PrimaryButton, SecondaryButton, TextLink, SectionTitle, Meta, Price,
tokens, systems); this file documents only what round 3 added on top of it.

A round-3 screen imports from `"../_kit"` (this file), never reaches into
`directions-0905-r2/_kit` directly, and never hand-rolls a second Pill/Card/StatusBadge.

## The three candidates

Full value sheets: `_plans/R3_ONE_SYSTEM.md`. Root causes each candidate answers:
`ROOT_CAUSES.md` Part 1 (the arbiter's diagnosis) and Part 3 (the per-screen fix list).

| axis | Candidate A, RULE refined | Candidate B, LIFT refined | Candidate C, the Airbnb port |
|---|---|---|---|
| `<KitProvider system="...">` | `"a"` | `"b"` | `"c"` |
| Container | none; inset hairlines + gap only, one named entity-card exception | one white card per RECORD, no card for a destination list | card per record; flat when it carries a photo, ambient shadow ("rail") when it does not |
| Card radius | 16px entity (`RADIUS.entityCardPx`) | 16px entity/photo, 24px grouped | 20px everywhere (`RADIUS.c.cardPx`), a fourth radius family |
| Card edge rule | static (system delta only) | `<Card hasPhoto={...}>`: photo -> shadow, no border; no photo -> hairline, no shadow | `<Card hasPhoto={...}>`: photo -> flat (no border, no shadow); no photo -> `SHADOW_RAIL_C` ambient shadow |
| Pill / chip | 9999px capsule, calm-grey selected (`selectionMode: "grey"`, unchanged from round 2) | identical to A | 24px chip (`RADIUS.c.pillPx`), white fill + ink text in BOTH states, selection changes ONLY the border colour (`selectionMode: "borderOnly"`) |
| Primary button | 9999px capsule, 52px tall, ink fill (unchanged) | identical to A | 12px rounded rect (`RADIUS.c.ctaPx`), 44px tall (`RADIUS.c.ctaHeightPx`, ported from Airbnb's 40px, refused under the 44px touch floor), ink fill |
| Secondary button | 9999px capsule, 50px tall, white + hairline outline | identical to A, rendered inside the card it belongs to | 12px rounded rect, 44px tall, neutral tray fill (`secondaryFill: "neutralFill"`, PICK per the sheet's own "hex not measured" note), no border |
| Status badge | pastel bg + ink text + saturated icon (`treatment: "pastel"`, unchanged) | identical to A | neutral: same shape and icon, tray fill + ink icon, colour never encodes state (`treatment: "neutral"`) |
| Hero photo | full-bleed, radius 0, outside any card | inset inside a card | inside a card, 20px radius |
| Over-photo control | not a Candidate A row | not a Candidate B row | 40x40 frosted circle (back/share, `lib/frost-glass.ts` FROST_GLASS) + a separate 32x32 `rgba(0,0,0,0.5)`-fill/white-stroke circle for the save heart (`OVER_PHOTO_CONTROL_C`) |
| Map / mode toggle pill | not a Candidate A row | not a Candidate B row | solid ink fill, radius 24px, 93px wide, white text, height ported from Airbnb's measured 38px to the 44px touch floor (`MODE_TOGGLE_PILL_C`) |

## What round 3 added to the round-2 kit (files touched, not created, unless noted)

- `tokens.ts`: `RADIUS.c` (pillPx 24, ctaPx 12, cardPx 20, ctaHeightPx 44), `TIMING_PILL` (the
  on-photo pill's ratios), `CHROME_HAIRLINE_C`, `SHADOW_RAIL_C`,
  `SECONDARY_BUTTON_FILL_C_PICK_NOTE`, `OVER_PHOTO_CONTROL_C` (Candidate C's over-photo controls,
  rows 27/29/28), `MODE_TOGGLE_PILL_C` (Candidate C's map/mode toggle pill, row 22).
- `systems.ts`: `SystemKey` extended to `"lift" | "rule" | "tray" | "a" | "b" | "c"`; `CandidateKey`,
  `isCandidateKey()`; `CandidateSpec` / `CandidatePillSpec` / `CandidateButtonSpec` /
  `CandidateStatusSpec` / `CandidateOverPhotoControlSpec` / `CandidateModeTogglePillSpec` types;
  `CardDelta.photoAware`; three new `SYSTEMS` entries (`a`, `b`, `c`), each carrying a `candidate`
  field the lift/rule/tray entries do not have. `overPhotoControl` and `modeTogglePill` are set
  only on candidate `c`'s `candidate` object, since Candidate A and B's own sheet tables carry no
  equivalent row (left `undefined` there, not zero-valued).
- `Card.tsx`: new `hasPhoto?: boolean` prop, read only when the active system's `photoAware`
  delta is true; resolves the two candidates' different photo-edge rules; radius switches to
  `RADIUS.c.cardPx` under candidate C.
- `Pill.tsx`, `PrimaryButton.tsx`, `SecondaryButton.tsx`: each now reads `useSystem().candidate`
  and branches ONLY for candidate C's differing shape; A, B, lift, rule and tray all render
  through the exact code path that already shipped, unchanged.
- `StatusBadge.tsx`: new `treatment?: "pastel" | "neutral"` prop (default `"pastel"`, unchanged
  behaviour for every existing caller). Confirmed-status icon colour was already `#16A34A`
  (`COLOR.success.DEFAULT`) before this round; ROOT_CAUSES.md Part 3.1 item 6's fix was already
  live in this shared component.
- `TimingPill.tsx` (new file): the on-photo relative-timing badge (ROOT_CAUSES.md Part 3.3 item
  2). Composed from `StatusBadge`'s shape family, positioned by ratio off the caller's real
  `photoWidthPx` so it scales with any card width, never hardcoding one photo size.
- `DateLine.tsx` (new file): a bookings card's date + time as ONE 14px/500 ink run
  (ROOT_CAUSES.md Part 3.3 item 3).
- `index.ts` (round 2): now also re-exports `TimingPill` and `DateLine`.

## What did NOT change

Every lift/rule/tray call site keeps rendering byte-for-byte what it did before this turn: the
`candidate` field is `undefined` on those three `SYSTEMS` entries, so every new branch in
Pill/PrimaryButton/SecondaryButton/Card/StatusBadge takes its original, unmodified path. Verified
live: `http://127.0.0.1:3461/en/dev/directions-0905-r2/payment-step?s=lift` after every edit in
this round (see the coder's closing report for the measured confirmation).
