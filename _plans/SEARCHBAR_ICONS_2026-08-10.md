# CORRECTION round (owner 2026-08-10, angry, three repeats)

His words: *"the search bar should look like this, but whatever the fuck that you're doing is
completely wrong and just inventing, just guessing. I told you to stop doing that. I told you to
harden... go actually research. And I also gave you a fucking branch name for the icons, that I
made new icons, but you still did not do anything... And I told you also to give me variations, so
mockup, for how the bottom bar should look like. But why the fuck did you also not do that? It's
like a recurring pattern."*

## Atomic asks

- [x] C1. The search bar should look like the Airbnb one. RESEARCH it, do not guess.
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
- [x] C3. Bottom bar variations.
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
