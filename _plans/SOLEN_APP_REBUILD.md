# SOLEN iOS APP , FULL REBUILD, AUTONOMOUS LOOP

Owner, 2026-08-11: *"i want an app all made by the time the loop finishes all backend and frontend
all like by phase loop think evth out use llm council and sub agents council to evaluate plan"*, and
*"w need to overhaul evrth okay on the app sh cz rn it has dumb rule etc evrth"*.

## What he decided (answers, verbatim where they matter)

| Question | His answer |
|---|---|
| Relationship to Solen | *"solen bro... we got web but no app or app is rlly old or comp differnt design evrtth from web"* , it is THE Solen iOS app |
| Platform | Web and iOS. Web already exists; the work is iOS. |
| Autonomy | Fully unattended until done |
| Delivery | *"via expo yk"* |
| Direction | *"make it look like web but use liquid glass and more and dont do it blindly do we jeed acc principles for those animation yk native sh etc"* |
| Overhaul covers | the code, the 35 mockup screens, the design docs, the backend connection layer, **and the rules themselves, built for autonomous work** |
| Must work at the end | booking end to end, walk-in + queue, everything else a customer does |
| Runtime | until it is actually done, across sessions |

## Ground truth, measured 2026-08-11, not recalled

- `~/Documents/solen-mobile`, Expo, last commit **27 July 2026** (`6da9986`).
- **107 .tsx files.** Of the 69 under `src/app/`, **35 are `mocks/`** , over half the route tree is
  old design experiments sitting next to the product.
- Real screens, about 30: 5 tabs (index, entdecken, karte, profil, suche), `salon/[slug]`,
  `booking`, `angebote`, `onboarding`, `auth/{login,welcome}`,
  `profile/{bookings,favorites,hair-profile,preferences,referral,settings}`, `reviews/[slug]`,
  `inspo/[id]`, `discover/saved`, `rewards`, `notifications`, `gallery`, `city-sheet`,
  `search-filters`.
- **Missing against web:** confirmation, termine, queue, walk-in-join, walk-in-pay, walk-in-tip,
  tip, vouchers, loyalty, recently-viewed, the category landings
  (barbershop / coiffeur / nails / spa / behandlungen), search results.
- Rules today: a 41-line `CLAUDE.md` plus **110KB across 14 `_design-system/*.md`**, of which
  **seven are about onboarding alone** (ONBOARDING_ABY_SPEC, _DIRECTION_REFS, _PERSONA_DNA,
  _STRATEGY, _STRUCTURE, _STYLE_INTERESTS, plus HAIR_APP_BUILDOUT at 16KB). Two ad-hoc grep checks
  (`check:dots`, `check:haptics`). That sprawl is what he means by "dumb rules".

## PREMORTEM (required before any dispatch)

**Top 3 concrete failure modes.**
1. **The design phase never converges.** This exact session spent 40+ rounds on FOUR ICONS. An app
   is 40+ screens. If each screen is negotiated the way the spa stones were, the loop never
   finishes. MITIGATION: the design canon is decided ONCE, by him, against rendered options, before
   any screen is built; after that the loop builds to the canon and does not re-open taste.
2. **"Looks like web + liquid glass" is a contradiction nobody has resolved.** Web is flat white,
   light only, one column. Liquid glass is translucent, layered, and depends on what is behind it.
   Applied blindly you get a white app with grey blur on white, which is invisible, or a native app
   that no longer matches web. He said explicitly not to do it blindly. MITIGATION: phase 1 is
   exactly this resolution, rendered, and it blocks everything downstream.
3. **Unattended + Expo = unverifiable.** Web work self-verifies through a tunnel and a screenshot.
   iOS needs a simulator, and this session has already measured that the iOS simulator MCP is
   frequently disconnected. A loop that builds 40 screens it cannot see is the air-on-the-dryer
   failure at 40x scale. MITIGATION: the verification path is proven in phase 0 and the loop refuses
   to advance a phase it could not screenshot.

**Load-bearing unknowns, cheapest probe first.**
- *Can I actually drive the iOS simulator this session?* Probe: boot it and screenshot one existing
  screen. If not, the whole "unattended" premise changes shape and he needs to know before phase 1.
- *Does the Expo app still build on today's toolchain after 2 weeks?* Probe: `npx expo start` and
  one bundle. A broken build turns phase 0 into a repair job.
- *Is `liquid glass` available?* `expo-glass-effect` is already a dependency, so probe what it
  renders on the current OS rather than assuming the API.

**Explicitly OUT of scope.**
- The salon-owner dashboard on mobile. He picked the three customer bundles, not the owner side.
- The web app. It exists and is not being changed.
- Anything that moves money in production, app-store submission, and push-notification
  certificates. Those need his credentials and are his to do.

