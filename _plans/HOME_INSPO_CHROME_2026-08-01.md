# HOME + INSPO CHROME , owner dictation 2026-08-01

12 asks, atomized. Every box carries the file:line or the measurement that grounds it, taken from
the LIVE page at 390x844 this turn, not from reading source. Live tunnel:
https://admission-integrated-achieved-assumption.trycloudflare.com

**Standing constraints on this batch, named up front so they are not rediscovered per item:**
- Mockup FIRST for every appearance change (CLAUDE.md). Two items here are REPEATS of calls the
  owner already made, and those apply directly under the `mockup-ok` escape with the quote cited
  in the code. Everything else needs a mockup he says yes to before real code moves.
- H2 names Airbnb. That is a brand motion reference, so `Skill(reference-lock)` fires and the real
  thing gets CAPTURED (video + computed styles + animation timeline). Building an "Airbnb-like"
  transition from memory is the banned failure mode, and the drift ledger already has two entries
  for exactly this shape.
- H5 ("make a new homepage") is a design fork, not an instruction. It gets 3 directions to react to.

---

## A. Chrome geometry + behaviour (home)

- [x] **H1. verified:** revert proved by `grep -c pillsSticky Header.tsx` = **0** and
      `grep -c "What the fuck are you doing bro" Header.tsx` = **3** (the rejection at
      `Header.tsx:595` and `:997` is intact). Commit `e616b8a65`.
      **CLOSED AS ALREADY-DECIDED, AND I ALMOST RE-SHIPPED SOMETHING HE REJECTED. 2026-08-02.**
      I briefed a coder to pin the pills AND the search bar together, straight off this box's own
      wording. It built exactly that, and in doing so DELETED the comment recording the owner's
      rejection of that very thing, one day old, in his own words, at `Header.tsx:595` and `:997`:
      **"why is the category pills still sticky? What the fuck are you doing bro? No."**
      The agent flagged the collision instead of quietly shipping it, which is the only reason this
      was caught. **Reverted in full** (`git checkout` on Header.tsx + page.tsx; the rejection
      comment is back, 3 occurrences; `grep -c pillsSticky` = 0).
      RESOLUTION, by the precedence chain: rule 1, a live rejection outranks an earlier approval.
      The 2026-08-01 "No" is later than the dictation this box came from, so the shipped behaviour
      is correct as-is: the search pill is the ONE thing that pins, the pills scroll away.
      Measured live after the revert: exactly one sticky element on the page.
      THE LESSON, and it is mine not the agent's: I wrote a brief from a plan box without checking
      whether the thing it asked for had already been ruled on. The plan file is not the record of
      what he wants, the latest decision is, and that decision was sitting in the file I was
      changing.
- [x] **H3. verified:** `Header.tsx:621` now carries `showCategoryChrome && "max-md:!py-0"`.
      Measured live at 390x844 after the change: header height **0** (`position: static`), first
      pill top **12px**, search pill top **103px**, and exactly ONE sticky element on the page.
      Before: header 24px, first pill 36px. `npx tsc --noEmit` exit 0. Commit `e616b8a65`.
      **FIXED, spacing only. Owner: "the header, the category and the search bar, they're
      placed too low and it looks kind of weird".** On every route showing the category chrome the
      header's own mobile row is `max-md:hidden`, so on a phone that box rendered nothing and its
      padding was pure empty band. Zeroed on mobile only (`showCategoryChrome && "max-md:!py-0"`),
      desktop untouched.
      Measured live at 390 wide, cookie banner dismissed: **header height 24px -> 0**, first pill
      **top 36px -> 12px**. Search pill at 103. `npx tsc --noEmit` exit 0.
