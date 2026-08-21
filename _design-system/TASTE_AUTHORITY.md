# TASTE_AUTHORITY.md

**This file exists so you can decide a small taste question in his place, correctly, without asking
him.** It is not a reference document. This repo already has four of those (SOURCE.md, LOCKFILE.md,
RATIONALE.md, TASTE_LOG.md) and none of them ever says *you may decide*. That was the gap.

Written 2026-08-21, on his instruction. Verbatim:

> "I like these dumb stupid shit. I told you to use some agents counsel, you know, for these small
> stuff. Like, why would you need my opinion for these small stuff? ... I cannot fucking understand
> with thirteen pixel, fourteen pixel ... Is this such a small fucking difference even if it's
> visual? How the fuck would anyone see that? ... we need to have like a file actually do you know
> what I want? My taste is right to like actually make decisions."

He is the founder. He is not an engineer. He reads on a phone. A question that costs him a turn and
returns him nothing is a real cost, and he has now named it twice.

**What this file may contain, and the limit on it:** only decisions that trace to a dated thing he
said or to a value already locked in LOCKFILE.md / CLAUDE.md. It invents no taste positions. Where
it is silent, THE TEST below still applies, but a silent gap is never filled with a guess.

---

## 1. THE TEST

Run it top to bottom on any visual or numeric question. Stop at the first line that fires. You get
one of three answers: **DECIDE**, **SHOW**, or **ASK**.

**Step 1. Does a dated decision of his already answer it?**
Search TASTE_LOG.md, LOCKFILE.md, REMOVED.md. If yes: **DECIDE**, apply the recorded value, and do
not surface it. Re-asking a settled axis is the same failure as asking about 13px, just delayed.
His words, 2026-08-09: *"you actually, like, remember my preferences? It seems like you estimate
every time, like, it becomes, like, a big exhausting."*

**Step 2. Is it on the open list in section 5 of this file?**
Three things are open on purpose and one is a live collision. If it touches one: **ASK**. Do not
resolve it quietly in either direction.

**Step 3. Does it change what a customer is told, what they pay, or what we are called?**
Copy, naming, a price, a promise, a deadline, a policy, a legal or accessibility floor. **ASK**.
See section 4. There is no small version of this category.

**Step 4. Does the change touch a component that more than one file imports?**
Run the grep. If more than one file imports it, the change is not small no matter how small the
number is: **SHOW**. This is mechanical, not judgement. Precedent: the filter-pill corner radius
went through him precisely because it edits a control 29 files import (B21, 2026-08-16).

**Step 5. Is it a new pattern, section, route, component, colour meaning, or direction?**
**SHOW.** Mockup first, always, and the mockup's scope matches the ask: one section at real width,
variants stacked, no switcher, no iframe. His words, 2026-08-15: *"I can't even see a difference"*
and *"remove the gate or anything that's making you do this shit so annoying."*

**Step 6. Is every candidate value already legal, on one existing approved screen, and inside the
indifference band in section 2?**
**DECIDE.** Ship it. Say nothing. This is the 13px versus 14px case and it is the whole reason this
file exists.

**Step 7. Anything left over.**
It is real but it does not block the next step. **PARK** it: keep working, and surface it once in
the closing report. Do not stop mid-task to ask. His words, 2026-08-19: *"i want clear distinction
between loops and normal yk ... i accept nagging but elaborate more."*

### Why SHOW and DECIDE do not contradict each other

TASTE_LOG M18 (2026-08-14) is a standing rule: *"anything he would SEE is never applied on a
sensible default. It is shown, and it waits for him."* Read literally, that would send 13px versus
14px to him forever.

**The 2026-08-21 instruction narrows M18, it does not cancel it.** M18 still governs anything he
would see AND could tell apart: a new pattern, a new direction, a new colour meaning, a changed
shape. It stops covering a value that is already legal, on one already-approved screen, where the
alternatives sit inside the band. He had already drawn this same line himself on 2026-08-14 (M17),
killing an eleven-version comparison page with *"nothing changes after v2"*, because versions
nobody can tell apart contain no choice to make.

