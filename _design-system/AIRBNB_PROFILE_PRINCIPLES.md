<!-- exists-check: grepped _design-system/ for "container is earned", "no box", "root screen",
     "tab root" this turn. Hits: LOCKFILE.md (already has a container-earned test, reused and
     cited below, not duplicated), GEOMETRY_PRINCIPLES_2026-07-17.md and
     IG_PRINCIPLES_VERDICTS_2026-07-16.md (Instagram-sourced, different reference, not touched),
     and the two Airbnb reference files this document is built from. No prior file turns the
     Airbnb profile measurement into screen-agnostic, generalized principles; this is that file,
     net-new, and it supersedes nothing. `_plans/DESIGN_SYSTEM_RENEWAL_2026-08-02.md` is a sibling
     but different kind of document: it is an atomized build log (mockups, gates, commits) for
     rebuilding ONE screen. This file is durable law: no mockups, no product code, no commits, and
     it is written to survive past that rebuild and bind screens the rebuild never touches. -->

# Airbnb profile, turned into principles

Owner, 2026-08-03, on why the last three rounds were not enough: *"go look and research onto how
the profile page is like in the fucking Airbnb and then implement it into research to design and
taste and principles so we can actually RECREATE THAT ON OTHER PAGES."* Not another mockup, not
another direction. Generalize what Airbnb's screen actually proves, so it can be applied to a
screen nobody has measured yet.

**Sources, reused wholesale, not re-measured:**
- `_design-system/references/AIRBNB_SYSTEM_VS_OURS.md` (407 lines, live token layer + account
  screen, tag `AB-LIVE-390` / `AB-CANVAS` / `S69xx` / `O-PROF` / `CONTRAST`)
- `_design-system/references/airbnb--profile-list.md` (PIL pixel-sampling of `IMG_6900`-`IMG_6904`)
- `_design-system/references/airbnb--profile-1to1-diff.md` (the one-to-one diff, including its own
  2026-08-03 orchestrator correction)
- This session's own live reads: `app/[locale]/_components/profile/AccountHub.tsx` and
  `app/[locale]/_components/layout/Header.tsx`, quoted where cited, not recalled.

**The one correction that matters most before anything below is used.** Two numbers circulated in
this workstream and were both wrong, in opposite directions, for the same reason: measuring a
glyph's ink band (which includes descenders and ascenders) and reporting it as a font size. The
settled figures, from two independent rulers (a weight-invariant cap-height ratio and a
word-width solve) that converge to 0.01pt of each other: **the row label is 16px at weight 400.**
Not 11.7px (a cap-height mistaken for a size, ships 30% too small), not 21px (an ink band mistaken
for a cap-height, ships 31% too big). Every principle below that touches type size uses 16px/400
as the reference figure. `AIRBNB_SYSTEM_VS_OURS.md` section 0a is the full derivation.

---

## Principle 1 , A screen's chrome carries only that screen's own job. Never a trigger for a different surface's navigation.

**The rule.** A screen's top chrome may hold two kinds of control: a way back to where the user
came from, and controls that act on THIS screen's own content or this specific user (their own
notifications, a filter on the list they're looking at). It may never hold a trigger that opens a
DIFFERENT surface's navigation, structure, or settings. When the product's primary navigation
lives in a persistent element (a tab bar, a rail), that element already carries the site-nav job
and no individual screen needs to re-open it. When there is no such persistent element, the site
nav's job does not vanish, it has to be assigned to some carrier, and stapling it onto every
screen's header is one such assignment, but it fails this test on any screen whose own job is
narrower than "the whole site."