- [x] **H6. verified:** a real click at the search pill centre navigates to **`/de/search`**,
      measured on the live page at 390x844 both at scroll 0 and scrolled to y=1200, not inferred
      from code. The header that was blamed measures `position: static`, height 0. Commit
      `e616b8a65`.
      **NOT A BUG ANY MORE, and the earlier diagnosis in this file is stale.** This box says a
      transparent 102px sticky header eats the tap so search lands on /de/coiffeur. Re-measured on
      the live page 2026-08-02: the header is `position: static`, height 0 on mobile, and a real
      click at the search pill's centre navigates to **/de/search**. The tap-eating was fixed by
      the same-day OVERRIDE that un-stuck the header. Nothing to do.
  > TRAIL, not open work. **H1-ORIGINAL (superseded by the override above, kept for the trail).** Owner: "when you scroll down the search bar and the categories should be sticky".
      MEASURED: `<header>` is already `position: sticky`, `top: 0`, height **102px**. The category
      pills and the search pill are NOT inside it, they sit below at top 117+ and scroll away.
      So this is not "make the header sticky", it is "move these two rows into the sticky region,
      or give them their own". Watch the stacked height: 102 + pills + pill row eats a third of a
      390x844 viewport if all three pin at once. Decide what pins and what scrolls away.
  > TRAIL, not open work. **H3-ORIGINAL (done above, kept for the trail).** Owner: "the header, the category and the search bar, they're placed too low and it looks kind of weird".
      MEASURED: content starts at y=102 and the first control (the hamburger) at y=**117**, so
      there is a ~102px band above the first thing the eye lands on. Confirmed visually in
      `scratchpad/shot-de.png`: a large empty band above the category pills.
      Fix is a spacing change in `_components/layout/Header.tsx` (the 102px) plus whatever pads
      `HomeSearchPill`. Needs a mockup, it is an appearance change.
- [x] **H4. FIXED, and verified against the code rather than assumed. Commit `99d4f7474`.**
      The measured cause was three things stacked: a `border-b border-s-border` hairline on the
      newsletter strip, the sunken-to-white flip directly beneath it, and both seen through a
      `bg-white/45 backdrop-blur-[22px] backdrop-saturate-[1.6]` layer on `<footer>` itself.
      That commit removes ALL THREE: the footer no longer carries the translucent blur wrapper, and
      the strip drops its `border-b` so the sunken-tray edge is the single boundary
      (`Footer.tsx:100-103`, both lines carry the reasoning in-code). This satisfies FLOORS LAW 4,
      which the stacked version broke by being a hairline and a tray edge at once through a blur.
      Re-render check is owed once the sticky-header work lands, since that changes the page above it.
  > TRAIL, not open work. **H4-OLD (superseded, kept for the trail). A weird divider near the bottom.** Owner: "I don't like this weird divider thingy at the bottom".
      NOT YET LOCATED. The dictation says "a weird divider like a sheep thingy at the bottom".
      BLOCKER, concrete: which page and roughly how far down. I measured the home first viewport
      only. Next step is a full-page screenshot at 390 wide and a walk down it looking for a rule
      or separator that is not in the divider ladder, then confirm with him it is the one he means.
- [x] **H9. Hamburger in the search bar is BARE, no circle. REPEAT , he had already said this.**
      PROOF it was circled: the live button computed `border-radius: 9999px` +
      `border: 1px solid #E4E4E7`, 44x44 at y=117, class
      `grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border`.
      FIXED at `app/[locale]/_components/homepage/HomeSearchPill.tsx:139` , ring and border removed,
      44px hit area kept (touch-target floor), hover moved from a background fill to a text tone.
      Applied under `mockup-ok` with his quote in the code, because a repeat of a call he already
      made is not a new design choice.
      STILL CIRCLED ELSEWHERE, and he only named the search bar, so these are NOT touched without
      his word: `inspo/page.tsx:509`, `search/SearchTemplate.tsx:1397`, and the `trailing="saved"`
      heart in this same file at line 124.

- [ ] **H2. Switching categories should transition smoothly like Airbnb, not a page load.** Owner: "when you switch between the categories it loads like another page, make it elegant like Airbnb does it, on Airbnb it's really smooth".
      Today each category is a route (`/{city}/{category}`), so switching is a full navigation.
      Airbnb's is a client-side content swap with the chrome held still.
      ORDER OF WORK: reference-lock capture FIRST (record the real airbnb.com category switch,
      pull the actual timing and easing), THEN propose. Do not name a duration from memory.

## B. Broken behaviour (home)

  > TRAIL, not open work. **H6-ORIGINAL (resolved above, kept for the trail).**
      GROUNDED: `HomeSearchPill.tsx:108` wraps the bar in `<Link href={/${locale}/search}>`, so it
      navigates instead of opening the built search surface. `SearchTemplate.tsx` is the real thing
      (1400+ lines, its own search bar, filters, map button).
      **NOT PROVEN YET, and I am not going to claim it is.** I tried to tap it in a real browser
      twice. Both times the element carrying the word "Suchen" resolved to a **zero-size** box
      that is not inside a link, i.e. I was matching a hidden duplicate, not the bar he can see.
      The same trap bit the hamburger this turn (a hidden `Header.tsx` copy with a 16px radius
      shadowed the visible one in the pill), so the lesson generalises: on this page several
      controls exist twice and the invisible one wins a naive selector.
      NEXT STEP, concrete: target the VISIBLE node by filtering on a non-zero bounding box first,
      then tap and record what happens. Do not edit the wiring until that tap is on record.
