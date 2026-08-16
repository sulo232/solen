# Home sections, round 2: he rejected all 26 versions and specified what he wants (2026-08-16)

He looked at all three stacked pages and said "none of them" to looks and walk-in. That is not a
failure of the pages: he used them to point at exactly what he wants, which is what they were for.

## PREMORTEM, before any build

1. **The likeliest mistake is building 8 more versions.** He did NOT ask for more options this
   time. He described ONE design per section. Repeating the option-fan here would be the same
   not-listening in the opposite direction.
2. **The walk-in screenshot has not arrived.** He said "I'm gonna attach a screenshot" for how the
   N-ahead should look. Checked: the two images on disk are the same ones from earlier today
   (408x352 and 780x408, identical hashes). So the N-ahead EMPHASIS is the one piece I must not
   guess at. Everything else he specified in words.
3. **Replacing "Find your inspiration" is a DELETION** and needs a graveyard line the same turn,
   or the anti-duplication system decays and someone rebuilds it.

OUT OF SCOPE, named so it does not creep: the queue-cleanup cron for the June rows, the paused-gate
on search result cards, and the German review text on /en. All three are real and all three are
recorded elsewhere.

## A. Popular looks , BUILT, measured on the tunnel

`public/_mockups/looks-round2/section.html`

- [x] **A1. Keep the Popular looks section.** `verified:` 2ceddbd91, He said keep it, so it is not going in the graveyard.
- [x] **A2. Give it the Inspo card anatomy.** `verified:` 2ceddbd91, rendered at 390x844, measured on the live Inspo row: card 200 x 380, photo
      frame 200 x 356 at 9:16, radius 16, title 12px/500 inside a white pill, heart 44 x 44.
      Against today's Popular-looks tile, measured 150 x 150 at ratio 1.00, which is the square he
      has rejected repeatedly. **Rendered: frame 200 x 356, ratio 0.56.**
- [x] **A3. Remove the TikTok badge from the card.** `verified:` 2ceddbd91, measured: 38 x 12 pill, top left.
      **Rendered: `tiktokBadgePresent: false`.**
- [x] **A4. Remove the black gradient over the photo.** `verified:` 2ceddbd91, measured: `bg-gradient-to-t from-black/80`
      covering 200 x 178, the bottom half of every card. **Rendered: `gradientPresent: false`.**
- [x] **A5. Put a real shadow BEHIND the card instead.** `verified:` 2ceddbd91, measured: the live Inspo card and its photo
      frame both compute `boxShadow: none` today, so there is nothing behind it at all.
      **Rendered: `.frame` computes `rgba(50,47,44,0.12) 0 6px 16px`, elevation-3, the one probed
      as visible on white. NOTE: my first measurement sampled `.card` and reported `none`; the
      shadow sits on the frame. The gate-relevant lesson is that a shadow check must walk the
      element chain, not one node.**
- [x] **A6. "Find your inspiration" is replaced by Popular looks.** `verified:` 2ceddbd91, One section, not two. They were
      already the same query: 8 of 8 shared image ids, both calling
      /api/discovery/feed?category=hair. **The page carries exactly 2 title variants, not 8.**
- [x] **A7. Graveyard line filed.** `verified:` _design-system/REMOVED.md:135, commit 8f59e2d0d. `npm run exists "popular looks"` returns it under
      REMOVED, naming Entdecken.tsx, quoting him, and citing the 8-of-8 shared image ids.

      **I got this box wrong twice and the correction matters more than the box.** I first wrote
      that filing the line should WAIT for his approval, on the reasoning that recording a death
      that has not happened would mislead the anti-duplication check. Then the exists-check showed
      the line was already there, written in an earlier turn today, so the reasoning I had just
      given him was describing a decision I had not actually made. I told him in that same turn
      that nothing had been recorded to the taste record. That was true of THAT TURN only, which
      is not what the sentence conveyed.
      It resolved itself the right way when he answered "Apply it now": the deletion is real, so
      the line is now accurate. But it was accurate by luck, not by process. The lesson is the
      cheap one: run the exists-check BEFORE reasoning about whether something exists, which is
      the protocol this repo already has and which I skipped because I thought I knew.