**The honest cost of this file, stated once so nobody pretends it is free.** Handing a subagent
decide-authority means some small choices will ship wrong. That is paid for by his live correction,
which is cheap and already how this works: review stars shipped at 13px on 08-15 and he raised them
to 18px the next day (B4 to B21). One turn spent, once, on the one thing he actually noticed. The
alternative was a question on every micro-choice, and he has now told us what that costs.

**The failure mode of step 6, named so you catch yourself.** Under task pressure everyone reads
their own change as sub-perceptual. The tie-breaker is not your confidence, it is this: **if you
needed a ruler, getBoundingClientRect, or a pixel diff to see the difference in the first place, it
is inside the band. If you could see it in a screenshot, it is not.** When you are unsure, step 4's
grep usually decides it for you, and step 7 (park it) is always available and always legal.

---

## 2. THE INDIFFERENCE BAND

**The rule: one adjacent step on the locked ramp is not a decision. Skipping a step is.**

### Type

The locked ramp (LOCKFILE.md §12 Scale table): **11, 12, 13, 14, 15, 16, 18, 20, 22, 26, 30, 34, 40, 64.**

One step, in absolute pixels, by where you are on it:

| where on the ramp | one step is | example |
|---|---|---|
| 11 to 16 | **1px** | 13 to 14, 14 to 15, 11 to 12 |
| 16 to 22 | **2px** | 18 to 20, 20 to 22 |
| 22 to 34 | **4px** | 22 to 26, 26 to 30 |
| above 34 | no band | anchors and hero carry the hierarchy; a change there is visible by design |

**Where this number came from, exactly.** Not from perception research. From his own locked scale.
The LOCKFILE Scale table gives every text role a mobile value and a desktop value, and for the
body-weight roles those two values are one step apart: Body 14/15, Body small 13/14, Caption 11/12,
Eyebrow 11/12, CTA 14/15, Service-row name 15/16, Service-row duration 13/14, Service-row price
14/15, Team-card name 14/15, Team-card role 12/13. (The one exception is Body large, 14/16, which
is two steps.) The headings do the same thing: Section H2 18/20, Page H2 22/26, PDP H1 30/34.

So **his own system already ships both sides of these pairs to real customers**, on the same screen,
at two widths. A choice between 13 and 14 for a meta row is not a taste decision that was never
made. It is a decision already made, twice, and the breakpoint picks which one renders.

**This band has no external source and does not claim one.** It is derived from values locked in
this repo plus two dated things he said (M17, 2026-08-14; the 2026-08-21 brief above). This matters
because this estate has minted unsourced thresholds before and then cited them as evidence: the
"~30% of text may be weight 600" ceiling in CLAUDE.md is a house number, corrected on 2026-07-28 to
say so. Widening this band later needs him, not a rounder number.

**What the band does NOT license.** A single step is still illegal if it crosses a named floor:
- a button label at 13px or smaller (CLAUDE.md design contract: CTA is *"never <= 13 on a button"*,
  and 14 is the locked mobile value, 15 the desktop one)
- a display anchor below 28px, or below 1.8x the screen's body size
- a fifth distinct size or a third distinct weight on one customer screen (gate-enforced ceiling;
  the /profile screen shipped at 6 sizes and read busy)
- tertiary grey #9CA3AF used as text at any size (2.54:1 on white, below the WCAG floor)

### Spacing

4-point scale. One step is **4px**, and the band is one step.
**Dashboard has no band:** the rhythm is binary, 16px inside a group and 32px between sections
(dashboard D1, 2026-07-15). The gap is derived from whether two things are in the same group, never
chosen by eye.

### Motion

Locked ladder (LOCKFILE §4): **80 / 100 / 150 / 200 / 250 / 300 / 500ms.** One rung is the band, on
an existing component, with a locked easing.
**Never ask about speed in words, ever.** His words, 2026-07-25: *"I'm not really sure about the
speed because I'm not used to that, and I don't really know. So don't ask me about that one. SHOW ME
A VISUAL so I can visualize."* A speed question that is bigger than one rung is a SHOW, never an ASK.

### Things with NO band at all

