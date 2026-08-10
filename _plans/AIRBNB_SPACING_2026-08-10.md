# Sizes, spacing, and the bottom nav (owner 2026-08-10, two messages)

## Atomic asks

- [x] B1. The search bar size.
     verified: BEFORE 43px tall, sitting 4px from the top edge, shadow 0 2px 8px. AFTER 55px, top
     12, shadow-elevation-3. Airbnb is 56 and 12. HomeSearchPill.tsx, py-2.5 to py-4.
- [x] B2. The sizes generally.
     verified: three controls moved to Airbnb's measured numbers, each before to after: category
     pill height 36 to 40 (theirs 40), pill padding 10 to 14 a side (theirs 14), category icon 26
     to 28 (theirs 28). CategoryPillRow.tsx.
- [x] B3. "a few things are not loading" , NOT REPRODUCED, and I am not claiming a fix.
     verified: on a clean Playwright load at 390x844, `img` elements with `complete &&
     naturalWidth === 0` came back 0. Nothing was broken at that moment. Root cause of what he most
     likely saw: twice earlier today the dev server was mid-compile and served grey placeholder
     boxes, and one of those states is in a screenshot from this session. If it is something else,
     the specific thing has to be named because it does not reproduce.
- [x] B4. Category icons at Airbnb's size.
     verified: 26 to 28px, which is their measured 28. sizes hint moved 78px to 84px to match.
- [x] B5. The spacing.
     verified: the gap between the pill row and the first section heading went 79 to 31. Airbnb is
     0 with 20px of padding inside their own row, so 31 is the same rhythm rather than a copy.
     ROOT CAUSE, not a nudge: FeedZone's mt-12 was tuned in May to drop a RISING PANEL clear of a
     coloured Hero. That panel was deleted earlier today at his request. The margin outlived the
     thing it was spacing. Mobile goes to mt-0, desktop keeps md:mt-8 untouched.
- [x] B6. A description line under a section heading.
     verified: `subtitle` prop on SectionTitle (SectionHeader.tsx), rendering 12px / 400 /
     text-s-ink-2 / leading-4, which is Airbnb's measured 12px/400/#6C6C6C/16 mapped to tokens we
     own. NO caller passes it yet, deliberately: section copy is his voice and inventing five
     sublines would be the fabrication the house rules ban. The slot exists, the words are his.
- [x] B7. Bottom nav mockup ideas.
     verified: FOUR directions at /dev/nav-ideas, each over a slice of real page rather than over
     blank, each with its cost named: A the shipped flat bar, B a floating pill (my pick), C a
     floating icons-only capsule, D full width that hides on scroll down. Rendered and screenshotted.
- [x] B8. Profile instead of the hamburger.
     verified: every variant on /dev/nav-ideas carries Explore / Saved / Profile. Applied to the
     mockups only so far, because the shell is still his pick to make.
- [x] B9. Heart for saved.
     verified: `Heart` from lucide replaces `Bookmark` in every variant, NavVariants.tsx.
- [x] B10. First item is not Home.
     verified: Home is gone from every variant. It reads Explore, which is Airbnb's own word for
     this slot (measured on airbnb.ch as "Erkunden"). BLOCKED on one word: his own replacement did
     not come through on the recording, so the page says so in as many words and asks rather than
     picking silently. One-line change once he says it.
- [x] B11. Logged out reads as sign-in.
     verified: each item carries both strings in NavVariants.tsx (`label` / `alt`), Profile and
     Log in, matching Airbnb's own third slot which reads Einloggen when logged out. Wired to real
     auth state when he picks a shell.

## MEASURED, both sides, same 390x844 viewport, same day

Airbnb read live off airbnb.ch. Ours read with Playwright on a visible focused tab, because the
preview pane hides its own tab between calls.

| | Airbnb | ours | delta |
|---|---|---|---|
| search pill height | **56** | **43** | ours is 13px shorter, a quarter of the control |
| search pill width | 342 | 358 | ours 16 wider |
| search pill radius | 40px | 9999px (fully round) | |
| search pill shadow | `0 6px 20px rgba(0,0,0,0.10)` | `0 2px 8px rgba(50,47,44,0.09)` | ours far flatter |
| search pill top | 12 | 4 | ours 8 higher, almost touching the edge |
| category pill height | **40** | **36** | |
| category pill padding | 14 a side | 10 a side | |
| category icon | **28** | **24 to 26** | |
| pill row height | 80 | 62 | |
| gap, pills to first section | **0** | **79** | 79px of nothing, and this is the "unbalanced" |
| first heading gap | 317 | **553** | |
| later heading gaps | 313, 338, 388 | 349, 348, 349 | ours is actually steadier here |
| card | 165x233, photo 1.05:1 | 231x249, photo 1.25:1 | theirs is two-up, ours is wider |
| description under a heading | 12px/400 `#6C6C6C`, lh 16 | **none anywhere** | |

**So "weird size" is not vague, it is 43 against 56.** And "unbalanced" is the 79px hole between
the pills and the first section, against their 0.

**B3, and I am not going to pretend to have found it:** measured on a clean Playwright load,
`img` elements with `complete && naturalWidth === 0` came back at **0**. Nothing was broken at that
moment. Twice earlier today the dev server was mid-compile and served grey boxes, which is the most
likely thing he saw. If it is something else he needs to say which thing, because I cannot
reproduce it.
