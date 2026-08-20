<!-- exists-check: net-new vs chrome-by-page-type.md, chrome-per-solen-page.md,
     airbnb--home-mobile.md, airbnb--home-search-chrome.md and
     continue-and-recently-viewed--home.md, all read before writing this. The two chrome files
     cover which HEADER a page type gets and are the closest match, but neither covers an AUTH
     screen: chrome-per-solen-page.md maps browse, PDP, booking, profile and dashboard, and stops
     there. The Airbnb files are a different brand and cover home, search and profile. Nothing on
     disk records a LOGIN reference from any brand. That is what this adds. It also deliberately
     records what was NOT taken, which is the part that keeps a reference from quietly overriding
     one of his dated decisions. -->

# Quizlet, log in (mobile) , read from the owner's own capture, 2026-08-20

**Source:** the owner pasted a Mobbin capture of Quizlet's login screen directly into the
conversation on 2026-08-20, with the ask *"make the login uncluttered n like ths no blue but yk
simple and shapes n colors yk"*. This file records what is VISIBLE IN THAT IMAGE. It is not
recalled from training and it is not a guess about what Quizlet ships today.

**Honest limit, stated first.** The image arrived inline, not as a file on disk, so
`pixel-spec-auto` could not be pointed at it and no pixel value below is a measurement. Everything
here is STRUCTURE and ORDER, which is what is readable without measuring, and structure is the only
thing carried across. Not one dimension was copied. Ours come from our own live page and the locked
contract.

## What the screen contains, top to bottom

1. A single back arrow. No other chrome. No menu, no logo, no nav.
2. The word "Log in" as a large heavy title. **No subtitle.**
3. Two fields stacked with a small gap. Each is a soft grey rounded rectangle with **no outline**,
   and each carries its label INSIDE the field, small and grey, with the value below it in larger
   dark text. The password field has a crossed-out eye on the right.
4. One full width pill button, "Log in", in the brand colour.
5. One centred text link under it, "Forgot password", in the same brand colour.
6. **A large empty gap**, roughly a third of the screen. Nothing in it. No divider, no "or", no rule.
7. Three full width pill buttons at the very bottom, each a DIFFERENT treatment:
   - Continue with Google, solid brand colour, white text, white logo
   - Continue with Apple, solid near-black, white text, white logo
   - Continue with Facebook, pale grey fill, dark text, coloured logo
8. No terms or legal line anywhere.

## What was taken across, and what was not

**Taken:** one chrome control instead of two. No subtitle. No divider between the two groups, since
the empty gap does that job. The ways in pushed to the bottom. The ways in differentiated from each
other rather than repeated identically.

**Not taken, deliberately:**
- **The brand colour.** He said "no blue". Our commit button is ink by the locked contract anyway,
  and blue is reserved for small clickable text.
- **The grey filled, outline-free fields.** These collide with his own dated decision of 2026-08-09
  (inputs are white with a thin line, and tapping one changes nothing visible). Shown as variant B
  so he can judge it against variant A, rather than having it applied to him quietly.
- **Every dimension.** See the honest limit above.
- **The third way in.** Quizlet has three, which is why its bottom block reads as a set of choices.
  We have two, which makes differentiating them matter more, not less.

Used by: `public/_mockups/login-uncluttered-2026-08-20.html`