- **Colour.** Nearness to an existing hex is not a licence. Inventing a shade, tint or hue outside
  the closed token set is the exact failure he named on 2026-08-16 (B30, a beige sticky bar):
  *"You made up a random fucking collar that's beige. I don't fucking know it."*
- **Radius.** Radius is picked by component role, not by nearness: input 12, form/summary card 16,
  grouped list card 24, sheet 28, pill 99. He personally chose 16 for the filter pill (B21).
- **Weight.** Customer screens have exactly two weights (B10, 2026-08-15, he picked option C:
  semibold and bold both demote to medium; dashboard exempt by name). Two values is not a band, it
  is a role lookup.
- **Words.** See section 4.

---

## 3. THE DEFAULTS

A new case arrives and there is no dated decision for it. Pick with these. Do not list options.

### Type and size

- **Workhorse body text on a dense screen: 14px.** Not 13. Settled by direct comparison, B29,
  2026-08-16: the salon PDP renders 14px forty-five times and 13px thirty-two times; the rejected
  terminal mockup rendered 13px forty-nine times and 14px zero times. His words: *"look how we do it
  in pdp page of a salon."*
- **A new text role takes the nearest existing role's locked pair**, mobile and desktop both. Do not
  invent a value between two ramp steps.
- **Font family is closed.** Inter Tight for display and codes, Inter for body. Never Geist. A
  question here is a bug report, not a taste question: on 2026-08-16 the body typeface was not
  loading at all on any screen (B23), which was the whole complaint behind months of "the font is
  different."
- **Stars are his, and bigger is the established direction.** Row stars went 13 to 18px on 08-16,
  *"past both references, his taste"*, and the review score is a 44px page anchor (B21). A request
  to enlarge stars continues a stated preference. It is not a fresh question.

### Colour and fill

- **A new small text link: blue #276EF1.** Blue is the hyperlink colour, not the clickability
  colour (LOCKFILE, v3 2026-06-11). Legal on inline links, "Mehr lesen", small tappable counts, and
  the locked system states (focus, spinner, stepper discs, calendar slot fill).
- **A new button, CTA, chip, pill, badge or arrow: never blue.** Ink or neutral. There is no
  precedent in the record for a new kind of blue button.
- **A new pill, chip, tab, filter, menu option or radio, selected state: the calm grey recipe**
  (bg-s-bg-sunken + text-s-ink + semibold, over white unselected). Owner 2026-06-29, restored again
  on 2026-08-16 when a soft-black version shipped and he called it too harsh (B19 overruling B6).
  Both alternatives, blue border and ink fill, are dead by name.
- **Four exceptions exist and they are not extendable by resemblance:** the one commit button (ink),
  the booking date and time slot (blue), the avatar SelectedCheckBadge (ink), the booking-flow
  category pills (ink, his override 2026-07-19). A fifth element that merely resembles one of these
  is not an exception. Each of the four exists because he overruled the default by name.
- **A semantic hue is legal in four roles only:** literal text or icon meaning, a filled focal disc,
  a pastel background chip or badge, or a locked component's documented fill. Never a bar, banner,
  solid block, decorative accent, or card edge stripe. B31, 2026-08-16: *colour means state and
  nothing else.* A new element that wants colour but fits none of the four roles gets no colour.
- **No coloured left or right edge bar on a card, ever.** His words: *"i hate that ... this left side
  green thingy. never do this ever."*
- **No dark mode on web, in any file, at any scope, forever.** Rejected 2026-07-15, 07-16, 07-21
  (*"only white for web"*). iOS keeps dark mode and sets no precedent for web.
- **Check contrast against the surface the element actually sits on**, not against white by habit.
  Four of six measured tokens fail on the sunken tray #F4F4F5, which is the default list surface.
  WCAG AA is a statutory floor and outranks taste in the precedence chain.

### Structure and chrome

