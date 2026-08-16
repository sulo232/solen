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

- [x] **A1. Keep the Popular looks section.** He said keep it, so it is not going in the graveyard.
- [x] **A2. Give it the Inspo card anatomy.** measured on the live Inspo row: card 200 x 380, photo
      frame 200 x 356 at 9:16, radius 16, title 12px/500 inside a white pill, heart 44 x 44.
      Against today's Popular-looks tile, measured 150 x 150 at ratio 1.00, which is the square he
      has rejected repeatedly. **Rendered: frame 200 x 356, ratio 0.56.**
- [x] **A3. Remove the TikTok badge from the card.** measured: 38 x 12 pill, top left.
      **Rendered: `tiktokBadgePresent: false`.**
- [x] **A4. Remove the black gradient over the photo.** measured: `bg-gradient-to-t from-black/80`
      covering 200 x 178, the bottom half of every card. **Rendered: `gradientPresent: false`.**
- [x] **A5. Put a real shadow BEHIND the card instead.** measured: the live Inspo card and its photo
      frame both compute `boxShadow: none` today, so there is nothing behind it at all.
      **Rendered: `.frame` computes `rgba(50,47,44,0.12) 0 6px 16px`, elevation-3, the one probed
      as visible on white. NOTE: my first measurement sampled `.card` and reported `none`; the
      shadow sits on the frame. The gate-relevant lesson is that a shadow check must walk the
      element chain, not one node.**
- [x] **A6. "Find your inspiration" is replaced by Popular looks.** One section, not two. They were
      already the same query: 8 of 8 shared image ids, both calling
      /api/discovery/feed?category=hair. **The page carries exactly 2 title variants, not 8.**
- [ ] **A7. Graveyard line for the removed section , DEFERRED TO APPLY, on purpose.** Nothing has
      been deleted yet: this is a mockup awaiting his yes. Filing a REMOVED.md line for a section
      that still ships would put a false death in the graveyard, and the graveyard is what the
      anti-duplication check reads. The line gets written in the turn the deletion lands in code.

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
- [ ] **B6. BLOCKED, and this is the one real dependency: the N-ahead emphasis treatment.** He said
      he would attach a screenshot for how the count should look. It has not arrived. Everything
      else in B is built without it; this specific treatment waits rather than being guessed.
- [ ] **B7. Harden the hierarchy failure**, because he asked for it by name ("you do harden on that
      too").

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