- [x] **H7. FIXED and VERIFIED LIVE 2026-08-02, not taken from the code comment.** Opened the menu
      on the running site and read the DOM: **1** close control where the earlier measurement found
      zero. `aria-label="Menü schliessen"`, **38x38**, `border-radius: 9999px`, i.e. exactly the
      design-system 38px circled X that CLAUDE.md copy-economy rule 5 mandates, NOT the bare
      treatment H9 asked for on the search bar. The distinction held.
- [x] **H7-ORIGINAL. Hamburger menu has no close / X.** Owner: "the hamburger menu when you click it, there's no X".
      The menu opens via a `solen:open-menu` window event
      (`HomeSearchPill.tsx:137` -> `Header.tsx:530`). Need to open it live and check the close
      affordance. Design-system close is the 38px circled X (CLAUDE.md copy-economy 5), so this one
      IS circled by law , do not "fix" it to bare by pattern-matching H9.
      **CONFIRMED LIVE this turn.** Opened the menu in a real browser at 390x844: 14 visible items,
      and a scan for any control whose label or text matches close / schliessen / x returned
      **zero**. Screenshot: `scratchpad/v-h7-menu.png`. He is right, there is no way out of the
      menu except the back gesture.
- [x] **H8. FIXED and VERIFIED LIVE 2026-08-02.** The menu's first item now renders at
      **top = 24px**, against the **64px** empty band the earlier measurement recorded. The panel
      padding is now `pt-[max(16px,env(safe-area-inset-top))]`, so it also respects the notch
      instead of hard-coding clearance for a header X that no longer sits there.
- [x] **H8-ORIGINAL. Hamburger content sits too low.** Owner: "everything is just too low inside the hamburger menu, fix that".
      **CONFIRMED LIVE this turn, and it is NOT the same root as H3.** The menu panel starts at
      y=0 but its first item ("Basel") starts at **y=64**, so there is a 64px empty band inside
      the panel itself. Visible in `scratchpad/v-h7-menu.png`. That is a padding on the panel,
      independent of the 102px header band in H3, so fixing H3 will not fix this.

## C. Inspo page

