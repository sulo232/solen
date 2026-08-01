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

- [ ] **H1. Search bar + categories should go sticky on scroll.** Owner: "when you scroll down the search bar and the categories should be sticky".
      MEASURED: `<header>` is already `position: sticky`, `top: 0`, height **102px**. The category
      pills and the search pill are NOT inside it, they sit below at top 117+ and scroll away.
      So this is not "make the header sticky", it is "move these two rows into the sticky region,
      or give them their own". Watch the stacked height: 102 + pills + pill row eats a third of a
      390x844 viewport if all three pin at once. Decide what pins and what scrolls away.
- [ ] **H3. Header / category row / search bar all sit too low.** Owner: "the header, the category and the search bar, they're placed too low and it looks kind of weird".
      MEASURED: content starts at y=102 and the first control (the hamburger) at y=**117**, so
      there is a ~102px band above the first thing the eye lands on. Confirmed visually in
      `scratchpad/shot-de.png`: a large empty band above the category pills.
      Fix is a spacing change in `_components/layout/Header.tsx` (the 102px) plus whatever pads
      `HomeSearchPill`. Needs a mockup, it is an appearance change.
- [ ] **H4. A weird divider near the bottom.** Owner: "I don't like this weird divider thingy at the bottom".
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

- [ ] **H6. Clicking search opens nothing, and a full search experience already exists.**
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
- [ ] **H7. Hamburger menu has no close / X.** Owner: "the hamburger menu when you click it, there's no X".
      The menu opens via a `solen:open-menu` window event
      (`HomeSearchPill.tsx:137` -> `Header.tsx:530`). Need to open it live and check the close
      affordance. Design-system close is the 38px circled X (CLAUDE.md copy-economy 5), so this one
      IS circled by law , do not "fix" it to bare by pattern-matching H9.
      **CONFIRMED LIVE this turn.** Opened the menu in a real browser at 390x844: 14 visible items,
      and a scan for any control whose label or text matches close / schliessen / x returned
      **zero**. Screenshot: `scratchpad/v-h7-menu.png`. He is right, there is no way out of the
      menu except the back gesture.
- [ ] **H8. Hamburger content sits too low.** Owner: "everything is just too low inside the hamburger menu, fix that".
      **CONFIRMED LIVE this turn, and it is NOT the same root as H3.** The menu panel starts at
      y=0 but its first item ("Basel") starts at **y=64**, so there is a 64px empty band inside
      the panel itself. Visible in `scratchpad/v-h7-menu.png`. That is a padding on the panel,
      independent of the 102px header band in H3, so fixing H3 will not fix this.

## C. Inspo page

- [ ] **H10. Inspo search bar should be LONG, with the heart INSIDE it.**
      EXISTS-CHECK HIT, and it changes the work: `HomeSearchPill` ALREADY has a `trailing="saved"`
      variant that renders a Heart inside the pill (`HomeSearchPill.tsx:119-129`). Inspo is not
      using it, it hand-rolls its own control at `inspo/page.tsx:509`. So this is COMPOSE THE
      EXISTING COMPONENT, not build a new bar , FLOORS LAW 9 ("screens are composed, not drawn")
      and the drift ledger's search-bar entries both bind here.
- [ ] **H11. Inspo filters have no shadows, whole different style.** Owner: "the filter in the inspo, why are there no shadows, everything is like a whole different style".
      Grade against the ONE surface table in the design contract (SalonCard = photo + whisper +
      no border; tile on a gray tray = white, no shadow; a card carrying elevation drops its
      border). Name which row the Inspo filter is supposed to be before restyling it.
- [ ] **H12. Inspo filter belongs ABOVE the For You section.**
      Ordering change. Check `project_inspo_progressive_filter` first, the 3-level drill-down has a
      defined position, so this may be moving a locked element rather than a loose one.

## D. The big one

- [ ] **H5. Too white, make a new homepage.** Owner: "I don't like that it's just white, make a new homepage".
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

