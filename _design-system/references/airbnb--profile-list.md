<!-- exists-check: net-new. `_design-system/references/` has two prior captures
     (airbnb--category-switch.md, airbnb--home-search-chrome.md), neither covers the profile/
     account settings list-row anatomy. This is the third file in that directory. -->

# Airbnb , profile / account settings list rows (phone)

Captured from five screenshots the owner supplied at `~/Downloads/IMG_6900.PNG` through
`IMG_6904.PNG`, all shot on the same iPhone within 22:22:xx to 22:23:xx on the same day (EXIF/
filename timestamps agree). This is a MEASUREMENT file only, per the task: no product code was
touched, no mockup was built. It exists to feed `_plans/DESIGN_SYSTEM_RENEWAL_2026-08-02.md`
item A1.

## Scale factor, verified per image, not assumed

All five files are **1206 x 2622px**, confirmed individually with PIL (`Image.open(path).size`)
before any measurement, not inferred from one file and applied to the rest. 1206/2622 divides
evenly into a 402 x 874pt logical canvas at exactly 3.0x (1206/402 = 3.0, 2622/874 = 3.0, both
exact, no remainder). That logical size matches the iPhone 16 Pro (402 x 874pt @3x), and it is
consistent across all five, so **scale = 3.0** is used for every conversion below. Every "measured
px" value in this file can be divided by 3 to get device points; both are shown so the arithmetic
is checkable.

`pixel-spec-auto/scripts/extract.py` was run on all five first, per the binary-trigger rule. It
failed on all five (`FAILURE: could not detect a card structure`) because these rows are
borderless , there is no card edge for the auto-detector's white-rectangle walk to lock onto. That
failure is expected and is itself a finding (see "The box goes" below). Every number after this
point comes from direct PIL pixel-sampling: dark-pixel row/column bands for text and icon glyphs,
uniform-grey-band scans for divider hairlines, and RGB sampling at specific coordinates for fill
colours. Method is named next to each number.

---

## IMG_6900 , Airbnb Profile tab (root), scrolled mid-way

Bottom tab bar visible (Explore / Wishlists / Trips / Messages / Profile, Profile active in red).
Top chrome: "Profile" title + one circular bell icon, nothing else. A "Become a host" promo card
(bordered/shadowed, the one card on this screen), then two row-groups: **group 1** (Account
settings, Get help, View profile, Privacy) and **group 2** (Refer a host, Find a co-host, Legal,
Log out).

**measured:**

| what | value | method |
|---|---|---|
| top chrome clusters | exactly 2: "Profile" title (x 76-259px) and one bell icon (x 1077-1118px) | dark-pixel (<150) column-cluster scan, y 200-330px. No third cluster , **no hamburger/menu icon anywhere in this row** |
| bell icon circle bg | ~#F1F1F1 (241,241,241) | RGB sample at (270,1120) |
| row pitch (chevron-top to chevron-top, within a group) | 168px = **56.0pt** exactly, 3 consecutive gaps all 168px (905→1073→1241→1409) | chevron is the same glyph copy every row; its y-top is the cleanest repeat signal. Column scan x 1085-1140 per row band |
| row pitch, crossing the group boundary (Privacy → Refer a host) | 267px = 89.0pt (vs 168px normal) | same chevron-top method, 1409→1676 |
| divider between the two groups | **1 divider, y 1557-1559px (3px thick = 1.0pt), color #EBEBEB (235,235,235) flat, x 72-1133px (24.0pt inset both sides)** | uniform-grey band scan (threshold 200-245, std<3) across the 1456-1672px gap |
| divider WITHIN a group (any adjacent pair, e.g. Account settings → Get help) | **zero.** 0 non-white pixels in the 955-1054px gap across the full row width | direct pixel scan, threshold <253 |
| icon left ink-edge | 72-88px (24.0-29.3pt), varies by glyph | column-cluster per row |
| icon ink bbox (varies by glyph, no fixed box) | e.g. Account settings gear 76-139px wide (63px=21.0pt) x 887-954 tall (67px=22.3pt); Privacy hand 79-132px wide (53px=17.7pt) | dark-pixel bbox per row, isolated icon column vs text column |
| icon tile / background fill behind icon | **none.** Light-pixel stats in the 40px margin around the gear icon: min RGB (201,201,201) [antialiasing edge only], mean (254.2,254.2,254.2) , i.e. bare white, no grey square | box sample arr[875:965, 40:170], filtered to pixels >200 |
| label left inset (text start, all rows) | 193-196px = **64.3-65.3pt** | column-cluster, second cluster start |
| chevron bbox | x 1103-1122px (19px=6.3pt wide), height 38px=12.7pt, present on every row **except "Log out"** (no chevron , it's an action, not a navigation) | dark-pixel bbox in x 1085-1140 per row |
| chevron right ink-inset from screen edge | 1206-1122 = 84px = 28.0pt | arithmetic from bbox above |
| "Become a host" card | soft shadow, no hairline border found (nonwhite pixels span nearly the full row width at low intensity, consistent with a diffuse drop-shadow, not a stroked edge) | horizontal scans at y=480/620/795 across full width |

---

## IMG_6901 , Account settings, scrolled to top

Back button (grey circle) + large expanded title "Account settings" + a light-grey "Confirm your
email address" banner card (envelope icon, title, subline, full-width white "Confirm email"
button) + the start of the row list (Personal information → Travel for work, cut off before
Accessibility).