- [x] **H10. verified ALREADY DONE, not new work this turn.** Live at 390x844: the resting bar is
      `HomeSearchPill` with `trailing="saved"` (`inspo/page.tsx:509-514`), 358x66, heart at
      top:113/left:329 which is inside the bar's box (top:88-154, left:16-374). No hand-rolled heart
      button remains (`InspoSearchChrome` grep = 0 hits). Landed earlier in commit `bb688546b`
      ("Inspo composes the same pill as home and the category pages now, 358x66 on all three, with
      the heart inside its bounding box") but never ticked here. Tap-to-edit reconfirmed this turn:
      clicking the resting label mounts `<input placeholder="Styles suchen...">` and focuses it
      (`document.activeElement` = that input).
- [x] **H11. verified:** commit `d4a2f632c`, `components-legacy/discovery/FilterDrawer.tsx`.
      Measured on the live page at 390x844 AFTER the change: the filter trigger computes
      `border-width: 1px`, `border-color: rgb(228,228,231)` (#E4E4E7) and
      `box-shadow: rgba(0,0,0,0.07) 0px 2px 8px 0px`. BEFORE it was `shadow-whisper`,
      border-width 0 with a diffuse `rgba(10,10,10,.04) 0 1px 3px, rgba(10,10,10,.1) 0 10px 28px -14px`.
      The applied recipe is copied from the shipped controls, not invented: `HomeSearchPill.tsx:92`,
      `ContinueCard.tsx:168`, `SearchTemplate.tsx:1303` all already carry it.
      **FIXED and verified live 2026-08-02.** Named row: none of the six rows in CLAUDE.md's ONE
      surface table (SalonCard / grouped-list / PDP-sidebar / gray-tray tile / overlay-sheet / "a card
      drops its border") literally covers a small standalone pill sitting on plain white, that table
      enumerates CARD surfaces. The applicable reference is the site's own resting-white-PILL recipe,
      shared verbatim by `HomeSearchPill.tsx:92`, `ContinueCard.tsx:168` and `SearchTemplate.tsx:1303`
      (`border border-s-border` + `shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]`), measured live off
      `HomeSearchPill`'s own bar: border-width 1px, border-color `rgb(228,228,231)` (`#E4E4E7`),
      box-shadow `rgba(0,0,0,0.07) 0 2px 8px 0`. A prior pass (`bb688546b`, 2026-08-01) had already
      moved the Inspo `FilterDrawer` trigger + chip row from a bare hairline to `shadow-whisper`, which
      is why the owner's complaint read as a repeat, `shadow-whisper` is a different, more diffuse
      recipe than what home/category actually use. Swapped both the trigger
      (`FilterDrawer.tsx:69-75`) and the unselected chip (`inspo/page.tsx`, chip row) to the exact
      measured recipe; selected ink-fill chip state untouched. Live after: trigger + all 5 sampled
      chips report `border-width:1px`, `border-color:rgb(228,228,231)`, `box-shadow: rgba(0,0,0,0.07)
      0px 2px 8px 0px`. Screenshot confirms a visible shadow under every chip.
- [x] **H12. verified:** commit `d4a2f632c`, `app/[locale]/inspo/page.tsx`. Measured live at
      390x844 AFTER: filter row **top 174**, "Für dich" **top 298**, so the filter leads.
      BEFORE: category row 174, filter row 284. Masonry unaffected, **22 images** both sides.
      `npx tsc --noEmit` exit 0.
      **FIXED and verified live 2026-08-02.** Checked `project_inspo_progressive_filter` memory
      first: no position lock there (it specs L0/L1/L2 drill-down levels, not row order). Found the
      actual lock in `TASTE_LOG.md` ("Inspo home chrome" entry, 2026-06-20 council+owner): "category
      pills are the first control". Named it rather than silently moving a locked element, and applied
      the precedence chain's rule 1 (a live, later owner ask outranks an earlier approval): this
      dispatch's 2026-08-01/08-02 ask is later and supersedes the 2026-06-20 order. Swapped the two
      JSX blocks in `inspo/page.tsx` (no logic touched, both blocks moved verbatim) and rebalanced
      each row's own bottom margin (filter row 20px->12px, category row 12px->20px) so the original
      12/12/20 vertical rhythm survives the reorder instead of compressing the last gap. Measured live:
      filter row (trigger + chips) now at top:174, "Für dich" now at top:226 (was 174/284 before,
      i.e. exactly swapped).

## D. The big one

- [x] **H5. verified: commit `01187352e` + REMOVED.md line dated 2026-08-02.** Withdrawn by the owner. Graveyard line filed in
      `_design-system/REMOVED.md` ("less white homepage, home-v4, new homepage mockup, too white",
      dated 2026-08-02), so `npm run exists` now returns a REMOVED hit for anyone who tries to
      re-propose it. The built file stays at `public/_mockups/home-v4/less-white.html`.
      **WITHDRAWN BY THE OWNER 2026-08-02: "i never told u i want to make mockup ignore wtv u
      thought i said abt homepage". Not an ask. Do not re-open it from this file.**
      What went wrong on my side, recorded so the shape is visible rather than the incident: this
      box was written by a different session from a dictation, and I treated the written line as a
      live instruction. A plan file is a RECORD of what was said, not a standing order, and it goes
      stale the moment he changes his mind, which is the same failure as the sticky-pills revert
      earlier this session, where I briefed an agent off a box he had already overruled. Twice in
      one session, same cause: the plan file outranked the person in my reading order.
      The mockup that got built anyway is at `public/_mockups/home-v4/less-white.html`. Left on
      disk (it costs nothing and the measurement work in it is real) but it is NOT a deliverable
      and must not be offered to him again.
  > TRAIL, not open work. H5-ORIGINAL. **Too white, make a new homepage.** Owner: "I don't like that it's just white, make a new homepage".
      This is a fork, not a task. It also collides with two live laws that must be named in the
      same breath rather than discovered mid-build: WEB IS ONE LIGHT THEME (no dark mode, rejected
      twice by name), and the imagery floor is satisfied by MORE REAL STORE CONTENT, never by a
      hero photo or a banner (rejected three times, his words: "no other company has just image
      hard coded baked into a random area, SHOW OFF THE STORES THAT WE HAVE").
      So "less white" has to come from content density, photography that is real salon data,
      the sunken tray rhythm, and semantic-colour moments. DELIVERABLE: 3 distinct directions as
      mockups, each with a recommendation, not one.

## E. Found by looking, not by asking

- [x] **H13. "Für Salons" was still on screen after the rename shipped.**
      Not one of his twelve. It was sitting in the hamburger menu screenshot, in the heading above
      the partner card, and the static sweep never saw it because the sweep counted string
      literals and this is JSX text.
      FIXED: `_components/layout/MobileMenu.tsx:371` and `_components/homepage/WhySolen.tsx:114`.
      Worth naming as a method point rather than a typo: the rename was verified by grep and by
      typecheck, both passed, and the word was still on the homepage. Opening the page is what
      found it, the same way opening the page is what found the two database strings.

---

# MEASURED 2026-08-01, after "you need to fucking measure that, why are you fucking asking me"

He was right. Three boxes above were handed back to him as questions when a browser answered
all three. Measured now, on the live page at 390x844, cookie banner dismissed first (it shifts
the layout, which is why an earlier reading put the hamburger at y=117 and this one puts the
search text at y=61).

## H4 , THE DIVIDER. Found. It is above the footer, and it is three things stacked.
Page is 4691px tall. At **y=3810** the newsletter strip renders
`border-b border-s-border bg-s-bg-sunken`, 170px tall. It sits inside a wrapper that is
**`bg-white/45 backdrop-blur-[22px]`**, i.e. a milky translucent layer, and directly beneath it
at **y=3980** the footer flips hard to `bg-white`.
So the "weird divider / sheep thingy" is a **hairline + a hard grey-to-white flip, seen through a
45% white blur**. That is why it reads as a washed-out seam rather than a section change. Visible
in `scratchpad/m-bottom-92.png`. It also breaks FLOORS LAW 4 (edge visibility): the boundary is
neither a clean sunken tray nor a hairline, it is both at once through a blur.

## H1 , THE STICKY BAR. Measured, and the finding inverts the ask.
Scrolled to y=1200 and re-read every fixed/sticky element. **Exactly one thing pins: `<header>`,
102px tall.** The category pills and the search pill are NOT in it and scroll away.
And the header is **`bg-transparent`**. So today 102px of EMPTY, INVISIBLE chrome is pinned to the
top of every scroll while the two controls a user actually wants pinned scroll off screen.
That is the whole complaint, and it is not "add sticky", it is "the sticky region is holding the
wrong thing".

## H6 , THE DEAD SEARCH TAP. Root cause found, and it is the same bug as H1.
The search pill IS correctly wrapped in `<a href="/de/search">`. Clicking its centre navigated to
**`/de/coiffeur`**, not to search. Reason: with the cookie banner gone the search text sits at
**y=61**, which is INSIDE the transparent 102px `z-50` sticky header. The header has no background
so nothing looks wrong, but it is on top, so the tap lands on the category row behind it instead
of the link underneath.
So H6 is not a wiring bug and the earlier note guessing that was wrong. **The transparent sticky
header is eating taps meant for the search bar.** Fixing H1's stacking fixes H6 for free.

## H8 , menu padding = 64px on the panel itself (already recorded above).
## H7 , zero close controls in the open menu (already recorded above).

---

# HARDENED THIS TURN

`~/.claude/hooks/measure-dont-ask-gate.py`, self-test **13/13**, blocks a closing message that
asks the owner a question whose answer is a position, size, count, colour, or which-element.
Exempts what is genuinely his: taste forks, product and money policy, a word's connotation,
approving a mockup, credentials, destructive ops. Also exempts a question that ships a rendered
artifact with it, and one that names what was measured and why it was not decisive.
NOT ARMED YET (`~/.claude/settings.json` is not writable from here);
`python3 ~/.claude/hooks/wire-pending-gates.py` from a normal shell picks it up with the rest.


## VERIFICATION 2026-08-02, owner asked "verify i made the homepage n acc page acc like the mockups"

**Is the other session's work here?** Yes. Working tree clean, 441 commits ahead of `main`,
`npx tsc --noEmit` exit 0.

**HOMEPAGE vs `public/_mockups/home-v3/search-a.html` (All tab): 11 of 12 sections MATCH, in the
mockup's exact order.** Both measured live at 390x844, real page scrolled to force lazy sections.

| mockup | live `/de` |
|---|---|
| Recently viewed | Zuletzt, y=236 |
| Top on Solen | Top auf Solen, y=323 |
| Nearby | In der Nähe, y=651 |
| **Available this week** | **ABSENT** |
| Top hair salons | Top Coiffeur, y=1139 |
| Top Barbershops | Top Barber, y=1466 |
| Top nail studios | Top Nails, y=1794 |
| Top Spas | Top Spa, y=2122 |
| Popular looks | Beliebte Looks, y=2450 |
| Walk-in | Walk-in, y=2816 |
| Find your inspiration | Finde deine Inspiration, y=3155 |
| Reviews | Bewertungen, y=3579 |

Pills match exactly on both: All / Coiffeur / Barber / Nails / Spa / Inspo, All selected.
Business teaser + newsletter are correctly absent on mobile (the mockup ends at Reviews).

**The one gap is DATA, not code.** `AvailableThisWeek` IS mounted (`app/[locale]/page.tsx:268`)
and self-hides at `rows.length < 2` (`AvailableThisWeek.tsx:81`). Probed the live API:
`GET /api/salons?date=2026-08-04&limit=50` returns **1** salon with availability, total 1. One is
below the floor of two, so the section hides rather than render a one-item rail. That is the
no-fabrication rule working, not a bug. It appears the moment a second salon has real slots.

- [x] V1. **DECIDED: leave it, no code change. verified:** the section is mounted at
      `app/[locale]/page.tsx:268` and self-hides at `rows.length < 2`
      (`AvailableThisWeek.tsx:81`); the live API returns **1** salon with availability
      (`GET /api/salons?date=2026-08-04&limit=50` -> 1, total 1). The only alternatives were to
      seed fake slots, which breaks the no-fabrication rule this repo enforces by gate, or to drop
      the floor to 1, which ships a one-item rail that reads as a bug. It appears on its own the
      moment a second store has real hours. Nothing to build.
  > TRAIL, not open work. V1-ORIGINAL. Decide the Available-this-week gap: seed more bookable slots so the rail passes its
      floor of 2, or accept that it hides until real salons open real hours. Owner's call, it is a
      seeding decision, not a design one.

**ACCOUNT PAGE: NOT REBUILT. The other session never touched it.** `git log -40 --name-only` over
`profile|konto|account` returns only `profile/favorites`, `profile/looks`, `profile/stamps`, and
those three appear solely in `5983225b2`, the Salon -> Store copy rename. The last design change to
`app/[locale]/profile` before that was `cf158de81` on 2026-07-27. So the account page cannot match
any mockup better than it did a week ago.

Rendered `/de/profile` via `GET /api/dev/login?to=/de/profile`. Live: avatar + initials, a
Gespeichert/Termine underline-tab split, a search input, a Sortieren pill, three-photo collage
cards, a "Neu für dich" row. `_mockups/konto-redesign.html` (owner-approved 2026-06-12, `fe92390d8`)
is a different page entirely: name + email + member-since, a Next-appointment card carrying date,
service, status, address and total, an Activity grid (Appointments / Favorites / Loyalty / Wallet /
Gift cards), a More list (Hair profile, Looks, Vouchers, Forms, Invite friends, Settings, Help,
Sign out), and **no search bar**.

Two floors this repo already documents are visibly live on that page right now:
- **FLOORS LAW 10**: the profile carries a search bar. That floor exists *because* the owner asked
  why his own profile has one.
- **FLOORS LAW 8**: the same salon renders as a 3-photo collage with no price here and as a single
  photo with rating + PLZ + price on `/de`. Two anatomies for one entity, which is the exact case
  that floor was written from.

- [ ] V2. Account page needs a decision before any build: `konto-redesign.html` is from June and at
      least 8 profile mockups exist (`profile-typescale-fs`, `sweep-profile-*`,
      `restraint/account-hub`, `everystate-v2/07-profile`). Which one is canonical? Naming it is the
      owner's call; the two floor violations above are fixable regardless of which he picks.

**Debris found:** four `_verify_*.mjs` scripts were committed to the repo root in `086379e46`.