**Evidence.** `IMG_6900`, Airbnb's Profile tab root: a dark-pixel column-cluster scan across the
entire top chrome band found exactly two clusters, the "Profile" title (x76-259px) and one bell
icon (x1077-1118px), and the measurement states explicitly: **"no hamburger/menu icon anywhere in
this row"** (`airbnb--profile-list.md` IMG_6900). Airbnb does not need one there because its
bottom tab bar (Explore / Wishlists / Trips / Messages / Profile, visible on `S6900`) already IS
the site's primary navigation; the Profile tab's own top chrome is free to carry only what belongs
to Profile itself, which is a personal-notifications bell.

Solen's `/profile`, read live this session (`app/[locale]/_components/layout/Header.tsx:750-987`):
a back-or-home tile, the title "Profil" inline beside it, then `NotificationBell` AND a hamburger
(`aria-label="Menü öffnen"`, opens `MobileMenu`, described in the file's own header comment as "the
sheet holding site-wide category/login/language nav") on every route that is not home, a
category/search route, or the Inspo root (`Header.tsx:442`, `showCategoryChrome = isHome ||
categorySegment || isDiscover`). `/profile`'s job is "this user's own account"; the hamburger's job
is "navigate the whole site's categories, login, and language." Those are different jobs, and the
second one is on the screen anyway, because `Header.tsx` is one shared component and this is its
only branch for anything that isn't home, a category page, or Inspo. The file's own comment names
the pattern's reach explicitly: **"Deep pages (profile, PDP, etc.) still keep this row"**
(`Header.tsx:704-705`), so the failure is not `/profile`-specific, it is every deep page.

**Counter-case.** A screen that genuinely IS a hub for many destinations (a dashboard shell whose
entire job is switching between its own sections) can carry a persistent menu trigger, because
opening a menu of THIS surface's sections is that screen's job, not a different surface's. And a
step inside a flow (a booking step, a search-results filter sheet) legitimately needs a way back
into that same flow plus whatever is cross-cutting to it (a basket, a step indicator); that is not
a violation because the controls still serve the flow you are in. The test is never "does this
screen have extra chrome," it is "whose job does each control in that chrome serve."

**Check.** On a rendered screen, list every control in the top chrome. For each one, name which
screen's job it serves. If a control's destination has no relationship to what is currently on
screen, count it as a failure, regardless of how standard-issue it looks. Concretely: a bell
opening this user's own notifications passes on any screen (their data, wherever they are). A
hamburger opening categories, login, or language fails on an account, wallet, or settings screen,
because none of those relate to "my account"; it passes on a screen whose job actually is "the
whole site" (a home tab, a browse tab), which is why Solen's own `Header.tsx` already exempts home,
category routes, and Inspo from this exact row (`showCategoryChrome`, verified above) and the
remaining failure is isolated to the deep-page branch.

---

## Principle 2 , A container is earned by contrast with what's around it. A homogeneous list earns whitespace, not a box.

**The rule.** A border, a fill that differs from the page, and a radius all say the same thing:
"this bounded region is one unit, distinct from what's beside it." That signal is worth sending
when the group actually sits next to something dissimilar (a promo card in a feed of unrelated
content, a form section on a page that also carries marketing copy) or when the group's members are
themselves the thing being compared (a list of distinct salons, where the reader needs to see where
one ends and the next begins). It is redundant when every item in the group is already the same
kind of thing, doing the same job, in the same order (a list of "tap this row to go somewhere");
whitespace alone already carries "these belong together, that gap means the group changed," and a
border on top of it states the same fact twice.

**Evidence.** `IMG_6900`: zero card edges found anywhere on the entire screen by a full-width scan
across all eight row bands, and exactly **three** 1.0pt rules total, two of them full-bleed chrome
boundaries (the nav-bar underline, the tab-bar top edge) and exactly **one** a content divider,
which sits only at the single boundary between the two row-groups, inset 24.0pt both sides.
Everywhere else, separation is whitespace alone: row pitch measured **56.0pt exactly**, zero
variance across 19 rows spanning two different screens (`airbnb--profile-list.md`, chevron-top to
chevron-top). Solen's own `LOCKFILE.md:543-560` already states the identical rule independently,
dated 2026-07-28: *"A container is earned only when it does something whitespace cannot,"* naming
three legal cases (sits on a non-white surface, is one of several peer items competing in one
scroll, or is itself tappable as a unit) and explicitly naming **"an account hub"** as a surface
that gets **no container**, adding: *"Never both. A container plus a hairline between every row is
doubled chrome."* `LOCKFILE.md:571` even prescribes the exact row rhythm once the box is gone:
**56px pitch**, matching Airbnb's independently-measured 56.0pt to the decimal, without either
number being derived from the other.

`AccountHub.tsx:208` currently ships `RowCard`: `divide-y divide-s-border rounded-[24px] border
border-s-border bg-white`, three separate boundary devices (outer border, radius clip, per-row
divider) stacked on a list whose seven rows are all structurally identical navigation links. This
is not a taste disagreement with Airbnb; it is Solen's own written law being broken by Solen's own
code.

**Counter-case.** Do not read this as "delete every container everywhere." `LOCKFILE.md`'s own
three legal cases still apply: a grouped list sitting on `s-bg-sunken` or a photo, or a list of
genuinely distinct entities (salons, stylists) competing for the reader's attention, still earns an
edge, per **FLOORS LAW 4** (edge-visibility) and the locked **"individual entity-card 16"** radius
row. The difference is what the group's members ARE: distinct entities being compared need a
boundary each; identical navigation rows in one list do not need a boundary at all, and adding one
when the surrounding page is already calm (mostly white, nothing dissimilar nearby) is the doubled
signal this principle names.

**Check.** On a rendered group, count the distinct boundary devices touching it at once: a fill
that differs from the page, an outer stroke, a radius clip, and a rule between every child. If two
or more of those are present AND the group's members are structurally identical (same job, same
shape, same order), that is doubled or tripled chrome. Keep at most one device, and prefer
whitespace plus a single end-of-group rule when nothing dissimilar sits nearby on the page.