- **One navigation surface per screen.** Dashboard: sidebar only. Customer mobile web: header plus
  the one bottom bar. A hub or destination page: its own rows are the navigation, no bell, no
  hamburger (2026-08-03, *"why is the notification inside and the hamburger menu inside a fucking
  profile page? I told you like ten fucking times"*). A task flow: its own single back or close.
- **One back control per screen.** The global Header owns it, except on the named routes where the
  Header is hidden. Never two (V3-D461, *"alot of duplicate back buttons"*).
- **Card grammar is a semantic test, not a look.** Peers inside one category go in a group card
  (radius 24, whisper shadow, hairline-divided rows). A distinct entity, a person or a business,
  gets its own card (radius 16, border, flat, gap-separated). Owner 2026-07-19: *"stylists are
  individual not groups."*
- **Draw a boundary once.** If the section container already draws the edge, the rows inside do not
  also get borders. Owner, twice in the week of 2026-08-10: *"the boxing is the problem."*
- **Clutter is equal weight, not element count.** Every block wearing the same card costume with no
  dominant object is what reads cluttered. The fix is one focal element and everything else demoted
  to bare text, never deleting content. Owner 2026-07-15: *"we need breathing space not just
  everywhere cards or boxes or pill."*
- **A fact, person or event renders in exactly one place per screen.** Anything that would repeat it
  becomes a link to the one rendering.
- **Icon buttons and controls are round by default.** Measured 890 round against 36 boxed. The
  hamburger is square, by name, and it is the only one (2026-08-10).
- **A sticky bottom bar separates by gradient fade.** Frost is only for controls over photography.
  Flat on a calm surface.
- **Name the screen operator or customer before building it** (B32, 2026-08-16). The customer FLOORS
  LAW does not demand a sunken tray or a semantic-colour moment on a photo-less operator screen. A
  list of people on an operator screen is rows, not a card each.

---

## 4. WHAT IS NEVER DECIDED WITHOUT HIM

Short and absolute. No size of change makes any of these small.

1. **Words a customer reads.** Any naming, label, headline, button copy, or product-noun change, in
   any of the four locales. Copy is not a pixel and it has no indifference band.
   **AMENDED 2026-08-21, the same day this file was written, by him, twice.** On the German word for
   Salon he said *"you need that shit think that I use a sub counselor and look into other platform
   how they use what they say what is it mean"*, and when the council's answer came back to him as a
   recommendation to approve, he said *"i told u let subagent decide it"*. So: **when he hands a
   naming question to a council, the council's researched answer IS the decision and it gets applied
   without him.** Rule 1 still governs naming he has NOT delegated. The test is his words, not the
   subject: "research it and decide" is a delegation, silence is not. Bringing back a researched
   recommendation for a one-word yes is the failure this amendment names, because it costs him the
   turn the council was supposed to save. Recorded because this file's own rule 1 is what sent that
   question back to him.
2. **Anything that changes what a customer is promised.** A deadline, a cancellation or refund term,
   a response time, a guarantee, a consent meaning. CLAUDE.md, 2026-08-19: two refund-screen strings
   promised a 14-day report window and a salon response date while nothing computed or enforced
   either. If a screen names a promise, something must own it, and he decides the promise.
3. **Money.** A price, a fee, a surcharge, a discount, a commission, a VAT treatment, or how any of
   them is displayed. Swiss PBV total-price rules sit in the statutory tier.
4. **Anything a dated decision of his already settled the other way.** A LOCKFILE row, a TASTE_LOG
   entry, a REMOVED.md graveyard hit. Breaking a lock needs an explicit named yes from him. His
   frustration is not that yes: *"idc"* means he is annoyed, not that a lock is open.
5. **A statutory or safety floor.** WCAG 2.2 AA on a published customer surface, nFADP and GDPR
   consent, PBV total price, anything the Terms represent as true. When one of these collides with a
   taste decision of his, you surface the collision with both dates and propose the treatment that
   satisfies both. You never silently pick a side.
6. **Inventing a value that exists in no locked set.** A new hex, a new duration, a new radius, a
   size between two ramp steps. Closeness to an existing value is not permission (B30).

---

## 5. OPEN, AND NOT YOURS TO CLOSE

Three things are unresolved on purpose. If a question touches one, ASK. Do not let the test above
walk you into deciding them.

- **B37 (2026-08-16), the size-count contradiction.** Our own written rules disagree: one place
  demands 6 to 7 distinct sizes, another caps a screen at 4. He named this as a cause of the clutter
  he was complaining about and left it open, because reconciling it rewrites a locked row on every
  screen. Until he closes it, **the enforced 4-size and 2-weight ceiling is the working default
  everywhere.** Do not manufacture a fresh version of this question on an unrelated screen.
- **M30 (2026-08-12), the calendar selected day.** The design contract keeps blue for the calendar
  date and slot fill. The shipped calendar has been ink since 08-12. M30 carries no verbatim, so the
  newest-decision-wins rule cannot be applied to it safely.
- **M41, three weights on the home first viewport.** Three weights (400/500/600) ship there on his
  live instruction, and the two-weight ceiling is not an axis he waived by name.

---

## 6. THE SALON WORD, worked end to end

He asked whether the German product should keep calling a business a **Salon**. This is a section 4
item (words a customer reads), so it is an ASK, and this is what an ASK should look like: a
recommendation he can accept in one word, with the case against it stated honestly, not a menu.

**Recommendation: keep "Salon" and "Salons".** Reply "keep" and it is done.

**What the research found** (live fetches and searches, 2026-08-21):

- Every direct consumer marketplace in this exact vertical and language uses Salon as the umbrella
  noun. Treatwell on both .ch and .de (*"Grosse Auswahl an top-bewerteten Salons"*), Salonkee on
  both .de and .ch (*"Finde dein Lieblingssalon"*, and "Salon & Studios" in its filters), and
  MySalon.ch, a Swiss product named around the word itself. Three independent companies, same choice.
- The platforms using something else are all talking to the salon OWNER, not the shopper: Shore.com
  says "Betrieb", Terminland and BeautyBooking say "Dienstleister", Salonkee reserves "Geschäft" for
  its owner-facing "Ihr Geschäft hinzufügen". Different audience, different job for the word.
- Booksy is the one platform leading with "Anbieter", and it has no meaningful Swiss presence, so it
  is the weakest comparable in the set. Its own category names still fall back to Studio and Salon.
- "Studio" stays as the category compound underneath: Nagelstudio, Massagestudio, Kosmetikstudio.
  Every competitor does exactly this.
- Fresha's German-language marketplace page could not be loaded (410 on the German path), so its
  exact German noun is not confirmed here. Flagged rather than assumed. Its English Swiss pages say
  "Salons".
- "Store" is the worst of the options considered. In German commercial usage it specifically means
  one branch of a retail chain, so it undersells a standalone owner-run salon as a chain outlet.

**The real defect this uncovered, and it is not a naming problem.** Solen already disagrees with
itself. The rendered German homepage says "Salons finden, sofort buchen" while three SEO strings in
the repo say "Stores": `app/layout.tsx:26-27`, `app/[locale]/page.tsx:137`, and
`app/[locale]/[city]/page.tsx:47-48`. Collapsing those three to "Salons" is the actual fix, and it
is a copy change, so it waits for the same one-word yes.

**The honest case against keeping it, because his gut is not baseless.** "Salon" leans hair and
beauty in German. The compounds that exist are Coiffeursalon and Schönheitssalon, and nobody calls a
spa or a massage practice a Salon on its own; German speakers reach for Spa, Wellnesscenter or
Massagepraxis. That is exactly why every platform above, including the ones with Salon in the
headline, builds its real taxonomy out of Studio, Praxis and Spa underneath. So Salon works as an
umbrella only because nobody scrutinises a homepage headline, not because it genuinely covers hair,
barber, nails, makeup, spa and wellness in one native-sounding noun. And "everyone does it" could
mean the category has never solved this word, not that it is solved. If Solen's ambition is the
booking layer for all of beauty and wellness, riding a coiffeur-first noun is a real long-term
positioning cost. The research does not erase that cost. It shows nobody else has paid it down
either, and that switching alone would put Solen in a category of one with no evidence it reads
naturally to a shopper.

---

## 7. FEEDING THIS FILE

When he decides something, it goes in TASTE_LOG.md first, with the date and his verbatim words.
Then, only if it changes what a subagent may DECIDE, add or amend a line here and cite that entry.

A rule in this file with no owner and no date behind it will be overridden by the next agent's
opinion, which is the failure this file was written to stop. If you cannot cite him or a lock, the
line does not belong here.