## PHASES

Each phase has a binary close condition. The loop does not advance on a phase whose close condition
is unproven, and each phase writes its state here so the loop survives a session boundary.

- [ ] **Phase 0 , can we even see it.** Boot the simulator, build the current app, screenshot one
      existing screen, prove the capture path end to end. CLOSE: a screenshot of the running app in
      this repo, plus a written statement of which verification path works and which does not.
- [ ] **Phase 1 , the canon (BLOCKS EVERYTHING).** Resolve "web look + liquid glass" as rendered
      options on the SAME real screen, not as words. Derive the native motion and glass principles
      from captured sources (Apple HIG, real captured apps) rather than from memory, because
      building a named reference from memory is the failure this session already paid for nine
      times. CLOSE: he picks one, and the pick becomes a single short canon file replacing the 14.
- [ ] **Phase 2 , demolition.** Delete the 35 mockup routes. Collapse 110KB of design docs into the
      one canon. Rewrite the mobile CLAUDE.md as rules an autonomous loop can follow.
      CLOSE: route tree contains no `mocks/`, `_design-system` is one canon plus the registry, and
      the app still builds.
- [ ] **Phase 3 , the data layer.** Rebuild how the app talks to Supabase, auth and Stripe, against
      `_docs/BACKEND.md` as the source of truth. CLOSE: every screen's data comes from a typed
      client with no fabricated values, proven by the silent-no-op discriminate check.
- [ ] **Phase 4 , the spine.** Home, search, salon page, booking, confirmation. The path that earns
      money. CLOSE: an appointment booked end to end in the simulator, screenshotted.
- [ ] **Phase 5 , walk-in and the queue.** Pay upfront, get a number, track the place in line.
      CLOSE: a queue joined and tracked in the simulator, screenshotted.
- [ ] **Phase 6 , the rest of the customer.** Appointments, tips, vouchers, loyalty, referrals,
      reviews, saved, recently viewed, notifications, profile. CLOSE: every web customer route has
      an app equivalent or a written reason it does not.
- [ ] **Phase 7 , the pass.** Every screen against the canon, measured. CLOSE: design-verifier PASS
      on every screen, no open punch items.

## HOW THE LOOP SURVIVES

State lives in this file, not in context. Every phase updates its checkbox and appends what it
learned. On resume the loop reads this file first and continues from the first unticked phase. A
transient blocker (rate limit, context ceiling, a flaky simulator) is a WAIT, never a stop.

## OPEN, NEEDS HIM

1. The phase-1 canon pick. Everything is blocked on it and it cannot be guessed.
2. Whether dark mode survives. Web is light-only by law; the app has dark built. Asking with
   rendered options in phase 1.

## COUNCIL REVIEW 1 , external LLMs, 2026-08-14

Grok 4 answered in full. Gemini 2.5 Flash returned a truncated answer. The Claude CLI path failed
with no API key, so Opus did not vote this round.

**ACCEPTED, plan changed.**
1. *"The final design pass (7) is too late; fold it into the spine and walk-in phases or you will
   ship broken layouts then fix them afterward."* Correct, and it is the same shape as this
   session's icon rounds. Phase 7 is now a per-phase close condition, not a trailing phase.
2. *"The single guardrail that matters most: every new screen must produce an automated simulator
   screenshot that is stored and diffed before the loop is allowed to continue."* Adopted as the
   loop's hard advance condition, replacing the softer "the loop refuses to advance a phase it could
   not screenshot".
3. *"It is a trap."* Both models independently flagged web-flat plus liquid-glass as incoherent:
   glass needs translucency and something behind it, and on flat white it either disappears or
   forces the web to change too. Grok: *"pick one primary language and adapt the other, or accept a
   hybrid that will look compromised on at least one platform."* This is now the FIRST thing put to
   the owner in phase 1, as a rendered fork rather than as a paragraph, because he asked for exactly
   this not to be done blindly.

**REJECTED, with the reason.**
- *"Data layer (3) should come before the spine (4)"* , it already does. Grok misread the order.
- *"It treats demolition as safe before the canon exists"* , it does not. Phase 1 is the canon,
  phase 2 is demolition. The concern is real in general and the order already answers it.

**KEPT AS A STANDING WARNING, not actionable yet.**
- *"It assumes resolving web + glass will produce a quick stable canon instead of another 40-round
  icon war."* This is the honest risk and no plan wording fixes it. The mitigation that exists is
  structural: the canon is decided ONCE against rendered options, and after that the loop builds to
  it and does not re-open taste.
- *"It pretends the unattended loop can be trusted to stop or self-correct when the design
  contradiction reappears."* Fair. The screenshot-and-diff gate above is the only thing standing
  between that risk and 40 unseen screens.