**Also measured:** 16/16 photos load, all through `/api/discovery/thumb/{id}` (the raw TikTok CDN
URLs expire, which is why the proxy is mandatory). First paint is slow, roughly 5s per image, since
the proxy fetches and persists to Storage on first request; second load is instant.
Type: 3 sizes (12/14/18), 2 weights, largest/smallest = 1.50.

## B. Walk-in , BUILT except B6, measured on the tunnel

`public/_mockups/walkin-round2/section.html`

- [x] **B1. Keep the "N ahead of you" count.** He named it twice. **Rendered on all 4 shops.**
- [x] **B2. Keep the mark indicators.** measured in version 5 of my page: 8 marks, 6 x 16 each,
      gap 4, filled #0A0A0A, empty #E4E4E7. **Rendered: 8 marks per shop, 6 x 16 each, empty
      #E4E4E7 kept.**
- [x] **B3. Colour-code the marks by how busy it is.** His words: "if it's get more, then...".
      Semantic hues only, and the contrast bounds in CLAUDE.md rule 4 bind: success #16A34A is
      3.30:1 on white and legal as a mark, warning #F1AE27 is 1.94:1 and needs a darker companion
      or a stroke, so it may not carry the meaning alone.
      **Rendered: #16A34A quiet, #EA580C filling, #DC2626 busy. The middle step is SURCHARGE
      ORANGE, not warning yellow, precisely because of the bound above: #F1AE27 at 1.94:1 cannot
      carry the meaning alone, and here the colour IS the meaning. #EA580C measures ~3.6:1 on
      white, so all three steps clear the 3:1 graphical floor.**
- [x] **B4. Put the walk-in icon back.** I swapped it for a lucide door glyph. The live band uses
      `/icons/categories/walkin.png` at 34 x 34 (WalkInBand.tsx:77). Restore that exact asset.
      **Rendered: that exact path, 1/1 loaded.**
- [x] **B5. Fix the text hierarchy.** measured on my own page: 120 of 162 text elements render at
      13px, and only 3 distinct sizes exist across the whole file (13, 20, 28). The shop name, its
      meta and the section label are all 13px, so nothing reads as more or less important. That is
      the flatness he named. **Rendered: 4 sizes (12/15/18/30), 2 weights, largest/smallest = 2.50,
      and the 30px count clears the >=28px display anchor. The old page's 3 sizes spanned 13 to 28
      but put 74% of all text on one size; this one puts 4 elements at 30 and 1 at 18, so the
      count is the loudest thing in the band, which is what he asked for.**
- [x] **B6. ASKED AND ANSWERED, and the answer is that it is not decided.** `verified:` commit
      8f59e2d0d plus the answer he gave this turn. He said he would attach
      a screenshot for how the count should look. Four images did arrive (2026-08-16 21:55).

      `verified:` measured rather than eyeballed. They are screenshots of the LIVE homepage, and
      what they show of the count is the CURRENT flat treatment: "4 ahead of you", "3 ahead of
      you", "6 ahead of you", each rendering the number and the words at identical size, weight and
      colour inside a bordered white card. So they document the problem; they carry no target
      treatment to copy. Also visible in the same shots, confirming the round-2 asks against the
      real product rather than against my memory of it: the TikTok pill top-left of every look
      card, and the look title already sitting in an opaque white pill ON the photo, which is
      variant B and is what already ships.

      Asked him directly what the images were telling me. His answer: **"idk"**. That closes this
      box as far as I can take it: the treatment is not settled, and "idk" is not permission to
      pick one. The rebuilt band already makes the count the loudest element (30px against a 12px
      body), which is a defensible fix for the flatness the images document, and it stays a
      proposal until he reacts to it rather than being applied to the product.

      **Not blocked any more, and not guessed either.** The distinction matters because the thing
      that was blocking it (a missing screenshot) has resolved, and pretending it is still blocked
      would park a decision he has already been given the chance to make.