---

## Principle 3 , Type tiers track real roles, not the number of widgets a screen happens to compose.

**The rule.** Every distinct size/weight pair on a screen is a claim that the content it marks
differs in importance or kind from its neighbors. Hierarchy is a budget: the more tiers a screen
carries, the less any single tier can mean, because the reader can no longer tell which of the
"important-looking" elements is actually the point. The number of type tiers on a screen should
track the number of genuinely different ROLES present (an anchor, a body label, a secondary note),
not the number of separate widgets (an eyebrow, a subline, a badge, a stat) a screen happens to be
built from. Within that small tier set, weight >=600 should mark the minority of elements that are
actually the point of the row or screen, not be applied to every label because a label feels
important.

**Evidence.** Airbnb's live design-token layer (`AB-LIVE-390`) names its whole type system in three
weight words, `book`, `medium`, `semibold`, and every `--typography-*-letter-spacing` token on that
system returns `normal` with one single opt-in exception. On the Profile-root screen specifically,
the row label sits at **regular weight 400** (`AIRBNB_SYSTEM_VS_OURS.md` section 0a, confirmed by
two independent rulers converging to 0.01pt), and no row on any of the three account-adjacent
screens carries a subline at all (`airbnb--profile-list.md`, "none on any of the 9 rows," repeated
on IMG_6900/6901/6902). Effectively three sizes appear on the reference screen: the collapsing
title (22 or 32, one state visible at a time), the row label (16), and nothing else.

