# Bottom nav + the animated icons (owner 2026-08-10, after picking option C)

His words: *"I saw the hamburger menu. I think I want to, like, have, like, an add, like, a bottom
navigation bar for, you know, the web area, so it's actually, like, easier... So how do you think?
And also the Airbnb still animated icons are on branch claude/airbnb-animated-icons-ee4329."*

## Atomic asks

- [x] A1. My opinion on the bottom nav, asked directly ("how do you think?").
     ANSWERED: yes, do it, and the objection I was going to raise turned out to be false. I was
     about to say a bottom bar is an APP pattern that mobile web does not use. verified: measured
     airbnb.ch live at 375x812 and they DO ship one, three items, fixed, 24px icons. The two real
     costs, both named rather than smoothed over: their 10px label breaks our 12px legibility floor
     so ours is taller, and the PDP already owns the bottom with its Buchen bar so the nav has to
     yield there.
- [x] A2. Build the bottom navigation bar for mobile web.
     verified: `app/[locale]/_components/layout/BottomNav.tsx`, mounted in layout.tsx. Measured
     live on /de at 375x812: bar 57px pinned 755 to 812, white, 1px #E4E4E7 hairline, no shadow,
     z-700 (below the PDP commit bar at 800). Four items at 90x56, icon 24, label 12px. Active ink
     #0A0A0A at 600, inactive #6B6B6B at 400. On the PDP: exactly ONE fixed bottom bar renders, the
     Buchen one, and the nav measures 0x0.
- [x] A3. Remove the hamburger from the search bar.
     verified: removed from BOTH sites, not just the one in front of me: HomeSearchPill.tsx and
     SearchTemplate.tsx (that one covers all four category routes). Measured live: zero hamburgers
     inside any search pill. The menu is not stranded, and I clicked it to prove it rather than
     assuming: the fourth nav item opens the same sheet, carrying Basel, Profil, Treuekarte,
     Freunde einladen, Hilfe, Anmelden, Warum Solen and the Deutsch switcher.
- [x] A4. The Airbnb animated icons.
     FOUND, and the answer is not what the message assumed. That branch is MERGED, so nothing is
     stranded: the clips are already in main at `public/_pixel-refs/solen-icons/out/`, 12 files,
     built over 43 rounds of his feedback. verified: a grep for `solen-icons` across app/, lib/
     and components-legacy/ on main returns **0 render sites**. Finished work that never reached a
     screen.
     NOT WIRED INTO THE LIVE ROW, with a concrete reason rather than a punt: only 2 of the 5 pill
     categories have a mesh AND a clip (Coiffeur, Barber). Nails, Spa and Inspo have neither.
     Shipping that gives two moving icons beside three still ones in one row, which is the same
     one-thing-two-ways defect he named on the hamburger. Making the other three needs the paid
     image-to-3D MCP he told me by name to stop spending on, so it is his call.
     DELIVERED instead: `/dev/animated-icons` plays them in the real pill row, on tap, which is the
     trigger our own Airbnb capture measured (their hover does nothing; a click plays once).
     verified: PLAYBACK measured with Playwright, not with the preview browser, because the preview
     pane backgrounds its own tab between tool calls and a video read in a hidden tab is not a
     measurement. Playwright reports visibilityState "visible" and hasFocus true, both looping clips
     advanced 0.689s across a 700ms wait, and tapping the Barber pill took its video from 0 to
     0.604s with paused false. A busy-wait attempt before that reported 0 advance and was WRONG:
     blocking the main thread also blocks the currentTime update, so it measured my own block.

## Measured before building, not eyeballed

**airbnb.ch, mobile web, 375x812, measured live 2026-08-10.** This kills my own first objection
before I could raise it. I was going to say a bottom bar is an APP pattern and mobile web does not
do it. That is false, and checking took thirty seconds:

| | measured |
|---|---|
| bar | fixed, white, `border-top 1px #EBEBEB`, NO shadow, `z-index 1` |
| height | 125px total, of which 60px is bottom padding for browser chrome and the home indicator |
| items | THREE. Erkunden, Wunschlisten, Einloggen. Each 73x44. |
| icon | 24x24 |
| label | 10px, weight 500 active / 400 inactive |
| active | brand red `#DA1247` on icon AND label |
| inactive | `#6C6C6C` |
| hamburger | none anywhere on the page |

Their top chrome is search pill first, category pills below it, which is the exact order shipped
earlier today, so that half is already matched.

## Two collisions, named rather than resolved quietly

1. **Their 10px label is below our 12px legibility floor** (LOCKFILE 2.5; the A19 drift gate blocks
   sub-12px and is right to). Copying Airbnb here would mean breaking a floor. Ours goes to 12px,
   which makes our bar taller than theirs by a few px. Named, not hidden.
2. **The PDP already has a fixed bottom bar.** `SalonMobileBookBar` (`fixed inset-x-0 bottom-0
   z-[800] lg:hidden`) is the Buchen commit action. Two fixed bars stacked is exactly the "now we
   have two navigation, just clutter" the owner killed on the dashboard on 2026-07-15. So the nav
   HIDES wherever a commit bar owns the bottom. The sticky-CTA floor (hierarchy-density-06) says the
   commit action wins that slot, so this is the floor deciding, not a preference.

## Graveyard

`npm run exists BottomNav` returns two REMOVED rows. Both are NARROWER than they read, and this ask
does not reverse either: 2026-07-02 killed a FABRICATED bar drawn on a map mockup, 2026-07-15 killed
a SECOND nav on the operator dashboard, which already has a sidebar. Neither was about the customer
mobile-web surface, which has no nav of its own at all. A reversal row was filed the same turn so a
future session finds the yes instead of the old no.