- [x] **B7. Harden the hierarchy failure**, because he asked for it by name ("you do harden on that
      too"). `verified:` 21/21 across three suites, plus a corpus safety run over all 353 mockup
      files. What was actually wrong is not what I expected:

      **The hardening already existed and was structurally blind.** `mockup-type-budget-gate.py`
      has enforced <=4 sizes / <=2 weights since 2026-07-21. It read my flat walk-in page and
      passed it. It had not weighed the page: it never saw one size or one weight on it, for two
      independent reasons.
      1. It stripped EVERY `<style>` block as "harness chrome". True of the whole-page template,
         false since he banned that template on 08-15: a section mockup keeps its entire design in
         one `<style>` block, so the strip was deleting the surface and then measuring the empty
         string. Measured: all five current mockups have exactly one style block and none contains
         a chrome selector, so the designed surface was empty in every case.
      2. It only read `font-size:` / `font-weight:` longhand. These files declare type as
         `font:600 30px/1 var(--display)`, the CSS shorthand, which matched zero times.

      `verified:` with sight restored it retroactively catches a real violation it had passed:
      `looks-directions/sections.html` carries 5 body sizes against a cap of 4.

      **A ratchet, not a wall.** Fixing the eyes took it from blocking 0 of 353 files to blocking
      230, of which 222 are real mockups written while it was blind. Two thirds of the corpus
      refused is how a gate gets switched off, so it now enforces direction: a NEW mockup must meet
      the cap, an edit may not make a file worse, and an unchanged rewrite passes. Re-measured:
      0 of 353 false blocks.

      **THE HONEST LIMIT, stated because it undercuts the harden he asked for.** The page he
      rejected renders 4 sizes and 2 weights, so it is INSIDE the cap and this gate would still
      pass it. Size-counting cannot catch his complaint. The dominance floor I tried to add for
      exactly that measured backwards (see the note in `count_budget`), so it was not shipped.
      What this turn genuinely bought is that the type cap is enforced at all for the first time
      since the mockup format changed. Flat-but-legal hierarchy remains a judgment call, and
      pretending a gate now covers it would be the failure that produced this box.

## C. Reviews , BUILT, measured on the tunnel

`public/_mockups/reviews-round2/section.html`

- [x] **C1. The cards are too big and too long.** measured live: 260 x 220 per card.
      **Rendered: 260 x 147. Same width, 33% shorter, which is the shape he picked
      ("Shorter, same width") over narrowing them.**
- [x] **C2. Read more is the right idea in the wrong place.** measured: it currently sits in its own
      row under the quote, in version 4 only, at the bottom of a card that already has slack.
      **Rendered: inline INSIDE the quote paragraph, blue #276EF1, which is the COPY_LAW pattern
      (an inline `text-s-accent` read-more that expands in place) rather than a row of its own.
      CLICK-TESTED, not just rendered: 63px -> 84px, label flips to "Show less" and back. I shipped
      two dead controls earlier tonight, so this one was exercised before being handed over.**

Type: 4 sizes (11/13/15/18), 2 weights.

- [x] **C3. UNPLANNED, found by the adversarial verifier: the Read more tap target was 33px against
      the 44px a11y floor**, and the comment I had written directly above it asserted 45.
      `verified:` re-measured at 390x844 with `document.elementFromPoint` stepped 1px down the
      button's centre, closed AND open: 45px in both states, nothing covering it.
      Cause: `.q` carried `max-height:63px; overflow:hidden`, which clipped the grown hit area at
      the box edge. That clamp was belt-and-braces , the script already truncates the quote word by
      word until it fits three lines , so removing it costs no layout and unclips the target.
      **The part worth keeping: my own click test passed this defect.** `btn.click()` dispatches
      straight at the element and bypasses hit-testing entirely, so it proves a handler is wired
      and proves nothing about whether a finger can reach it. Two dead controls earlier tonight
      taught me to click; this teaches me that clicking is not enough. Hit-test the point.

- [x] **C4. Swept the OTHER two pages for the same defect rather than assuming reviews was
      special.** `verified:` commit 52b5f5057, every control on both, hit-tested at 390x844 by stepping
      `elementFromPoint` down its centre, same instrument that caught the 33px one.
      Looks: see-all 44, heart 44, whole-card link 368. Walk-in: see-all 44, whole-row link 86.
      Nothing under the floor and nothing covered, so reviews was the only page carrying it.
      The reason it was reviews and only reviews: it is the one page with a control INSIDE a
      clipped box. The other two put their controls on the card surface, where nothing clips them.

---

## D. APPLIED TO THE PRODUCT (2026-08-16, he answered "B" then "Apply it now")

- [x] **D1. Popular looks rebuilt to variant B in real code.** `verified:` commit 041c09674, and
      measured on the rendered `/en`: pill `rgb(255,255,255)` with `backdropFilter: none`, name
      visible at 117px wide, frame 172 x 305 (ratio 0.56) radius 16 carrying
      `rgba(50,47,44,0.12) 0 6px 16px`, TikTok badges 0, black gradients 0.
- [x] **D2. "Find your inspiration" unmounted.** `verified:` commit 041c09674. The rendered heading
      list on `/en` no longer contains it, and `grep -rn "<Entdecken" app/` returns nothing. The
      file itself is kept for revert; only the mounts are gone.

### The four defects the first build shipped, all caught by review, none by me

- [x] **D3. THE NAME DID NOT PAINT, and this is the one that mattered.** `verified:` commit
      041c09674. The pill was copied from the retired section rather than from the approved mockup,
      so it carried `backdrop-filter: blur(14px) saturate(1.1)`. On the rendered page the text was
      present in the DOM at full opacity, full visibility and ink colour, and the card still showed
      an EMPTY WHITE PILL. Setting backdrop-filter to none in the live DOM made every name appear
      in the next frame, which is causation rather than correlation.
      **Why it is the worst possible defect here specifically: variant B is the variant whose whole
      purpose is keeping the name on the photo.** A blur that hides the name does not degrade his
      choice, it deletes it, and the source code looked correct the entire time. The mockup's own
      line says why it is opaque: "opaque white pill, which is why it survives with the photo
      uncovered". Solid white needs no compositing to stay legible.
- [x] **D4. Eight hardcoded German labels landed on /en, /fr and /it.** `verified:` commit
      041c09674. Composing the shared heart brought them: measured on rendered `/fr`, eight buttons
      under the heading "Looks populaires" all announced "Speichern", and the live region on `/en`
      read "Sleek Blunt Bob with Golden Ombre and Middle Part gespeichert". Three strings moved into
      all four catalogues, with the accents correct on French and Italian (I stripped them on the
      first pass and fixed it).
      This is the SAME defect class he reported on the recently-viewed row on 2026-08-15, arriving
      by a new route: not written fresh, but inherited by composing a component that already had it.
      Composition is supposed to be the safe move, and it carries defects too.
- [x] **D5. The heart reported a save it never stored.** `verified:` commit 041c09674. It flipped
      `aria-pressed` to true with zero network calls and forgot on reload. `/api/discovery/save`
      already existed and already returns the same `{saved}` shape, so it is wired now through an
      optional `lookId` prop, additive, leaving every existing caller untouched.
- [x] **D6. The creator credit was silently dropped.** `verified:` commit 041c09674. The approved
      card renders the handle beside the price, and attribution is a recorded requirement on this
      surface. "Remove the TikTok part thingy" was scoped to the BADGE, which is what was measured
      (38 x 12, top left). The first build resolved that ambiguity silently and in the wrong
      direction. Restored.
- [x] **D7. Two dev pages still rendered the retired section**, so the badge and the black gradient
      he asked to remove were still alive there. `verified:` commit 041c09674, both now mount
      Popular looks instead.

### What is NOT verified, stated rather than assumed

The heart's pixel hit area could not be tested on the live page: the browser pane stopped scrolling
and `elementFromPoint` needs the element on screen. Its box measures 44 x 44 at z-index 2 above the
card link at z-index 1, and the same anatomy hit-tested at 44 on the mockup, but that is geometry
and stacking, not a hit test. Named here because a control that measures 44 and tests 33 is exactly
what happened on the reviews card tonight.
