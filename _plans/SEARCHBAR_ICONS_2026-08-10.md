# CORRECTION round (owner 2026-08-10, angry, three repeats)

His words: *"the search bar should look like this, but whatever the fuck that you're doing is
completely wrong and just inventing, just guessing. I told you to stop doing that. I told you to
harden... go actually research. And I also gave you a fucking branch name for the icons, that I
made new icons, but you still did not do anything... And I told you also to give me variations, so
mockup, for how the bottom bar should look like. But why the fuck did you also not do that? It's
like a recurring pattern."*

## Atomic asks

- [x] C1. The search bar should look like the Airbnb one, researched not guessed. verified: commit 24927506e built /dev/search-bar from a live getComputedStyle read of airbnb.ch at 390 wide; he then picked B-at-rest/C-on-scroll and it is applied at HomeSearchPill.tsx:141-160, measured live as 54 tall with a 1px black ring at scrollY 0 and 44 tall with our hairline at scrollY 200.
      verified: read off airbnb.ch live at a real 390-wide mobile viewport with getComputedStyle,
      not from a screenshot: box 340x54, top 13, radius 40px, border 1px rgb(0,0,0), shadow
      0 6px 20px rgba(0,0,0,0.10), padding 19 a side, justify-content CENTER, label 14px/500, icon
      12x12 with an 8px gap. Ours by the same method: 358x46, top 4, hairline, 0 2px 8px 7%,
      padding 14, LEFT aligned, label 16px/500, icon 18 with a 12px gap. FOUR variations built at
      /dev/search-bar, rendered and screenshotted. NOT applied to the live bar: he picks.
- [x] C2. The new icons he made, from the branch he named.
      verified: they were NOT where I looked. `public/_pixel-refs/solen-icons/out/` holds two, which
      is why I told him only 2 of 5 categories had artwork. That was wrong. FOUR icons are embedded
      as base64 video inside `public/_research/solen-icon-motion.html`, the page he was actually
      shown: barber chair, hair dryer, nail polish, spa stones. Extracted frame 1 of each with
      alpha, cropped and squared to 168px, saved to `public/icons/categories/v2/`, wired into
      CategoryPillRow.tsx:94-97. Measured live on /de at 390: the row renders coiffeur/barber/nails
      from v2. Old files kept for revert.
- [x] C3. Bottom bar variations. verified: /dev/nav-ideas returns HTTP 200 through the tunnel with all four shells (checked this turn, h1 "The sizes, and four bottom bars"); built in commit ffb5eec8b.
      verified: they exist at /dev/nav-ideas (four shells: flat, floating pill, floating capsule,
      hide-on-scroll), returning HTTP 200 and rendering, built last turn. NOT a new build this turn.
      Root cause of him not seeing them is named below.

## Why he thinks the bottom-bar mockups were never made

They were, and they load. `curl` from this sandbox returns 000 on localhost, which is a loopback
restriction here and not the app; through the tunnel `/de/dev/nav-ideas` returns 200 and renders
with all four variants. So the artifact was real and the link worked.

What did not work is that the message carrying that link was one of several the reply checks
blocked and re-sent that turn, so it arrived buried in a stack of near-identical messages. **The
delivery failed, not the build.** Worth recording because "I did build it" is not a defence when he
did not receive it.

## The pattern he is naming, and the honest version of it

He is right that it recurs. The specific failure, twice today on one control:

1. He said the search bar looked wrong. I measured Airbnb, decided our height was the cause, and
   changed his values. Wrong, because the height is a distant fourth: the look is carried by the
   BLACK RING, the CENTRING and the SMALL ICON, none of which I touched.
2. He pushed back. I reverted everything, which threw away the look he wanted along with the
   invention, and left him where he started.

Both are the same underlying move: changing shipped values instead of putting a measured option in
front of him. Hence this turn: measured, four variations, nothing applied.

## His correction, same turn: it is BOTH, not one of them

*"b normal state or scrolled up, c once scrolled down a bit, you know, gets smaller. Look how insta
or any other social media does it with the bottom nav bar, liquid glass."*

- [x] C4. Search bar: B at rest, C once scrolled. verified: commit d65674315, HomeSearchPill.tsx:115-137 (the scroll listener) and :150-160 (the two treatments). A scroll listener
      with hysteresis (shrink past 24px, restore under 8px, so it cannot flicker on the boundary).
      Measured live: scrollY 0 gives height 54 / border 1px rgb(0,0,0) / shadow 0 6px 20px at 10%;
      scrollY 200 gives height 44 / border 1px hairline / soft shadow. Anatomy is identical in both,
      only weight and height move, so it reads as one control settling rather than two swapping.
- [x] C5. Bottom nav in liquid glass, floating. verified: commit d65674315, BottomNav.tsx:126-152. Measured live at 390 as
      inset 12px each side, 12px off the bottom, radius 9999px, `backdrop-filter: blur(20px)
      saturate(1.6)`, background rgba(255,255,255,0.8).

**WHAT I CHECKED ABOUT INSTAGRAM, AND THE HONEST RESULT.** I opened instagram.com at a real 375-wide
mobile viewport and measured their bar rather than picturing it: **45px tall, background
rgb(12,16,20), a solid dark slab, `backdrop-filter: none`, no shadow, no radius, full bleed, 24px
icons, no labels.** Instagram on the WEB is not glass at all. The liquid glass he means is the iOS
app, which a browser cannot capture, so there is no measurement of it here.

So the recipe is OURS: `FROST_GLASS` (lib/frost-glass.ts, V3-D420), the house glass already approved
and already shipping on the map chip. One value changed, the blur, 4px to 20px, because this is a
56px band with a whole page moving under it rather than a 24px chip over a single photo, and at 4px
the content behind reads as smear instead of glass. Saying that plainly beats claiming a capture I
do not have.

- [x] C6. CORRECTION, the ring is grey not black. Owner: "why is it black outline bro just make it
      gray or something." verified: HomeSearchPill.tsx, rest state now `border-s-ink-2`; measured
      live at 390, scrollY 0 reads `1px rgb(107,107,107)` and scrollY 200 still reads
      `1px rgb(228,228,231)`, so the two states stay clearly different.
      Picked by measuring the ladder we already own rather than inventing a grey: s-ink #0A0A0A at
      19.80:1 on white (what it was, and the heaviest mark on the page), s-ink-2 #6B6B6B at 5.33:1
      (now), s-border #E4E4E7 at 1.27:1 (the scrolled state). No new hex.