Solen's `/de/profile`, measured live this session across `AccountHub.tsx` and `Header.tsx`: name
28px/700, header title 18px/700, row label 15.5px/500, row subline 13px, group eyebrow 12px/600,
and a 10px badge elsewhere on the screen, **six distinct sizes** in one viewport
(`AIRBNB_SYSTEM_VS_OURS.md` item 3), and **33.3% of visible text at weight >=600** (item 11, 21
elements measured). Four weight values (400/500/600/700) and four distinct letter-spacing values
(`-0.18px`, `-0.155px`, `-0.56px`, `normal`) all appear in the same single viewport (item 7). The
label size itself is close, 15.5px against a settled 16px target, a 0.5px gap; the real gap is
weight (500 vs 400) and the surrounding tier count (six sizes burying one label among a 13px
subline, a 12px eyebrow, and a 10px badge), which is why the owner's *"how these texts are so
small"* complaint is not fixed by enlarging the label, it is fixed by deleting the tiers around it.

**Counter-case.** A screen whose job genuinely requires distinguishing several independent
categories of real information at a glance, a price breakdown, a receipt's line items, the trust
floor `CLAUDE.md` mandates for any commit action (base price, surcharge, VAT, cancellation term all
visible at once) may legitimately need more than three or four sizes, because those distinctions
are real and load-bearing, not decorative. This codebase's own ceiling is already four sizes
(**NEVER-AGAIN floor 2**); the Airbnb evidence argues "probably fewer than you're using," it does
not license inventing a stricter universal number than the one already enforced.

**Check.** On a rendered screen, list every distinct (size, weight) pair visible in the viewport.
For each tier, ask what real distinction it marks that the tier below it doesn't already mark; if
two tiers exist for reasons that could merge (an eyebrow and a subline both there "to look
organized," not because they carry different importance), collapse them. Then compute the share of
visible text runs at weight >=600; if it is climbing toward or past this project's own emphasis
ceiling, some of what's bolded is not actually the point of the screen.

---

## Principle 4 , A row earns its place by being one destination among equals. Promotion out of the list is earned by time-sensitivity to the user, not by importance to the business.

**The rule.** A screen may promote exactly one thing (an action or a fact) to its own visual
register, more space, richer treatment, a card rather than a row, when that thing has an urgency
independent of why the user opened the screen at all. Everything else, however commercially
valuable, stays a flat row at equal weight with its neighbors. The test for promotion is never "is
this important to us," it is "does the user lose something time-sensitive if this sits at the same
weight as a settings link."

**Evidence.** `IMG_6900` carries exactly one promoted element on the whole screen: a "Become a
host" card, described in the measurement as having a soft drop-shadow and no stroked border,
sitting above the two flat row-groups (`airbnb--profile-list.md`, horizontal scans at y480/620/795).
Everything else on the screen, eight destinations across two groups (Account settings, Get help,
View profile, Privacy / Refer a host, Find a co-host, Legal, Log out), renders at the identical
56.0pt-pitch, no-subline, bare-icon row grammar, with zero visual distinction between any of them.
Notably, "Refer a host" (plausibly high commercial value to Airbnb) gets no special treatment at
all; it is a flat row like the rest.

Solen's `AccountHub.tsx` buries `nextAppointment`, a live, time-sensitive fact (a real upcoming
booking date and time) as a subline inside a row that is structurally identical to Wallet, Vouchers,
and Settings (`AccountHub.tsx:143-145`). Unlike a promo card, this is not decoration, it is real
data the FLOORS LAW already protects from deletion, but it currently gets the same visual weight as
"open my settings," despite being the one fact on the screen with an actual clock on it.

**Counter-case.** Do not promote something because it would be good for the business to be seen.
Airbnb's own "Refer a host" row is the counter-example inside the reference itself: valuable to
Airbnb, still a flat row, because it carries no urgency FOR THE USER. A row promoted for the
product's sake rather than the user's is the same mistake as the pink heart flagged in Principle 6,
dressed as hierarchy instead of color.

**Check.** For every row on a list-type screen, ask: if this were flattened to the same weight as
its neighbors, does the user lose something that was time-sensitive to them specifically (an
appointment, an expiring balance), or only something that would be nice for someone else if they
noticed it. The former is a promotion candidate; the latter stays in the list.

---

## Principle 5 , Whitespace only reads as structure when it is a fixed, discrete rhythm with a distinctly bigger step at group boundaries.

