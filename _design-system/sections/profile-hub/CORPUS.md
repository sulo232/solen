<!-- exists-check: net-new vs _design-system/RESEARCH_METHOD.md (states the METHOD by which research
     is run and tiered, holds no corpus), _rules/SOLEN_PATTERNS.md (the Fresha-to-Solen translation
     playbook for SALON DETAIL, part 4 onward), _plans/motion-audit/PROFILE_LOYALTY_QUEUE.md (a MOTION
     audit of profile surfaces graded against MOTION.md, no cross-app anatomy), and
     docs/audit/fresha-airbnb-solen-audit-part1-5.md (feature checklists that touch profile in 6 single
     rows out of ~500, never the screen's anatomy). The closest real neighbour is
     _design-system/components/ProfileTabs.md, which specs ONE Solen component; this is the cross-app
     corpus that component was never measured against. Follows the salon-detail/ per-section format.
     Governed by RESEARCH_METHOD R2 (claim tiering) and R3 ("could not verify" is a result). -->

# Profile / account hub: corpus research

**Method:** Mobbin sweep, 13 distinct queries, iOS and web run separately.
**Sample:** 164 unique screen results (one screen, Meituan `cdb81652`, returned in two queries).
Across 90 distinct apps: 64 on iOS, 29 on web, with Airbnb, Fresha and Wise appearing on both.
**Solen surfaces this bears on:** `app/[locale]/profile/page.tsx` +
`app/[locale]/_components/profile/ProfileTabs.tsx` (content hub) and
`app/[locale]/profile/settings/page.tsx` (account hub).
**Companion docs:** `_design-system/components/ProfileTabs.md` (component spec),
`_plans/motion-audit/PROFILE_LOYALTY_QUEUE.md` (motion grading of the same surfaces).

**Evidence class (RESEARCH_METHOD R2).** Every screen below was looked at as an image. Mobbin
returns scaled screenshots, so **no pixel value in this file was measured.** Size claims are
relative ("larger than", "a step above body"), never numeric, except where the number comes from
Solen's own source, which I read. Where a screenshot was cropped and a feature could not be
confirmed, that screen is excluded from that specific count and the exclusion is named.

---

## Counting subsets, so every frequency names what it was counted over

| Subset | Definition | n |
|---|---|---|
| **A** | Signed-in iOS **top-level** account/profile hubs | **40 apps** |
| **B** | Signed-out iOS account tabs | **9 apps** |
| **C** | Web account/profile screens of any kind | **29 apps** |
| **D** | Consumer/marketplace web account hubs (subset of C, SaaS workspace settings removed) | **16 apps** |

**Subset A, named in full:** Airbnb, Fresha, Uber, Lyft, Revolut, OpenTable, Calendly, Resy,
Wolt, Postmates, CHOPT, Panera Bread, adidas, adidas Running, Marriott Bonvoy, IHG, Skyscanner,
Viator, Scoot, Snoonu, Gojek, Blackbird, Lugg, Telegram, ChatGPT, Grok, Comet, Cosmos,
Truecaller, Cash App, App Store, Wise, Afterpay, CVS Health, Finimize, Honest Greens, Natural AI,
Yahoo Finance, Centr, Trip.com.

**Named exclusions from A** (looked at, deliberately not counted): NAVER, Meituan, ZIGZAG,
Baemin, Alipay, Taobao. These are dense super-app "my page" screens with 20+ tap targets per
viewport and a different product logic. They are described once under the rejected patterns and
never counted into a frequency, because including them would inflate the tile-grid and loyalty
numbers with a market Solen does not compete in.

**Could not verify (RESEARCH_METHOD R3).** Booksy, StyleSeat, Vagaro, Mindbody, Treatwell and
Squire returned no screens under their own names. The query naming them
([result set](https://mobbin.com/screens/58bb0a15-f89b-4dcd-bf92-d2c3ac430ce6)) returned adjacent
apps instead. **Fresha is therefore the only direct beauty-vertical competitor in this sample.**
That is a real limit on this research, it repeats the same Mobbin gap RESEARCH_METHOD R3 already
recorded for Treatwell and Booksy, and it is why Fresha carries more weight below than any single
app normally should.

---

## Dominant anatomy, top to bottom

Observed over **subset A (40 iOS hubs)**, ordered by how consistently the slot appears.

| # | Slot | Frequency | Notes |
|---|---|---|---|
| 1 | **Identity block** (avatar and/or name) is the first content | **36 of 37** where the top of the screen was visible (Blackbird, IHG and Centr were cropped mid-list, excluded) | The one exception is [Panera Bread](https://mobbin.com/screens/2b7eafef-5b23-4029-879e-8c2c792f75e4), which opens with an address-capture card and carries the name inside the membership card |
| 2 | **A flat, scannable list of navigational rows** | **40 of 40** | The load-bearing element in every app in the subset. Nothing else appears on all 40 |
| 3 | Rows carry a **leading icon** | **23 of 31** classifiable | No icons: CVS Health, Viator, Calendly, App Store, Wolt, OpenTable, Scoot, Yahoo Finance |
| 4 | Rows carry a **trailing chevron** | **25 of 31** classifiable | Omitted by Uber, Lyft, Revolut, Calendly, Postmates and OpenTable |
| 5 | **Destructive/exit action last** | **13 of 13** where the list bottom was visible | Never mid-list in any of the 13 |
| 6 | **Loyalty / balance / tier block** | **13 of 40** | CHOPT, Panera, adidas, adidas Running, Marriott, IHG, Wolt, Snoonu, Uber (Uber Cash), Lugg (credits), Natural AI, Revolut (plan tile), OpenTable (points) |
| 7 | **Quick-action tile cluster** (2-up or 3-up) | **9 of 40** | Airbnb, Uber, Postmates, Revolut, Cosmos, Skyscanner, adidas, Marriott, Trip.com |
| 8 | **Numeric stat row** (3-up, number over label) | **5 of 40** | Lyft, OpenTable, Blackbird, Marriott, adidas Running |
| 9 | **Promo / upsell card** | **7 of 40** | Comet, Uber, Lyft, Airbnb, Panera, Wolt, adidas |
| 10 | **App version string**, centered grey, at the very bottom | **7 apps** across the whole iOS sample | Airbnb, Fresha, Calendly, Revolut, Centr, foodpanda, SSENSE |

**The spine that repeats: identity, then list, then exit.** Everything in slots 6 to 9 is optional
furniture on that spine, and no optional slot cleared 33%.

**Row grouping has no winner.** Of the 31 hubs in A I could classify, **16 group rows into rounded
cards** (ChatGPT, CVS Health, Truecaller, App Store, Grok, Telegram, Comet, Cosmos, Revolut,
Panera, Scoot, Centr, Gojek, Finimize, Wolt, Honest Greens) and **15 run rows flat on the page
background with hairline separators** (Airbnb, Fresha, Uber, Calendly, Viator, Cash App, Afterpay,
Postmates, CHOPT, OpenTable, Wise, IHG, adidas Running, Yahoo Finance, Lyft). This is the one
structural question the corpus refuses to answer, so Solen should settle it from its own
Edge-Visibility floor, not from precedent.

**Section labels split three ways** over the same 31: **8** use small grey labels (ChatGPT, Viator,
Finimize, App Store, Grok, Cosmos, Truecaller, Gojek), **7** use large bold headings (Cash App,
Wise, Afterpay, Lyft, OpenTable, adidas Running, CVS Health), **14** use none at all, and 2 use a
brand-specific device (Panera's dark-green header bars, CHOPT's unlabelled plain-text block).
**Both direct references are in the 14:**
[Fresha's Profile](https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b) runs eight rows
with no labels and no dividers;
[Airbnb's Profile tab](https://mobbin.com/screens/dc125dc8-e3de-45d4-a8fc-116f2dfa2515) runs eight
rows split by exactly one hairline (account actions above, referral/legal/logout below).

---

## The two direct references, described from the screenshots

### Fresha, iOS, [Profile](https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b)

Bare back arrow. A large left-aligned display title "Profile". Then **one bordered white card,
hairline border, generous radius, no shadow**, holding a single row: a lavender circular avatar
with purple initials "JS", the name in semibold, "Edit profile" as a grey subline. No chevron on
that card. Below it, **a flat unlabelled list on white**: Favourites, Vouchers, Gift cards,
Memberships, Forms, Orders, Payment methods, Settings. Each row is a thin outline icon, an ink
label at regular weight, and a chevron, with a hairline starting at the label's x rather than the
screen edge. At the bottom, two small purple text links with tiny icons: "English", "Support".

What this screen does that matters most: **saved content (Favourites), transactions (Orders,
Vouchers, Gift cards) and account settings all live in one list.** There is no second hub.

Supporting Fresha screens:
[My Profile](https://mobbin.com/screens/019436f5-91b2-4004-95e3-b377d96d6175) is a bordered card
with an "Edit" link top-right, a centered avatar with a white pencil badge, the name centered, a
hairline, then label/value pairs. **Empty values render as "-", not as a hidden row.**
[Addresses and deletion](https://mobbin.com/screens/903d54e8-6a89-4528-9163-7f1612ce9946) uses bold
section headings, bordered cards with grey circular icon tiles, a small outline "+ Add" pill,
external rows with an up-right arrow for legal, and a white outline button with red text for
"Delete my account".
[Settings](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691) closes with a centered
outline "Sign out" pill, a centered outline pill with red "Delete account", and the app version.
[My vouchers, empty](https://mobbin.com/screens/8fbb3134-a63a-4439-92ff-e2fd3889260f) uses a
**near-black pill CTA**, not Fresha's purple. Confirmed again on
[Social logins](https://mobbin.com/screens/540ab2ed-6705-425e-a7ad-fc4e58713913), where "Done" is a
full-width near-black button.

**This corroborates Solen's locked CTA rule from an independent source.** Fresha's brand purple
appears only on text links, the small edit affordance and inline actions. Its commit button is ink.
Structurally identical to Solen's "ink CTA, accent for small clickable bits", different hue. Worth
noting because the CLAUDE.md taste-rule-3 citation correction of 2026-07-28 found Fresha to be the
*only* competitor supporting the sparse-accent position; this sweep is a second, independent
confirmation on a different screen than the one that call was made on.

### Fresha, web, [Profile](https://mobbin.com/screens/143c4a6f-870e-4c1b-b4b4-54d33853ada5)

Global header (logo, four-segment search pill, avatar chip). Very light grey page. **Two columns,
roughly a 1:2 split** (ratio taken off the Mobbin capture, treat as a ratio, not a px value). Left
is **one white card**: centered avatar with a small purple pencil badge, name centered, "Edit basic
info" as a small centered link, a hairline, left-aligned label/value pairs, a hairline, and **"Log
out" in red, centered, at the bottom of the card**. Right is **a stack of separate white cards**,
each with a title and a one-line description: My addresses, My payment methods, My social logins,
My notifications. Row-level actions on the right are **text links** ("Change", "Connect", "+ Add"),
not chevrons. A dark toast sits bottom-left: "Profile has been updated" with an X.

### Airbnb, iOS, [Profile tab](https://mobbin.com/screens/8f7c5b27-db62-48f9-a403-7b8bdba1253b)

Large left-aligned display title "Profile", bell in a grey circle top-right. Then **a white card
with a centered avatar** carrying a pink verified badge, the name at the largest size on screen,
city/country grey below. Then **a 2-column tile grid** (Past trips, Connections), each an
illustration with a "NEW" chip. Then a wide "Become a host" card. Then the row list.
A **black floating pill "Switch to hosting"** sits above the tab bar.
[Scrolled](https://mobbin.com/screens/dc125dc8-e3de-45d4-a8fc-116f2dfa2515): Account settings, Get
help, View profile, Privacy, one hairline, then Refer a host, Find a co-host, Legal, Log out. Thin
outline icons, chevrons, no card, no labels.

**Airbnb's toggles are ink black with a white check when on**
([Privacy](https://mobbin.com/screens/9015994d-6871-46c5-abda-67b7121d49f0)), not brand colour.
Rausch appears only on the active tab-bar icon and the verified badge. Second independent
corroboration that the key colour does not belong on the big control.

### Airbnb, web, [Account settings](https://mobbin.com/screens/aadd2399-c124-437d-ba46-1b0500784efa)

A fixed narrow **left nav rail** of icon + label rows, active row marked by a **light grey rounded
fill** (this is Solen's locked `bg-s-bg-sunken` selected state, arrived at independently). Right
pane is a section title then label/value rows, each with a **right-aligned underlined text action**:
"Edit", "Add", "Start". No chevrons on the page. Empty fields read "Not provided" rather than being
omitted. Buttons are ink black
([Payments](https://mobbin.com/screens/be74ace2-a9d9-484d-a868-85dc27a6f9a6)).
**There is no avatar and no identity block on Airbnb's web account settings at all.** Identity
lives on a separate profile page.

---

## Pattern table

| Pattern | Frequency | Evidence | Verdict for Solen |
|---|---|---|---|
| **Identity block first: avatar + name + one secondary line + edit affordance** | 36 of 37 in A | [Fresha](https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b), [Airbnb](https://mobbin.com/screens/8f7c5b27-db62-48f9-a403-7b8bdba1253b), [Lyft](https://mobbin.com/screens/ed184d83-98a4-460a-9bcd-0c79b0b9ee27), [Telegram](https://mobbin.com/screens/823ca492-b21a-4ac1-adc8-df36d7a77151), [Wise](https://mobbin.com/screens/049379d3-bc4f-42da-b5e7-cce2ad72fd62) | **Adopt.** Already shipped in both places (`ProfileTabs.tsx` 48px avatar + 28px name; `settings/page.tsx` `IdentityBlock`). Keep the 28px name as the display anchor, it satisfies floor 6 without needing a photo |
| **Avatar left-aligned rather than centered** | 15 left / 10 centered / 6 right, of the 31 in A with a visible avatar | left: [Fresha](https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b), [Gojek](https://mobbin.com/screens/58bb0a15-f89b-4dcd-bf92-d2c3ac430ce6), [Viator](https://mobbin.com/screens/c08a2831-0812-43ca-b66b-a05f01280e67) · centered: [Airbnb](https://mobbin.com/screens/8f7c5b27-db62-48f9-a403-7b8bdba1253b), [OpenTable](https://mobbin.com/screens/ecdc21e3-d976-4933-8fe8-f9baf0bc4938) · right: [Uber](https://mobbin.com/screens/d9bcee19-f059-4932-b703-7aa85908a404), [Wolt](https://mobbin.com/screens/b1d23605-f407-44b5-b743-69e92bcc62a3) | **Adopt left** (Solen's current choice). The margin is thin, so treat this as a tiebreak, not a law. Left keeps the row rhythm continuous into the list below; centered breaks it |
| **One flat list of navigational rows carries the screen** | 40 of 40 in A | every app in subset A | **Adopt.** The only universal in the corpus |
| **Row anatomy: icon, label, optional right-aligned grey value, chevron** | icons 23/31, chevrons 25/31, right-aligned value 8/31 | value: [Cosmos](https://mobbin.com/screens/38a34ccd-2af6-450e-8fe8-1557994ad8c1) ("System", "English", "Working"), [Comet](https://mobbin.com/screens/367b84f0-bdd9-404e-92a0-ad07a924469e) ("Apple Maps"), [GetYourGuide](https://mobbin.com/screens/84560f01-51d3-4725-a8fb-f29f67343c0f), [Viator](https://mobbin.com/screens/c08a2831-0812-43ca-b66b-a05f01280e67) ("$0.00") | **Adopt, already shipped.** `settings/page.tsx:138` renders exactly this: 22px icon, 15px medium label, 12.5px sub, 13.5px grey value, 16px chevron. The corpus validates the shape Solen already has |
| **Separator inset to the label's x, not the screen edge** | Fresha, Airbnb, CVS Health, Truecaller, Grok, Cosmos inset; Viator, Calendly, IHG full-bleed | [Fresha](https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b), [CVS Health](https://mobbin.com/screens/7bfd68bd-058d-4b39-b097-b448b3ac6ab4) | **Adopt.** The inset reads "these rows are one group" without a card, the cheapest way to clear the Edge-Visibility floor on white |
| **No section labels on the primary hub** | 14 of 31 use none, and both direct references are in that 14 | [Fresha](https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b) (8 rows, no labels, no dividers), [Airbnb](https://mobbin.com/screens/dc125dc8-e3de-45d4-a8fc-116f2dfa2515) (8 rows, one hairline) | **Adapt, do not copy.** Solen's `settings/page.tsx` runs 4 labelled groups over 18 rows. 18 is roughly double Fresha's 8, so the labels are earning their place. Keep them at 18 rows; drop them if the list ever gets down to 8 |
| **Right-aligned text-link action instead of a chevron on editable fields** | the dominant web treatment; both direct references use it | [Airbnb web](https://mobbin.com/screens/aadd2399-c124-437d-ba46-1b0500784efa) ("Edit"/"Add"/"Start", underlined), [Fresha web](https://mobbin.com/screens/143c4a6f-870e-4c1b-b4b4-54d33853ada5) ("Change"/"Connect"/"+ Add"), [Airbnb iOS](https://mobbin.com/screens/45f2625c-6e4e-4385-8e7a-faa4381f0db7) | **Adopt for `/profile/edit` and the personal-details pane.** This is the legitimate home for Solen's accent blue: a small clickable text bit, exactly what the lock permits. Do **not** put it on navigational rows, which stay chevron |
| **Empty field renders a placeholder, never an omitted row** | both direct references | [Fresha](https://mobbin.com/screens/019436f5-91b2-4004-95e3-b377d96d6175) uses "-"; [Airbnb](https://mobbin.com/screens/45f2625c-6e4e-4385-8e7a-faa4381f0db7) uses "Not provided" plus an "Add" link | **Adopt Airbnb's variant.** The density floor allows omission only for null data; here even null data keeps its row. "Nicht angegeben" + "Hinzufügen" beats a bare dash: the dash is honest but dead, the link is honest and actionable |
| **Destructive/exit action last, visually demoted** | 13 of 13 with a visible list bottom. Red text in 7, plain row in 4, ink button in 2 | red: [Fresha web](https://mobbin.com/screens/143c4a6f-870e-4c1b-b4b4-54d33853ada5), [OpenTable](https://mobbin.com/screens/ecdc21e3-d976-4933-8fe8-f9baf0bc4938), [CHOPT](https://mobbin.com/screens/137b1659-3158-4e14-b29e-ebb4924ec3e1), [GoodRx](https://mobbin.com/screens/a286629f-7c15-4d72-862f-bf92d79c7c44), [Edits](https://mobbin.com/screens/be3d06e6-a041-4de7-8d02-22d1b80b8bff), [Navan](https://mobbin.com/screens/cd700bba-60ea-41ca-b50c-81f28ad1205d), [Zalando](https://mobbin.com/screens/ac3d9420-4fd6-49f6-bcce-47556d9e8198) · plain row: [Calendly](https://mobbin.com/screens/73df736f-90b1-409a-9142-73a04b0029f3), [Revolut](https://mobbin.com/screens/e97489fe-6197-4a96-8267-818466b64ecc), [Airbnb](https://mobbin.com/screens/dc125dc8-e3de-45d4-a8fc-116f2dfa2515) · ink button: [Airbnb host menu](https://mobbin.com/screens/c556f71a-ba3a-459f-88e6-a74fbae36451) | **Adopt red-text-last, already shipped.** `settings/page.tsx:115` uses `text-s-error`. Do not promote it to a red button: 0 of 13 did that |
| **Destructive action confirms with a native sheet or alert** | 5 of 5 sign-out confirmations seen | [OpenTable](https://mobbin.com/screens/7a24c03d-9f37-4bec-9ba0-47d29bdb8669), [Centr](https://mobbin.com/screens/94d85298-0ce0-41b8-869d-4be44433d462), [GoodRx](https://mobbin.com/screens/a286629f-7c15-4d72-862f-bf92d79c7c44), [Edits](https://mobbin.com/screens/be3d06e6-a041-4de7-8d02-22d1b80b8bff), [Navan](https://mobbin.com/screens/cd700bba-60ea-41ca-b50c-81f28ad1205d) | **Adopt.** No inline-undo pattern appeared anywhere on this screen. Confirm before, not undo after |
| **Save confirms with a transient bottom toast** | 4 of 5 confirmations seen (the 5th is an inline banner) | toast: [Fresha iOS](https://mobbin.com/screens/f884d9eb-5adb-4d51-ad7e-22c6542ce7a1), [Fresha web](https://mobbin.com/screens/143c4a6f-870e-4c1b-b4b4-54d33853ada5), [Revolut](https://mobbin.com/screens/2562dc46-5414-4d29-9d1c-0792b6b5a129) · banner: [komoot](https://mobbin.com/screens/0efa8a10-7d4b-4b3c-9857-4db13c0f5752) | **Adopt, already locked.** Solen's toast is locked to the Chime recipe (light pill, green-check badge, bottom). The corpus uses dark pills, Solen uses light: a deliberate deviation, not a gap |
| **Quick-action tile cluster (2-up or 3-up)** | 9 of 40 in A | [Airbnb](https://mobbin.com/screens/8f7c5b27-db62-48f9-a403-7b8bdba1253b) (2-up), [Uber](https://mobbin.com/screens/b5becf3a-7859-4932-a272-b5523dab5ddb) (3-up), [Postmates](https://mobbin.com/screens/89e7a72a-3c5e-4fe2-be4d-7211889b35ee) (3-up), [Revolut](https://mobbin.com/screens/8b0c7aa9-1dd5-45e5-92c4-35dc1ffb5559), [Skyscanner](https://mobbin.com/screens/45845bfc-5f4d-4110-a1b0-a91fdb3727ae) (2x2) | **Reject for now.** 9 of 40 is an option, not a norm, and all 9 use it to shortcut a destination that also exists in the list below. Solen's list is 18 rows; tiles would duplicate rows rather than replace them. Revisit only if the list is cut below 10 |
| **Numeric stat row (3-up, number over label)** | 5 of 40 in A | [Lyft](https://mobbin.com/screens/ed184d83-98a4-460a-9bcd-0c79b0b9ee27) (Rides/Rating/Days), [OpenTable](https://mobbin.com/screens/ecdc21e3-d976-4933-8fe8-f9baf0bc4938) (Bookings/Reviews/Photos), [Blackbird](https://mobbin.com/screens/8f208051-4a7b-463d-8c3b-9d117cc0ca69), [adidas Running](https://mobbin.com/screens/2b12d4a6-52df-4387-aab2-4bb5fda8ebc8), [Marriott](https://mobbin.com/screens/d67a36e8-48a3-407a-8546-eea1b64a43ce) | **Reject at pre-launch, revisit later.** All 5 render zeros for a new user: "0 Bookings, 0 Reviews, 0 Photos" on OpenTable, "0 FOLLOWERS 0 FOLLOWING" on adidas Running, "1 Rides" on Lyft. Solen has no real customers, so every account would show a wall of zeros. This is the never-start-at-zero law, and the corpus demonstrates the failure rather than the pattern |
| **Loyalty / balance block above the list** | 13 of 40 in A | [CHOPT](https://mobbin.com/screens/697f62e1-fd81-41ee-94ca-a7f0417739cc), [Marriott](https://mobbin.com/screens/d67a36e8-48a3-407a-8546-eea1b64a43ce), [Wolt](https://mobbin.com/screens/b1d23605-f407-44b5-b743-69e92bcc62a3), [adidas Running](https://mobbin.com/screens/2b12d4a6-52df-4387-aab2-4bb5fda8ebc8), [Panera](https://mobbin.com/screens/2b7eafef-5b23-4029-879e-8c2c792f75e4) | **Adapt.** Solen Status exists and `settings/page.tsx:101-102` already links Treueprogramm and Stempel as rows. Promote to a card **only once it shows a real earned value**; same zero problem otherwise |
| **Promo / upsell card inside the hub** | 7 of 40 in A | [Comet](https://mobbin.com/screens/367b84f0-bdd9-404e-92a0-ad07a924469e) (dark Pro card with a photographic background), [Uber](https://mobbin.com/screens/b5becf3a-7859-4932-a272-b5523dab5ddb), [Lyft](https://mobbin.com/screens/4b1a7a6e-f93c-486f-97e5-736865654014) (dismissible carousel with dots) | **Reject.** Solen has nothing to upsell (no subscription, no Pro tier), so the slot could only be filled with something invented. It is also the exact shape the owner rejected three times as a random image baked into a random area |
| **App version string, centered grey, at the bottom** | 7 apps across the iOS sample | [Airbnb](https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64), [Fresha](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691), [Calendly](https://mobbin.com/screens/73df736f-90b1-409a-9142-73a04b0029f3), [Revolut](https://mobbin.com/screens/e97489fe-6197-4a96-8267-818466b64ecc) | **Reject for web.** All 7 are native apps where the user cannot tell which build they are on. A web page has no such ambiguity. Genuine native-only pattern |
| **Signed-out state keeps the settings rows, swaps identity for a CTA** | 8 of 9 in B | [TheFork](https://mobbin.com/screens/9aa54a3e-1625-41e2-9850-53c3abd3fdb6), [GetYourGuide](https://mobbin.com/screens/84560f01-51d3-4725-a8fb-f29f67343c0f), [Tock](https://mobbin.com/screens/e7e64a46-b0bc-4b62-a153-da065cf25b71), [foodpanda](https://mobbin.com/screens/66b750ca-a99c-438e-82f0-896f55a490d2), [Kitchen Stories](https://mobbin.com/screens/f378a7ad-0de5-428a-93a7-c4c9ae05ccb5) | **Adopt.** The lone exception is [UNIQLO](https://mobbin.com/screens/00283bec-d4ab-40ff-97ee-a67a4301962e). Language and currency must stay reachable before login, and Solen ships de/en/fr/it, so this is not optional |
| **Signed-out empty avatar is a vivid disc, not a grey blob** | 1 clear instance against a grey-blob majority | [Kitchen Stories](https://mobbin.com/screens/f378a7ad-0de5-428a-93a7-c4c9ae05ccb5) uses a saturated yellow disc with an ink glyph | **Adopt the minority.** Taste rule 5 and NEVER-AGAIN floor 4 ban the washed-out grey disc by name. The corpus majority here **is** the failure Solen already legislated against, so precedent loses to the floor |
| **Photography inside the account hub** | **3 of 40** in A carry real photography beyond the user's own avatar | [Resy](https://mobbin.com/screens/a98d941d-c0ca-4b2e-8f56-92034aadda4c) (recent-booking thumbnails), [Wolt](https://mobbin.com/screens/b1d23605-f407-44b5-b743-69e92bcc62a3) (favourites carousel), [adidas](https://mobbin.com/screens/feb9c703-c458-45db-b071-a0a6d9801c89) (banner). Airbnb uses illustrations, not photos | **Adapt, and this one needs an owner call.** See collision 2 below |
| **Web: a left nav rail of account sections** | **20 of 29** in C carry a left rail (17 with labels, 3 icon-only) | [Airbnb](https://mobbin.com/screens/aadd2399-c124-437d-ba46-1b0500784efa), [Shop](https://mobbin.com/screens/959324f8-0087-4860-ba39-de8629dda6a6), [Quicken](https://mobbin.com/screens/06f942cc-4244-4f4d-be42-cc82ea1c775d), [komoot](https://mobbin.com/screens/0efa8a10-7d4b-4b3c-9857-4db13c0f5752), [Preply](https://mobbin.com/screens/49931b98-118c-4bb3-864f-93797bec9ebe), [Melio](https://mobbin.com/screens/ac45719a-952f-44c6-9bcc-ce8ce1580b36) | **Adopt at `md:` and up.** Airbnb's active rail row is a light grey rounded fill, which is Solen's locked selected state already. On mobile the rail collapses back to the row list |
| **Web: horizontal tab row under the header instead of a rail** | 3 of 16 in D | [lululemon](https://mobbin.com/screens/40cc034d-2094-4703-b8ac-12d50e86863d), [Kiwi.com](https://mobbin.com/screens/dbb09558-1240-4e26-bd3c-44dad2bec285), [Hims](https://mobbin.com/screens/71133217-406c-47f7-b52e-e8b3e1038d8e) | **Reject for account sections, keep for content.** Solen's content tabs already use the locked title + 2px ink underline. Using tabs for account sections too would make one device mean two things on adjacent screens |
| **Web: card grid of account destinations, no list** | 3 of 16 in D | [Zillow](https://mobbin.com/screens/bbb5d8a4-ed51-4c1e-941f-c7eb3b3284cc), [Fiverr](https://mobbin.com/screens/737b2606-a526-44d1-9fda-64e3c3157652), [Quicken](https://mobbin.com/screens/06f942cc-4244-4f4d-be42-cc82ea1c775d) | **Reject.** All 3 hold 3 to 4 destinations. Solen has 18. A card grid at 18 items is a wall and costs the scannability that won 40 of 40 on mobile |
| **Web: identity card and settings cards as two columns** | Fresha's exact layout | [Fresha web](https://mobbin.com/screens/143c4a6f-870e-4c1b-b4b4-54d33853ada5) | **Adopt for `/profile/edit` on desktop.** This is the STRUCTURE axis, where Fresha is the locked source of truth. Roughly 1:2, identity left, one card per settings group right |
| **Dense multi-grid super-app hub** | 6 apps, excluded from all counts by name | [NAVER](https://mobbin.com/screens/aeb51c0a-fccd-48bd-8e59-ed48dca3be80), [Meituan](https://mobbin.com/screens/cdb81652-36f4-4154-890a-83858d891070), [ZIGZAG](https://mobbin.com/screens/e04f2e0d-bddf-4969-a63d-3a373be1d6b6), [Baemin](https://mobbin.com/screens/0b0e633e-dfd2-4940-a6ac-bee8f7410a26), [Taobao](https://mobbin.com/screens/af2f96f9-4331-4b65-83ae-965de3c1078d), [Alipay](https://mobbin.com/screens/b64b4cd2-6e11-477d-968b-362a77ba866c) | **Reject by name.** 20+ targets per viewport, saturated multi-hue tile grids, countdown timers. Breaks the emphasis budget, the 4-size ceiling and the sparse-accent lock at once |

---

## Grid

**Mobile is a single column and the row is the grid unit, not a card.** Internal row grid,
consistent across Fresha, Airbnb, CVS Health, Truecaller, Grok, Cosmos and Solen's own `Row`:
`[icon] [gap] [label, flex-1] [optional value, right] [chevron]`. Value and chevron both sit hard
right; where both exist the value comes first with a small gap.

**Separator inset, two treatments.** Inset to the label's x (Fresha, Airbnb, CVS Health, Truecaller,
Grok, Cosmos) reads the icon column as a gutter and binds rows into one group. Full-bleed edge to
edge (Viator, Calendly, IHG) reads as a table. Solen's grouped-card treatment sits between the two
and is fine.

**Tile clusters, where they appear, are always equal-width cells on the page's own gutter**, never a
bespoke grid: 2-up in Airbnb, Revolut, Cosmos and adidas; 3-up in Uber, Postmates and Marriott; 2x2
in Skyscanner and Blackbird. Nothing in the corpus used an asymmetric or masonry grid here.

**Desktop is two-pane.** Fresha's is roughly 1:2 (identity card left, settings-card stack right),
each right-hand card holding exactly one topic. Airbnb's is a fixed narrow rail plus a content
column that does **not** fill the viewport: there is deliberate empty space at the right edge.
Neither reference stretches account content to full width, which is worth honouring against Solen's
1280 page max.

---

## Type

**No number in this section was measured.** These are relative observations from the screenshots.
The only numbers cited are Solen's own, read from source.

**Two title conventions, and Solen is in the right one.** The modern hubs run a large left-aligned
display title (Airbnb "Profile", Fresha "Profile", Revolut "Account", Skyscanner "Profile", Cash App
"Account & settings", Wolt "Hi Sam!", Afterpay's name-as-title). The iOS-native-styled hubs use a
small centered navbar title (ChatGPT, Grok, App Store, Truecaller, Comet, Yahoo Finance). Solen's
`ProfileTabs.tsx:166` uses the first: a 28px semibold name as the `h1`, doubling as the floor-6
display anchor. Right call, already shipped.

**Row labels sit one step above caption size at regular or medium weight, not semibold**, in Fresha,
Airbnb, Uber, Viator, Calendly and Wise. Bold row labels appear only in the loud-brand group: Cash
App, Afterpay, Panera, CHOPT, adidas. Solen's `settings/page.tsx:143` renders `text-[15px]
font-medium`, landing in the restrained majority.

**Right-aligned values are grey and the same size or smaller than the label** everywhere I saw them.
Solen uses `text-[13.5px] text-s-ink-2`, a half-step down. Consistent with the corpus.

**Section labels, where used, are the smallest text on the screen.** Uppercase in App Store,
Finimize, adidas Running, Airbnb's host menu, SSENSE and Zalando; sentence case in ChatGPT, Grok,
Cosmos, Viator and Gojek. **Solen's copy rule bans ALL-CAPS**, so the sentence-case half is the only
legal one here.

**The size count is naturally low on this screen.** Fresha's Profile runs a display title, a name, a
subline and a row label: four sizes, at the ceiling, with real range between title and subline. This
is the easiest customer surface in the product on which to hold both the 4-size ceiling and the 1.8x
anchor ratio, because it carries almost no content of its own.

---

## Motion

**I observed no motion.** Mobbin returned static images for all 164 screens. Every claim below is
inferred from **state pairs** (two screenshots of one screen differing in one thing), and the pair is
named each time. Anything else about motion on this screen is unresearched and should be treated as
unknown, not as absent. Solen's own motion grading of these surfaces already exists at
`_plans/motion-audit/PROFILE_LOYALTY_QUEUE.md` and is the authority; this only adds outside evidence.

| Inference | The state pair it came from |
|---|---|
| A successful save confirms with a **transient bottom toast**, not an inline banner | Fresha My Profile [without](https://mobbin.com/screens/019436f5-91b2-4004-95e3-b377d96d6175) and [with](https://mobbin.com/screens/f884d9eb-5adb-4d51-ad7e-22c6542ce7a1) "Profile details updated successfully" · Revolut Account [without](https://mobbin.com/screens/bfe291d7-34a8-4d75-864e-3495d2452296) and [with](https://mobbin.com/screens/2562dc46-5414-4d29-9d1c-0792b6b5a129) "Passcode has been updated" |
| The toast carries a **dismiss X**, so it does not rely on auto-dismiss alone | [Fresha web](https://mobbin.com/screens/143c4a6f-870e-4c1b-b4b4-54d33853ada5) bottom-left, [Fresha iOS](https://mobbin.com/screens/f884d9eb-5adb-4d51-ad7e-22c6542ce7a1) |
| Sign out **interrupts with a modal**; it does not fire optimistically with an undo | [OpenTable](https://mobbin.com/screens/7a24c03d-9f37-4bec-9ba0-47d29bdb8669), [Centr](https://mobbin.com/screens/94d85298-0ce0-41b8-869d-4be44433d462), [GoodRx](https://mobbin.com/screens/a286629f-7c15-4d72-862f-bf92d79c7c44), [Edits](https://mobbin.com/screens/be3d06e6-a041-4de7-8d02-22d1b80b8bff), [Navan](https://mobbin.com/screens/cd700bba-60ea-41ca-b50c-81f28ad1205d), all five captured mid-dialog |
| A toggle's on-state is a **filled track plus a glyph**, so it survives a colour-blind read | Airbnb's ink toggles carry a white check ([Privacy](https://mobbin.com/screens/9015994d-6871-46c5-abda-67b7121d49f0)); Lyft's favourite toggle [on](https://mobbin.com/screens/794886d2-669b-41b0-a7d1-c3be71c562c0) with a heart glyph vs [off](https://mobbin.com/screens/2d3c94e0-5019-48f1-9e9f-5512151c61d6) grey |
| A new payment method acquires a **DEFAULT tag in place**, implying an in-list state change rather than a navigation | Airbnb Payments [before](https://mobbin.com/screens/be74ace2-a9d9-484d-a868-85dc27a6f9a6) and [after](https://mobbin.com/screens/e79a5fae-83c1-4605-8bfb-e976e3bfdd08) |

---

## Components this screen needs

Mapped against what Solen already owns.

| Component | Corpus support | Solen status |
|---|---|---|
| `IdentityBlock` (avatar, name, secondary line, edit affordance) | 36 of 37 in A | **Hand-drawn twice.** `settings/page.tsx:169` defines a local `IdentityBlock`; `ProfileTabs.tsx:163` builds a different identity row for the adjacent screen. Two implementations of one thing. Promote to the registry as one component with a density variant |
| `SettingsRow` (icon, label, optional sub, optional value, chevron) | the universal element, 40 of 40 | **Hand-drawn** at `settings/page.tsx:138`. Needs a registry entry |
| `ExternalRow` (up-right arrow instead of chevron) | [Fresha](https://mobbin.com/screens/903d54e8-6a89-4528-9163-7f1612ce9946), [SSENSE](https://mobbin.com/screens/8c8af9fd-384e-49a9-8f88-ca0df5ad4bf2) | **Hand-drawn** at `settings/page.tsx:158` |
| `DestructiveRow` (red label, last position) | 13 of 13 place it last, 7 use red | Inline `Link` with `text-s-error` at `settings/page.tsx:115`. Fold into `SettingsRow` as a `tone="destructive"` variant |
| `RowGroup` (hairline-separated group, inset separators) | 16 of 31 card, 15 of 31 flat | Currently Tailwind on the page. Should be one component so the Edge-Visibility decision is made once |
| `SectionLabel` | 15 of 31 use some label form | Inline. Sentence case only, the ALL-CAPS half of the corpus is banned by Solen's copy rule |
| `Avatar` | universal | **Owned and used**, `_components/primitives/Avatar.tsx`, imported at `ProfileTabs.tsx:37` |
| `EmptyState` | [Fresha vouchers](https://mobbin.com/screens/8fbb3134-a63a-4439-92ff-e2fd3889260f), [Fresha appointments](https://mobbin.com/screens/cd4349f4-318d-405d-97b9-15c413db3dd3), [lululemon saved items](https://mobbin.com/screens/40cc034d-2094-4703-b8ac-12d50e86863d) all use the promise-headline plus filled-CTA anatomy Solen already locked | **Owned.** The corpus matches the lock, including the ink CTA |
| `SignedOutHeader` (headline, one-line promise, one commit CTA, replacing identity) | 8 of 9 in B | **Missing.** `profile/page.tsx` redirects unauthenticated users away. See gap 3 |
| `LoyaltyCard` | 13 of 40 | Exists as rows (`/rewards`, `/profile/stamps`). Do not promote to a card until it carries a real earned value |
| `QuickActionTile` | 9 of 40 | **Do not build.** Verdict above is reject |
| `StatRow` | 5 of 40 | **Do not build.** Verdict above is reject at pre-launch |

**Three of these (`IdentityBlock`, `SettingsRow`, `ExternalRow`) are defined inside a route file.**
That is FLOORS LAW 9 (screens are composed, not drawn) and, because `ProfileTabs.tsx` then built its
own second identity row, FLOORS LAW 8 (the same thing looks the same everywhere) in the same place.
The row anatomy itself is **correct** and the corpus confirms it. The defect is only that it lives in
a page instead of the registry, so the adjacent screen could not inherit it and did not.

---

## Where Solen differs

### Collision 1: two hubs, and the corpus has one. NOT a defect. Owner's call, dated and approved.

`ProfileTabs.md` records this as a deliberate 2026-07-21 owner-approved decision: *"The old profile
hub (row-list of management links) is gone from this route. Those rows now live at
`/profile/settings`. `/profile` is content-only."* Under the precedence chain that outranks this
research, so what follows is evidence for the owner, not a verdict.

**The evidence.** In subset A, the screen owning the word "Profile" or "Account" **is** the row list
in 31 of 40. Five of the remaining nine (Airbnb, Resy, Wolt, Postmates, Skyscanner) put content above
the rows, and **all five still show account rows on the same scroll**. **Zero of 40** put the account
list behind a single icon. Fresha, the only direct competitor in the sample, puts Favourites,
Vouchers, Gift cards, Memberships, Forms, Orders, Payment methods and Settings in one eight-row list.

**What that costs today, checked in source, not assumed.** There are **19 page routes** under
`app/[locale]/profile/`. From `/profile`, exactly one is reachable, through a 24px gear glyph
(`ProfileTabs.tsx:170`). Bookings, favorites, gift-cards, vouchers, stamps, referral, intake-forms,
haarprofil, looks and edit have no entry point on the screen the user lands on.

**The middle option the corpus actually supports** is not "revert the split". Airbnb, Resy, Wolt and
Postmates keep the content **and** put the account rows underneath it on the same scroll. That
preserves the 2026-07-21 decision (content leads) while closing the discoverability hole.

### Collision 2: photography. Two dated owner decisions point opposite ways.

FLOORS LAW 2 requires every customer browse/discovery/PDP viewport at 390x844 to carry roughly one
third photographic area, and its exempt list is "forms, checkout payment step, legal, receipts".
**The account hub is not on that list.** But the corpus says the account hub is the one customer
screen that normally has no photography: **3 of 40**. Airbnb, the main reference, uses illustrations.

Per the precedence chain I am surfacing this rather than resolving it silently:

- FLOORS LAW 2 (owner-approved 2026-07-21) says a photo-light customer surface is the "compliant but
  unfinished" failure.
- Its 2026-07-25 clarification says the floor is **satisfied by content, never by decoration**, and
  that a hero photo or banner is rejected by name.

**Both are satisfiable at once, and the corpus shows how.**
[Resy](https://mobbin.com/screens/a98d941d-c0ca-4b2e-8f56-92034aadda4c) puts a "RECENT BOOKINGS" list
with real restaurant photo thumbnails inside the account hub.
[Wolt](https://mobbin.com/screens/b1d23605-f407-44b5-b743-69e92bcc62a3) puts a "Your favorites"
carousel of real photo cards there. Both are **data-driven salon content**, exactly what the
clarification demands and exactly what `no-decorative-image-gate` permits. Solen's `/profile` already
renders real salon collage tiles from seeded data, so the merged layout in collision 1 satisfies
floor 2 for free.

**The decision the owner still owns:** whether `/profile/settings`, as a deep link rather than a hub,
gets named on floor 2's exempt list beside forms and legal. My read is yes, a 19-row settings list is
a form-family surface and 37 of 40 apps agree, but that is an amendment to an owner-approved floor
and I am not making it unilaterally.

### Gap 3: the search bar and the Sortieren pill. Here the corpus backs the owner outright.

FLOORS LAW 10 was written after the owner asked why his own profile has a search bar. The corpus
answers it: **0 of the 40 iOS hubs in subset A carry a search field.** Telegram has a search FAB, but
that is app-global tab-bar chrome, not a hub control. On web the only search near an account screen
is Heidi's settings-nav filter, which exists because that nav has 14 entries.

The Sortieren pill (`ProfileTabs.tsx:223`) is the same category: a browse control on an account
screen, and it appeared nowhere in the corpus either. **This is the same defect twice**, and it is
the one place where outside evidence and the owner's instinct agree completely.

### Gap 4: no signed-out account screen.

`profile/page.tsx` redirects unauthenticated users. **8 of the 9** signed-out screens in subset B keep
the settings rows visible and swap only the identity block for a headline plus one commit CTA. This
matters more for Solen than for most: **language is a settings row and Solen ships de/en/fr/it.** A
user who cannot reach the language row before logging in is stuck in whatever locale the URL gave
them. Cheap to close: the row list exists, it needs an auth-aware header and a filtered row set.

---

## Provenance

- Corpus assembled 2026-07-29 from 13 Mobbin queries, 164 unique screens, 90 apps.
- STRUCTURE axis anchor: Fresha, both platforms
  ([iOS](https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b),
  [web](https://mobbin.com/screens/143c4a6f-870e-4c1b-b4b4-54d33853ada5)), per the dual-axis rule.
- AESTHETIC axis unchanged, LOCKFILE governs. Two independent corroborations found for the ink-CTA
  lock (Fresha's near-black commit buttons, Airbnb's ink toggles and Log out button) and one for the
  calm-grey selected state (Airbnb web's account rail).
- Open for the owner: the merge question in collision 1, the floor-2 exemption in collision 2.
