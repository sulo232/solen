# Uber current design: colour, elevation, radius, type, motion (research, 2026-10-04)

Scope: what Uber publishes. Read this first: the Base design system site (base.uber.com) is a JavaScript app. Direct fetches return only a heading. The page text below came from search-engine summaries of those pages (labelled "BASE-DOC via search summary"). The exact token values came from Uber's MIT-licensed open-source Base Web repo (labelled "BASE-WEB code"), which is Uber's web component library. It is a primary source for the token system, but it is NOT the iOS/Android consumer app. Nothing found describes the 2024-2026 consumer-app redesign's colour and shadow decisions. See section 7.

Evidence labels: VERIFIED = read in the primary source. SUMMARY = primary page, read through a search summary only. SECONDARY = third-party. UNVERIFIED = not found.

## 1. Colour

Structure (VERIFIED, BASE-WEB code `src/themes/light-theme/color-semantic-tokens.ts`, https://github.com/uber/baseweb/blob/master/src/themes/light-theme/color-semantic-tokens.ts):
- Greys come in three families: Background, Content, Border (SUMMARY, https://base.uber.com/6d2425e9f/p/33fa5e-design-tokens).
- `backgroundPrimary` = white, `backgroundSecondary` = gray50, `backgroundTertiary` = gray100, `backgroundInversePrimary` = black.
- `contentPrimary` = black, `contentSecondary` = gray800, `contentTertiary` = gray700.
- `borderOpaque` = gray50, `borderTransparent` = black at 8%, `borderSelected` = black (primaryA).

Primitive hex values (VERIFIED, https://github.com/uber/baseweb/blob/master/src/tokens/color-primitive-tokens.ts):
| Token | Hex |
|---|---|
| white / black | #FFFFFF / #000000 |
| gray50 | #F3F3F3 |
| gray100 | #E8E8E8 |
| gray200 | #DDDDDD |
| gray300 | #C6C6C6 |
| gray400 | #A6A6A6 |
| gray500 | #868686 |
| gray600 | #727272 |
| gray700 | #5E5E5E |
| gray800 | #4B4B4B |
| gray900 | #282828 |
| blue600 (accent) | #276EF1 (blue50 #EFF4FE, blue100 #DEE9FE, blue700 #175BCC) |
| red600 (negative) | #DE1135 (red50 #FFF0EE, red700 #BB032A) |
| green600 (positive) | #0E8345 (green50 #EAF6ED, green700 #166C3B) |
| yellow600 (warning content) | #9F6402 (yellow50 #FDF2DC, yellow300 #F6BC2F, yellow400 #D79900) |
| orange600 | #C54600 |
| platinum400 | #8EA3AD |
| cobalt400 | #0E1FC1 |

Older foundation ramp, still in the repo (VERIFIED, `color-foundation-tokens.ts`): primary50 #F6F6F6, primary100 #EEEEEE, primary200 #E2E2E2, primary300 #CBCBCB, primary400 #AFAFAF, primary500 #6B6B6B, primary600 #545454, primary700 #333333, accent400 #276EF1, negative400 #E11900. Two grey ramps coexist, so quote the grey token name, not just the hex.

Semantic accent roles (VERIFIED, color-semantic-tokens.ts). Each colour has a solid `background*`, a pale `background*Light` tint, a `content*` text colour and a `border*`:
- accent = blue: `backgroundAccent`, `backgroundAccentLight` (blue50), `contentAccent` (blue600).
- positive = green: `backgroundPositive`, `backgroundPositiveLight` (green50), `contentPositive` (green600).
- negative = red: `backgroundNegative`, `backgroundNegativeLight` (red50), `contentNegative` (red600).
- warning = yellow: `backgroundWarningLight` (yellow50), `contentWarning` (yellow600).
- Semantic names say what a colour marks: status and feedback (positive, negative, warning, info). The code does not say green marks social proof or red marks promo. That reading is UNVERIFIED.

Program colours (VERIFIED, same file, "Programs" block):
- `membership` = yellow600 #9F6402. This is a dark amber, not a bright gold. The app's actual Uber One gold is UNVERIFIED.
- `eatsGreen400` = green600 #0E8345; `safety` = blue600; `freightBlue400` = cobalt400 #0E1FC1.
- `rewardsTier1` = blue600, `rewardsTier2` = yellow300 #F6BC2F, `rewardsTier3` = platinum400 #8EA3AD, `rewardsTier4` = black.

Tags (VERIFIED, same file): tag colour families are gray, red, orange, green, blue, purple and others. Each has a Primary (solid) and a Secondary (pale fill with coloured text) variant. Example: red secondary = red50 background plus red700 text. This is the likely home of pastel promo and discount pills.

Components (VERIFIED, https://github.com/uber/baseweb/blob/master/src/themes/light-theme/color-component-tokens.ts):
- Primary button = black fill, white text.
- Secondary button = gray50 (#F3F3F3) fill, black text. Hover gray200, pressed gray300.
- Secondary button SELECTED = black fill, white text.
- Tertiary button = transparent.
- Outline button border = `borderOpaque`.
- Spinner foreground = accent blue.
- Bottom navigation text = gray600 (#727272); selected = black (`contentPrimary`).
- Banners have pale "Low" and solid "High" variants for info, negative, positive and warning.
- Calendar selected day = black fill, white text.

Stated rule (SECONDARY, https://superdesign.dev/blog/uber-design-system): "one solid-black button per view", blue accent about once per screen. This is a reverse-engineered web teardown, not Uber's text.

## 2. Elevation

Shadow tokens (VERIFIED, https://github.com/uber/baseweb/blob/master/src/themes/shared/lighting.ts):
| Token | Value |
|---|---|
| shadow400 | 0 1px 4px hsla(0,0%,0%,0.16) |
| shadow500 | 0 2px 8px hsla(0,0%,0%,0.16) |
| shadow600 | 0 4px 16px hsla(0,0%,0%,0.16) |
| shadow700 | 0 8px 24px hsla(0,0%,0%,0.16) |
| shallowAbove | 0px -4px 16px rgba(0,0,0,0.12) |
| shallowBelow | 0px 4px 16px rgba(0,0,0,0.12) |
| deepAbove | 0px -16px 48px rgba(0,0,0,0.22) |
| deepBelow | 0px 16px 48px rgba(0,0,0,0.22) |
| overlay100..600 | inset black wash, 4% to 24% (press and hover tint, not a shadow) |

Last commit touching lighting.ts: 2022-07-14 (GitHub commits API). So these values predate the 2024-26 app look. Whether the app still uses them is UNVERIFIED.

When to use a shadow (SUMMARY, https://base.uber.com/6d2425e9f/p/595594-elevation):
- "Elevation provides cues about the surface depth and stacking order." It appears as a shadow.
- Listed use cases:
  - elements placed on top of a map
  - a sheet over a map
  - a dialog over a screen
  - a snackbar over content
  - a button dock with content scrolling behind it
  - an interactive component
  - a component being dragged or lifted
- Shallow shadows suit most cases:
  - "shallow above" for sheet headers, full-screen modals and overflow button docks
  - "shallow below" for dialogs, menus, popovers and date pickers
- Deep shadows are for tooltips and snackbars.
- Best practice: use a shadow only when a component is elevated above the main surface. Do NOT use shadows to define boundaries; use colour or borders instead.

Resulting rule (my synthesis of the two items above, not a quote): rows, lists, cards on white and section containers stay flat and are separated by hairlines or grey fills. Anything that sits above other content (over a map, over scrolling content, docked, lifted or dragged) gets a shadow. This matches the owner's "shadows in some parts and not in others". The page does not name the floating tab bar or the add-on-image button. Those are UNVERIFIED.

Web marketing site, measured (SECONDARY, https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/uber/DESIGN.md, reverse-engineered from uber.com web pages, not the app):
- 0 4px 16px at 12%.
- 0 4px 16px at 16% on form cards.
- 0 2px 8px at 16% on "pill-float" white pills.
These match the shadow tokens above (shadow600 and shadow500).

## 3. Radius, borders, filled surfaces, selected states

Radius, Base doc "Corner radius 1.0" (SUMMARY, https://base.uber.com/6d2425e9f/p/652959-corner-radius):
- 16 for large containers (sheets, dialogs).
- 12 default, for medium components (cards, snackbars).
- 8 for components inside others (buttons).
- 4 for small components (tags).
- 999 is the pill value.
- Containers may change radius together with scale during motion.

Base Web code (VERIFIED, https://github.com/uber/baseweb/blob/master/src/themes/shared/borders.ts):
- radius100 2px, radius200 4px, radius300 8px, radius400 12px, radius500 16px.
- buttonBorderRadius 8px, inputBorderRadius 8px, popoverBorderRadius 8px, tagBorderRadius 24px, surfaceBorderRadius 0px.
- Defaults are not the app's. Web marketing pill buttons at 999 are SECONDARY (DESIGN.md above).

Borders (VERIFIED, borders.ts): hairline 1px solid, in six alpha steps: border100 black at 4%, 200 at 8%, 300 at 12%, 400 at 16%, 500 at 20%, 600 at 24%. `borderTransparent` is 8%.

Filled grey surfaces (VERIFIED): `buttonSecondaryFill` = `backgroundSecondary` = gray50 #F3F3F3. This is the grey fill for secondary buttons. For chips, see Tag tokens: `tagGrayBackgroundSecondary` = gray50, with border gray100. The owner's #F3F3F3 inputs and chips match the gray50 token. Input fill colour is not read in this research (UNVERIFIED).

Selected states (VERIFIED): secondary and calendar selected = black fill with white text (`buttonSecondarySelectedFill` = `backgroundInversePrimary`). `borderSelected` = black. Tag gray selected border = gray600.

Spacing/sizing (VERIFIED, https://github.com/uber/baseweb/blob/master/src/themes/shared/sizing.ts): scale 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 96, 128 px. SUMMARY says a 4px grid.

## 4. Typography

- Families (VERIFIED, https://github.com/uber/baseweb/blob/master/src/themes/shared/typography.ts):
  - primary = `UberMoveText`, falling back to system-ui, Helvetica Neue.
  - secondary (display) = `UberMove`.
  - mono = `UberMoveMono`.
- Base doc (SUMMARY, https://base.uber.com/6d2425e9f/v/0/p/976582-typography/b/98142c):
  - Uber Move has three cuts: Display, Text, Mono.
  - Mono is for money and number use.
  - Roles: Display, Heading, Label, Paragraph.
  - Modular scale from a 14 base, multiplied by 1.125 per step ("major second").
  - Line height is size x 1.45, rounded to the nearest 4.
- Base Web scale (VERIFIED, typography.ts):
  - Text cuts, regular and Medium 500, with sizes 12/14/16/18 and line heights 16/20/24/28.
  - Display cuts, weight 700: 20/28, 24/32, 28/36, 32/40, 36/44, 40/52, 44/52, 52/64, 96.
  - Two weights in practice: 400 or 500 for UI text, 700 for headings.
- Uber Move is proprietary. A closest free pairing is Inter family. This is my judgment, not from Uber.

## 5. Motion

- Principles (SUMMARY, https://base.uber.com/6d2425e9f/p/116184-motion): motion is purposeful (feedback, orient, simplify, draw attention). It is "Bold, Direct, with Heart". Users can minimise it.
- Tokens (VERIFIED, https://github.com/uber/baseweb/blob/master/src/themes/shared/animation.ts):
  - Durations: timing100 100ms, 200, 300, 400, 500 ... up to 7000ms.
  - easeDecelerate cubic-bezier(0.22, 1, 0.36, 1) is for entering elements.
  - easeAccelerate cubic-bezier(0.64, 0, 0.78, 0) is for exiting elements.
  - easeAccelerateDecelerate cubic-bezier(0.83, 0, 0.17, 1) is "a good default for most motion".
  - easeLinear is for opacity and colour.

## 6. What changed over time (dated)

- 2019-09: first consolidated Rides + Eats app, pared-back grid home. SECONDARY, https://www.itsnicethat.com/news/uber-redesign-digital-270919 (headline and search summary only; page not read).
- 2022-07-14: last change to the shadow tokens file (GitHub commits API). Shadows are old tokens; the "modern" look is mostly about where they are applied (inference).
- 2023-02-22: Uber newsroom redesign announcement (VERIFIED, https://www.uber.com/us/en/newsroom/were-redesigning-the-uber-app-just-for-you/). It covers a simplified home, a Services tab, an Activity Hub, and Live Activities and Dynamic Island. It makes no colour, shadow or elevation statement.
- 2023-02-02: ActionCard post (VERIFIED, https://www.uber.com/blog/developing-the-actioncard-design-pattern/). It is built on BaseUI components. Nothing visual.
- 2026-02-09: Base Web last commit seen, adds Checkbox-v2 and Switch (GitHub API).
- 2026-04-29: GO-GET 2026 (VERIFIED, https://www.uber.com/us/en/newsroom/go-get-2026/). The "Where to?" bar is redesigned, Services tab, Travel Mode. Again no colour or shadow statement.
- 2026-10-02: Base doc site version "10.02.26" (VERIFIED, `window.styleguideDetails` in the page HTML).
- The Base site refers to "Base 2.0" as the next evolution (SUMMARY, https://base.uber.com/6d2425e9f/p/93825b-welcome-to-base). Its contents could not be read.
- Pre-2023 "flat black-and-white" Base: the 2018 Base look. No dated primary source for the older flat look was retrieved in this run.

## 7. UNVERIFIED (searched and not found)

- Any Uber-published statement of WHY the app now uses more colour or selective shadows. Searched: Uber Design Medium, Uber newsroom, Uber blog, base.uber.com summaries. The Medium post "Designing the new Uber App" returned HTTP 403.
- The floating bottom tab bar: Base Web's `bottomNavigationText` token exists, but no source describes it as floating or shadowed.
- Any link to Apple iOS 26 Liquid Glass (searched; no hit).
- App-level hex for Uber One gold, promo red, "social proof" green. Only the generic semantic tokens above exist.
- Colour-page text on base.uber.com (restricted or JS-only), the Base 2.0 content, the Sheet, Tabs and Button group page details.
- What would settle it: render base.uber.com pages in a real browser (Chrome tool or Playwright) and read Elevation, Color, Shape, Bottom navigation and Base 2.0. Or sample the owner's own screenshots in `/Users/sulo/Documents/solen/_design-system/references/uber-app-2026-10/raw/` with `pixel-spec-auto`, which is the strongest evidence of the real current app. This run did not examine them.

## 8. Takeaways for Solen (labelled: my judgment unless a source is named)

1. Base's own rule matches the owner's observation: flat by default, and shadow only for a surface lifted above others. Shadow must not be the border (Base doc, SUMMARY).
2. Colour is semantic and sparse: a neutral base, with green, red, amber and blue used as status and promo roles, each with a pale tint plus a text colour (BASE-WEB code).
3. Neutral fills: #F3F3F3 for secondary buttons and chips, black for selected, and 1px black-alpha hairlines (BASE-WEB code).
4. Verify against the real app screenshots before adopting any value that is not a quoted token.