**The rule.** Removing a border does not, by itself, produce structure; it produces cramped rows
with nothing to lock onto, unless the whitespace itself becomes a repeatable, exact unit that steps
to a visibly larger unit exactly where a group ends. Content-driven spacing (however tall the text
needs) reads as accidental; a fixed pitch reads as a decision.

**Evidence.** Row pitch measured **56.0pt with zero variance** across 19 rows spanning two
different screens (`airbnb--profile-list.md`, deltas 168/168/169/168/168/170px = 56.0pt on
`S6900`, then 168px again on all nine rows of `S6901`, then reconfirmed at a different scroll
position on `S6902`). At a group boundary the same pitch steps to **267px = 89.0pt**, roughly
**1.59x** the normal row gap, not an arbitrary jump but the same repeatable step every time a group
ends. Solen's own `LOCKFILE.md:571` independently prescribes the same 56px pitch once a box is
removed, arrived at from a different reference pixel-sample dated 2026-07-28, and Solen's **FLOORS
LAW 5** already requires "between-group gap >= 2x in-group gap" for exactly this reason, a
distinctly larger step at boundaries. Worth naming plainly: Airbnb's own measured ratio (1.59x)
sits BELOW Solen's own floor (2x). This is not a contradiction to resolve, Solen's rule is a
minimum and Airbnb is one data point, but it is worth recording that the reference is, on this one
axis, a looser example than the floor Solen already enforces on itself.

**Counter-case.** A fixed fake pitch is wrong when row content genuinely varies (a two-line
subline next to a one-line one); forcing every row to an identical box height then either clips
content or forces artificial truncation. The fixed-pitch grammar belongs to lists whose rows really
are uniform (Recipe A, an icon-nav list with no sublines); a list of rows that legitimately carry
variable content (Recipe B, Airbnb's own "Login & security" detail rows, measured with no fixed
pitch since sublines vary row height) is a different, equally valid recipe, and forcing it into
Recipe A's rhythm would crop real content.