**measured:**

| what | value | method |
|---|---|---|
| back button circle | diameter 119px = **39.7pt** (≈40pt), bg #F2F2F2 (242,242,242), arrow glyph ink 42x37px (14.0x12.3pt) inside it | nonwhite bbox in y150-350/x0-260; RGB sample inside the ring away from the arrow stroke |
| page title "Account settings" (expanded state) | x 74-800px, y 399-490px, height 92px = 30.7pt (no descenders in this string, so this is close to ascender-top-to-baseline) | dark-pixel bbox, y380-500/x0-900 |
| banner card | bbox x 72-1133px, y 570-959px → **1061 x 389px = 353.7 x 129.7pt**; left/right inset from screen edge = 72px / 73px = **24.0 / 24.3pt** (same margin used everywhere else on this screen) | grey-band (240-253) bbox scan; corner curve stabilizes by dy≈48px from the top edge, so radius ≈ 48-55px = **16-18pt** |
| banner envelope icon | 68x58px = **22.7 x 19.3pt**, bare (no tile) | dark-pixel bbox, x90-225/y600-700, refined to avoid title-text bleed |
| banner title "Confirm your email address" | x230-841, y628-673, h=46px=15.3pt (has no descenders) | dark-pixel bbox |
| banner subline "We'll send a code to your inbox." | x230-834, y701-740, h=40px=13.3pt (includes 'y' descender in "your") | grey-threshold (80-170) bbox, since this text is mid-grey not full black |
| X close icon | x1044-1079, y624-659 | dark-pixel bbox, x1000-1120/y600-700 |
| "Confirm email" button pill | white pill inside the grey banner, x120-1085/y792-899 (16pt inset from banner edge both sides) | white-pixel (>253) bbox restricted to inside the banner |
| **row pitch (chevron-top to chevron-top)** | **168px = 56.0pt exactly, 9 consecutive rows, zero deviation** (1100→1268→1436→1604→1772→1940→2108→2276→2444, all deltas = 168) | column-cluster + dark-pixel bbox on the chevron cluster, 9 rows |
| divider between rows | **zero**, confirmed by direct scan: 12 nonwhite px out of 116,480 in the Personal-information→Login gap (that's antialiasing bleed off the row above, not a line: min value 212, no full-width uniform band) | pixel scan, threshold <254, full row-width gap |
| icon left ink-edge | 74-80px (24.7-26.7pt), varies by glyph (Payments/Translation/Booking/Travel all start at 74px; Personal info/Login&security/Privacy/Taxes at 79-80px) | column-cluster per row, 9 rows |
| icon ink bbox height | 52-68px (17.3-22.7pt), varies by glyph (Personal info person=52px, Login&security shield=68px, Notifications bell=68px, Payments wallet=54px) | isolated icon-column y-extent per row |
| icon stroke width | 4px = **1.33pt**, measured on the phone-icon's vertical wall (see IMG_6904 device row, same icon family/weight) | horizontal cross-section run-length count |
| text left inset (after icon) | 194-196px = **64.7-65.3pt**, i.e. the icon+gap "slot" is ~117-122px (39.0-40.7pt) even though ink varies, meaning rows are laid out on a fixed icon-column width, not a fixed icon SIZE | column-cluster, second cluster start, 9 rows |
| row label size | cap-height on a clean (no-ascender/descender) sample, "Taxes": 35px = **11.7pt** | dark-pixel bbox, x194-1000/y-per-row, "Taxes" chosen because T-a-x-e-s has no descenders and no tall lowercase ascenders |
| row label stroke width | mean run-length 4.76px across "Personal information" mid-stroke scan | horizontal run-length histogram, y=1115, x196-645 |
| chevron bbox | x1103-1122px (19px=6.3pt), height 38px=12.7pt, identical across all 9 rows | dark-pixel bbox, x1090-1140 per row |
| chevron right ink-inset | 1206-1122=84px=**28.0pt** | arithmetic |
| subline under any row label | **none on any of the 9 rows** | visual + absence of a second dark-pixel band between each label's bottom and the next row's icon top |

---

## IMG_6902 , Account settings, scrolled down (collapsed header)

Same screen as IMG_6901, scrolled further: the expanded title has collapsed into the nav bar
(centred, smaller, inline with the back button , the standard iOS large-title collapse), list
continues to "Accessibility" (the 10th and last row), then **one** divider, then a
"Version 26.30 (204816)" footer caption.

**measured:**

| what | value | method |
|---|---|---|
| row pitch, confirmed again | 168px = 56.0pt, still exact across all 10 chevron-tops on this scroll position (617→785→953→1121→1289→1457→1625→1793→1961→2129) | same chevron-top method as 6901, cross-scroll-position sanity check |
| divider before the footer | **1 divider**, y2301-2303px (3px=1.0pt), color **#EBEBEB (235,235,235)**, x72-1133px (24.0/24.3pt inset, same margin as everywhere else) | uniform-grey band scan |
| divider within the row list | **zero** (same as 6901, re-confirmed at this scroll position) | pixel scan |
| gap: last row (Accessibility) chevron-bottom → divider | 2301-2166 = 135px = **45.0pt** | arithmetic from measured bands |
| gap: divider → footer text top | 2433-2303 = 130px = **43.3pt** | arithmetic |
| footer text "Version 26.30 (204816)" | x73-444, y2433-2465, h=33px=**11.0pt**, color #6A6A6A (106,106,106) | grey-threshold (80-190) bbox + RGB sample |

---

## IMG_6903 , Login & security, WITH a cookie-consent modal open

Same page as IMG_6904 (below), but a bottom sheet is covering most of the content: "Help us
improve your experience" title, a paragraph, an underlined "Airbnb cookie policy" inline link, two
full-width black pill buttons ("Accept all", "Only necessary"), and an underlined "Manage
preferences" link below them. This is a **web cookie-consent pattern** riding on top of a native
screen (Airbnb's login/security page embeds a web view or the whole app is hybrid here) , it is
not part of the row-list anatomy and is out of scope for the row-anatomy deliverable, so it was
not pixel-measured in the same depth. What IS visible behind the sheet (top sliver of "Passkeys" +
"Add") matches IMG_6904 exactly, confirming both screenshots are the same underlying screen at
different modal/scroll states, not two different pages.

**measured (light touch, this screen not prioritized per task scope):**

| what | value | method |
|---|---|---|
| screen dimensions confirmed | 1206x2622, same device | `Image.size` |
| black pill buttons present | 2 stacked, full-bleed within the sheet | visual, not pixel-boxed (see NOT MEASURED) |

---

## IMG_6904 , Login & security, full detail (no modal)

The richest of the five for row anatomy because it is a **structurally different row style** from
IMG_6900/6901/6902's icon-led navigation list. Header "Login & security" (expanded), a two-tab
strip ("Login" active / "Shared access" inactive) with an active-tab underline, then three
sections each opened by a bold section-header + divider: **Login** (Passkeys row, Password row),
**Device history** (one iOS device row, the only row here with an icon), **Account** (Account
deactivation row, cut off at the image bottom).

**measured:**

| what | value | method |
|---|---|---|
| page title "Login & security" (expanded) | x78-673, y404-483, full-string height 80px=26.7pt (includes 'g' and 'y' descenders); isolated capital "L" alone: y407-466, height **60px = 20.0pt** | dark-pixel bbox, whole string then isolated first glyph |
| **title-size discrepancy, flagged not smoothed over** | IMG_6901's "Account settings" title measures 92px/68px-isolated-"A"=68px=22.7pt cap on the "A" vs this screen's isolated "L"=60px=20.0pt. Both are expanded-state page titles, same apparent visual role, yet measure 12-13% apart even after isolating single capital letters to rule out descender contamination. **This is a real measured difference, not reconciled to one number** , possibly Airbnb's own title component isn't pixel-identical across settings sub-pages, or there's a subtitle-length-driven dynamic sizing rule this capture doesn't reveal. Reported as-is. | side-by-side isolated-glyph bbox comparison |
| tab labels | "Login" (active) x75-183, "Shared access" (inactive) x285-581 | column-cluster, y601-644 |
| active tab ink color | #222222 (34,34,34) | RGB sample |
| inactive tab ink color | mean ~#818181 (129,129,129) over the glyph strokes (anti-aliased average, not a pure stroke sample) | mean of sub-240 pixels in the glyph region |
| active-tab underline | x72-188px (116px=38.7pt wide, matches the "Login" label's own width, not the full tab-strip), thickness 9px=**3.0pt**, y672-680 | dark-pixel bbox |
| tab-strip baseline (the full-width track under BOTH tabs) | y681-683 (3px=1.0pt), color **#DDDDDD (221,221,221)** , NOT the same shade as the row dividers below (#EBEBEB) | uniform-grey scan |
| section-header dividers (below "Login", below "Device history", below "Account") | all 3 measured: y961-962 / 1800-1801 / 2431-2432, all 3px=1.0pt, all **#EBEBEB (235,235,235)**, all x72-1133 (24.0pt inset) | uniform-grey scan |
| **row-to-row dividers, EVERY row, not just between groups** | y1241-1242 (between Passkeys and Password) and y1521-1522 (between Password and the "Device history" header) both measured **#EBEBEB**; y2151-2153 (between the iOS device row and the "Account" header) measured **#DDDDDD**, the same darker shade as the tab baseline. Structurally 1521 and 2152 occupy the identical role (last row of a section → next section header) yet differ in colour. **Reported as measured, not resolved , likely inconsistency in Airbnb's own build rather than a rule I'm missing.** | uniform-grey scan across the full image, all divider instances found this way |
| section header cap-height (clean sample, "Account", no descenders) | 51px = **17.0pt** | dark-pixel bbox |
| section header stroke width | mean run-length 9.0px, y840/x78-330 on "Login" | horizontal run-length histogram |
| Passkeys / Password / Account-deactivation row label left inset | **73-76px = 24.3-25.3pt , flush to the page margin, NOT indented for an icon** (these three rows have no icon) | column-cluster, first cluster start |
| Passkeys / Password / Account-deactivation row label cap-height (clean sample, "Password") | 44px = **14.7pt** , notably larger than the icon-list's row-label cap-height (11.7pt in IMG_6901/6902) | dark-pixel bbox, "Password" chosen for zero descenders |
| right-aligned link ("Add" / "Update" / "Deactivate") | x1045-1133 / x977-1133 / x906-1130 (right-flush to the same 24pt margin as the chevrons elsewhere), ink color **#222222 (34,34,34 min sample), i.e. BLACK, underlined , not blue** | column-cluster + RGB sample on dark pixels within the "Add" bbox |
| row subline (all 3 text-only rows carry one) | Passkeys: "Use your fingerprint, face, or passcode." x75-873/y1121-1162; Password: "Last updated a year ago" x76-563/y1401-1442 | column-cluster |
| device-history row (the ONE row with an icon in this list) | icon x91-142/y1931-1999 = **52x69px = 17.3x23.0pt**; label "iOS" starts x200 (not x75, confirming the icon pushes text over exactly like the other list's ~65pt text-inset); "CURRENT SESSION" grey pill badge x220-490; subline "Basel, Basel-City · July 21, 2025 at 14:57" x202-984/y2032-2073 | column-cluster + isolated icon bbox |
| device-history icon tile check | **none.** Light-pixel stats in the surrounding box: min (203,203,203) [antialiasing only], mean (254.9,254.9,254.9) , bare white, third confirmation across the five screenshots (Profile-root icons, Account-settings icons, this device icon) | box sample, filtered >200 |
| device-history icon stroke width | 4px = **1.33pt** (left and right vertical wall of the phone body, measured via horizontal cross-section) | run-length at the icon's vertical mid-point |
| **chevron on this list's rows** | **none.** None of the four rows (Passkeys, Password, iOS device, Account deactivation) has a chevron , navigable rows get a right-aligned text LINK instead, the device-history row (non-interactive, informational) gets neither link nor chevron | visual + absence of a chevron-shaped dark cluster at x1090-1140 in any of these row bands |

---

## Row-anatomy synthesis , two genuinely different recipes, not one

The five screenshots do not show one universal Airbnb row. They show **two**, and conflating them
would misrepresent the reference:

**Recipe A , icon nav list** (IMG_6900's Profile root, IMG_6901/6902's Account settings list):
icon (bare, no tile, ink varies 17-23pt per glyph) at a ~24-27pt left inset, label only (no
subline) at ~65pt inset, cap-height ~11.7pt, chevron at the far right (28pt inset), **56.0pt row
pitch exactly**, **zero divider between rows**, **one #EBEBEB 1pt hairline only where a whole group
ends** (24pt inset both sides, same as the page margin).

**Recipe B , text detail list** (IMG_6904's Login & security body): no icon on 3 of 4 rows (flush
to the 24pt margin instead); label cap-height ~14.7pt (25% bigger than Recipe A); every row carries
a subline; the right-side element is a black underlined text LINK, not a chevron, on navigable
rows; the ONE row with an icon indents to the same ~65pt text inset as Recipe A; **a divider after
literally every row and every section header** (#EBEBEB, 2 of 7 measured instances #DDDDDD,
unresolved per above), each preceded/followed by generous whitespace, not a tight `divide-y`.

Both share: 24.0pt screen margin, #EBEBEB/#DDDDDD as the only divider greys, ~1.3-1.5pt icon
stroke weight, bare (untiled) icons, and a page title that collapses on scroll (large below the
back button at top-of-scroll, small and inline with the back button once scrolled).

---

## vs ours , read live from `app/[locale]/_components/profile/AccountHub.tsx`

Every "ours" value below is quoted directly from that file (read this session, not recalled), not
from the task's provided placeholder numbers, which were stale (the file has since moved past
"15.5px/500, subline 13px, 38x38 tile, `divide-y` between every row" to a `divide-y` +
`border` + `rounded-[24px]` card , confirmed current as of this read).

| axis | ours (AccountHub.tsx, current) | Airbnb Recipe A (nav list) | Airbnb Recipe B (detail list) |
|---|---|---|---|
| container | `RowCard`: `divide-y divide-s-border rounded-[24px] border border-s-border bg-white` , a bordered, rounded, divided BOX around every group | none , rows sit directly on the page background, no card, no border | none , same |
| divider between rows in one group | `divide-y` , every row gets one | **zero** | every row gets one, but the WHOLE group also gets one after the header, unlike Recipe A |
| icon | 38x38px `rounded-[14px] bg-s-bg-sunken` filled tile behind a 19px glyph, `strokeWidth 1.9` | **bare glyph on white, no tile**, ink ~17-23pt, `strokeWidth` ratio measured ~equivalent (~0.077-0.083 of glyph size, i.e. Solen's 1.9 is already close to what's measured here) | bare glyph on white (only 1 of 4 rows has one) |
| row label | `text-[15.5px] font-medium` (15.5px = 15.5pt equiv at 1x web) | cap-height 11.7pt (smaller than ours) | cap-height 14.7pt (close to ours) |
| row subline | `text-[13px] text-s-ink-2`, present on nearly every row | **absent on every row** | present on every row |
| right-side element | `ChevronRight size={18} strokeWidth={1.9}` on every row | chevron (19x38px ink, 12.7pt tall) on every navigable row, absent on the one non-nav row (Log out) | **black underlined text link** ("Add"/"Update"/"Deactivate"), not a chevron, on navigable rows |
| group label ("eyebrow") | `text-[12px] font-semibold text-s-ink-2`, shown above every group | not present on the icon list (rows are ungrouped by any visible label, just whitespace + one end-divider) | present as a large (17.0pt cap, bold) section header, not a small eyebrow |
| row height (computed) | icon 38px + `py-[15px]` top/bottom = 68px min CSS-px row box | **56.0pt exactly**, measured, zero variance across 19 total rows spanning 2 screens | not directly comparable, no fixed pitch since sublines vary row height |
| left inset (icon row) | `px-4` = 16px container pad, icon then `gap-[14px]` to text | icon ink starts ~24-27pt, text starts ~65pt (fixed slot regardless of icon glyph width) | n/a, no icon on 3 of 4 rows |
| left inset (no-icon row) | n/a, ours always has an icon | n/a | **24.3-25.3pt, flush to the page margin** |
| screen margin | `max-w-[560px]` container, `px-5` = 20px | **24.0pt** (banner, divider, and chevron-inset all agree) | 24.0pt, same |

---

## NOT MEASURED

Said plainly, per the task's instruction not to substitute a number for anything unmeasured:

- **IMG_6903's cookie-consent modal**: not pixel-boxed (corner radius, button pill height/radius,
  paragraph type size). It is a web cookie-consent overlay, not part of the row-list anatomy the
  task prioritized, and time was spent on the row anatomy instead. If this modal becomes relevant
  to A8's scope, it needs its own pass.
- **Exact font-weight tokens** (400/500/600/700) for any text on any of the five screens. PIL
  cannot read a font's internal weight axis; every "regular" / "bold" / "medium" characterization
  above is a **stroke-width-to-cap-height ratio comparison** (row label ≈0.125, page title ≈0.12,
  section header ≈0.176), not a confirmed weight value. Treat these as comparative, not absolute.
- **The actual font family.** Airbnb's app almost certainly renders "Airbnb Cereal" or a system
  fallback; this was not identified or verified, only glyph geometry was measured.
- **"Become a host" card's exact corner radius and padding** (IMG_6900). Confirmed it has a soft
  shadow and no hairline border, but did not pixel-box its radius/padding since it is a promo card,
  not a list row.
- **Banner card's exact corner radius** (IMG_6901). Narrowed to 48-55px (16-18pt) via the
  curve-stabilization method but did not pin an exact value; the antialiasing gradient does not
  resolve to a single crisp pixel.
- **"CURRENT SESSION" badge's own box** (IMG_6904 device row): text bbox was measured
  (x220-490) but the pill's own background bounds/radius/padding were not isolated from the
  surrounding phone-icon/subline content.
- **Any interaction/motion state** (row press, chevron tap, tab switch animation). These are
  static screenshots; nothing about transition timing or easing can be measured from them.

---

## ORCHESTRATOR CORRECTION 2026-08-02: the label sizes above are CAP-HEIGHTS, not font sizes

Read line 86 of this file: *"row label size | cap-height on a clean (no-ascender/descender)
sample, 'Taxes': 35px = 11.7pt"*. That is the height of the capital letters, which is roughly
**0.72x** the font size in a humanist sans. So the icon-nav row label is about **16pt**, not 11.7,
and the text-detail label around **20pt**, not 14.7.

**Why this matters more than a rounding quibble.** The owner's complaint that produced this whole
workstream was *"how these texts are so small"*. Our current label is `text-[15.5px]`
(`AccountHub.tsx:232`). Applying 11.7 literally would ship a label SMALLER than the one he
rejected, from a document titled "the reference he likes", and it would look like the measurement
proved him wrong.

**This repo already has a rule for exactly this trap, pointing the other way.** Memory
`feedback_reference_copy_width_calibration` and `_mockups/_BASE.md`: copy a reference's type by
**WORD WIDTH, never glyph height**, because height-matching ships headings ~30% too big. Here the
same confusion runs in reverse and ships them ~30% too small. Either direction, the fix is the
same: **calibrate by rendering the same word at the same weight and matching its measured WIDTH**,
never by matching a glyph's height.

DO NOT build A5 or A7 off the raw cap-height numbers. Word-width calibrate first. Everything else
in this document (row pitch 56.0pt, zero dividers inside a group, one #EBEBEB hairline per
group-end, bare untiled icons, label left inset 64-65pt, no sublines) is a distance or a colour
and is used as measured.