**Check.** Measure the gap between adjacent rows at three or more points down a list. If the values
differ by more than rounding, spacing is content-driven, not structural, in which case a bounded
container may be the more honest choice (Principle 2's earned case 2 or 3). If the values agree,
confirm the gap at a group boundary is a distinctly larger, equally-fixed number, not just "some
extra margin."

---

## Principle 6 , On an information/settings-type screen, color is reserved for wayfinding or status the user must notice regardless of reading order. It is never spent on making an icon "feel alive."

**The rule.** A neutral, mostly-grayscale screen is not an absence of design decisions, it is a
color budget spent on exactly two jobs: marking which persistent navigation element is currently
active (wayfinding), and semantic status information the user needs even if they are skimming (an
error, a live discount, a state that changed). An icon or element being colored somewhere ELSE in
the product for a real reason does not, by itself, earn that same color on a screen where the color
carries no information, just personality.

**Evidence.** Airbnb's account surface runs a **12-step neutral grey ramp and nothing else**
(`AB-LIVE-390`: `#FFFFFF` through `#000000`), with the single brand color, Rausch `#FF385C`,
appearing on these screens **only** as the active tab-bar glyph, pure wayfinding, "you are on the
Profile tab." Zero other chromatic pixels anywhere on the measured screens. Solen's account hub
carried a pink `#FF3366` heart icon on the Saved row (`AccountHub.tsx:167`, now removed per the
owner's own most recent ask), which the owner named directly as looking out of place, the one
chromatic pixel on an otherwise neutral screen, present for no reason connected to the screen's own
job (it is not a live toggle state here, unlike the same heart mid-browse on a salon card, where
color communicates "you saved this, tap to unsave"). This generalizes Solen's own already-locked
stance on blue (taste rule 3, sparse, small clickable bits only) to every semantic hue, not just
blue, specifically on list/settings-type surfaces.

**Counter-case.** The same color is correct and required elsewhere in the product when it carries
real information: a save-heart mid-browse (a live toggle the user is actively setting), a discount
badge on a card (a real, currently-true price fact), an error state (something broke, notice now).
The rule is not "never use color," it is "color earns its place by the information it carries on
THIS screen," and a color that is correct in one context does not travel automatically to every
other screen the same component appears on.

**Check.** For every chromatic (non-grayscale) pixel on a rendered screen, ask: does removing the
color lose the user actionable information right now, or only "liveliness"? If the former, keep it
and confirm it is doing exactly one job (wayfinding or status). If the latter, and especially if it
is the only chromatic element in an otherwise neutral screen, it is decoration riding on a
component's coloring from a different context, and this principle removes it here.

---

## How each principle applies to our other screens

The chrome finding (Principle 1) is not a `/profile`-specific bug; it is a branch in one shared
component, `Header.tsx`. Reading `showCategoryChrome = isHome || categorySegment || isDiscover`
(`Header.tsx:442`) against the file's own comment, *"Deep pages (profile, PDP, etc.) still keep
this row"* (`:704-705`), shows the violation is precisely isolated: **home, every category/search
route, and Inspo already exempt themselves** from the back+title+bell+hamburger stack, because each
of those three folds the site-nav trigger into its OWN chrome (the home search pill, the
category-route search bar, Inspo's own top slot) instead of duplicating a second nav surface. The
violation lives in the OTHER branch, applying identically to `/profile`, the PDP, the booking flow,
and every settings sub-page, all of which share this exact code path. That is worth stating plainly
rather than papering over: on Principle 1 specifically, home and Inspo are not the screens to fix,
they are the proof that the fix (fold the nav trigger into the screen's own chrome) already works
somewhere in this codebase; the deep-page branch is what still needs it.

**Home feed** (`app/[locale]/page.tsx`). Chrome-wise, already compliant (see above): the homepage
shows the Solen wordmark, not a redundant home icon pointing at itself (`Header.tsx:729-741`,
`isHome` branch, an owner fix already landed 2026-06-29), and the hamburger's job legitimately
belongs here since home's job genuinely is "the whole site," matching Airbnb's own bottom-tab-owns-
nav logic. What changes on home is Principle 4: `ForYouGreeting`, `SalonOfMonth`,
`ArtistOfTheMonth`, `AvailableThisWeek`, and the rest of the home feed's roughly dozen sections
(`app/[locale]/_components/homepage/*`) are currently peers of equal visual weight in one scroll.
Applying Principle 4's test, if a returning user has a live, time-sensitive fact (an upcoming
booking, an expiring voucher), that fact is a promotion candidate for its own band above the
generic feed sections, the way Airbnb's "Become a host" card sits above its flat rows, not because
it's commercially valuable but because it has a clock on it the generic feed content does not. This
specific check (is there a time-sensitive fact currently sitting at the same weight as a marketing
section) was not re-verified against home's live render this session; it is the concrete test
Principle 4 hands to whoever verifies it next.

**A category page** (`app/[locale]/[city]/[category]/page.tsx`, via `SearchTemplate.tsx`).
Chrome-wise, already compliant for the same reason as home (`categorySegment` truthy routes into
`showCategoryChrome`). Grepping `SearchTemplate.tsx` this session for container/divider/type
patterns found borders used on individually interactive controls, the search pill, filter chips,
sort buttons (`SearchTemplate.tsx:1298, 1594, 1962`), each a genuinely distinct tappable control,
which is Principle 2's earned case 3 (the container is itself tappable as a unit), not the
homogeneous-list mistake `AccountHub.tsx` makes. The salon results themselves are individual entity
cards, Principle 2's earned case 2 (peer items competing in one scroll, each needing its own
boundary), already the locked `SalonResultCard` grammar. What Principle 3 would still check here,
not verified this session: `SearchTemplate.tsx` carries at least four distinct inline text sizes in
the excerpt read this session (16px, 14px, 13px, 20px) before counting the result cards' own type;
whoever verifies this screen next should count every (size, weight) pair actually visible in one
390x844 viewport against the same 4-size ceiling and emphasis-budget check Principle 3 states, since
a search page composes a search bar, filter row, and result grid, exactly the kind of
widget-by-widget accumulation Principle 3 warns produces tiers nobody decided on purpose.

**Inspo** (`app/[locale]/inspo/page.tsx`, the `isDiscover` tab root). Chrome-wise, already
compliant for the same structural reason (`isDiscover` routes into `showCategoryChrome`, and the
file's own comment confirms the standalone title was deliberately removed because "the header's
logo slot" already owns it, `inspo/page.tsx:470`, avoiding the exact double-title mistake Principle
1 is built to catch). Where Principle 2 applies concretely: Inspo's filter panel
(`inspo/page.tsx:517`) is a dropdown overlay, `rounded-2xl border ... shadow-elevation-2`, which is
the LOCKFILE's own legal overlay case, not a violation. The category-pill row
(`inspo/page.tsx:613-616`) is neutral, unselected white-bordered pills, matching the locked filter-
pill grammar already, so Principle 6's color-budget check is already satisfied on the one Inspo
surface read this session. What was NOT re-verified this session, and is exactly what Principle 4
would check once Inspo's card grid is measured: whether every board/look tile in the masonry
currently renders at one uniform weight, or whether anything (a currently-trending look, a look
matching the user's own Hair DNA per the existing personalization system) is a legitimate promotion
candidate the same way Airbnb reserves ONE promoted card per screen. That is a measurement for
whoever builds Inspo's next pass, not a claim made here.

---

## Not measured

- **Airbnb's account screens' own emphasis-budget percentage** (share of text at weight >=600).
  Their live token system names only three weight words for the whole system and the row label on
  this specific screen is confirmed weight 400, but no one has counted every weight-bearing element
  on `S6900`/`S6901` the way `O-PROF` was counted for Solen. The 33.3%-vs-reference comparison in
  Principle 3 is therefore a comparison of Solen's own measured number against a qualitative "about
  three sizes, one confirmed unemphasized label," not two directly comparable percentages.
- **Home feed's, category page's, and Inspo's own live type-tier counts and weight percentages**,
  beyond the few inline classes read directly in this session's greps. Principle 3's check is
  handed to whoever verifies each screen next, not pre-computed here, per this task's instruction
  not to substitute an invented number for an unmeasured one.
- **Whether any home-feed or Inspo content currently qualifies as a Principle-4 promotion
  candidate.** Named as the concrete test to run, not run here; running it needs a live render with
  real seeded per-user data (an actual upcoming booking, an actual trending look) which this pass
  did not fetch.
- **Motion, press, and hover states**, on both the reference and our own screens, for all six
  principles. The reference is five static stills; nothing about transitions can be read from them,
  a limitation already stated in the two source measurement files and carried forward unchanged.
- **The PDP and booking flow's own chrome**, cited above only via `Header.tsx`'s own comment
  naming them as sharing the deep-page branch; neither was independently re-rendered this session to
  confirm the same bell+hamburger stack is currently visible on them.

---

## Six boxes closed, one downgraded

The parent workstream's `_plans/DESIGN_SYSTEM_RENEWAL_2026-08-02.md` still carries open items (A8,
A10, E4d, F1) that this document does not touch: they require product code, mockups, or hook edits,
all explicitly out of scope for this deliverable. This file's job was narrower and is complete: turn
the measured Airbnb research into principles general enough to check a screen nobody has measured
yet, and name, for each, the evidence, the counter-case, and the check. Flagging the open plan-file
boxes back rather than silently working them, since acting on them would mean writing product code
or mockups this task explicitly forbids.
