# Accent color research: X, ChatGPT, Airbnb/Fresha vs Solen's blue-sparse lock

Research brief only. No mockups, no code changes. Purpose: inform a PROPOSAL for using
Solen's blue accent `#276EF1` more, or confirm the current sparse-blue-plus-ink-CTA lock is
already the right calibration. Owner framing: "we use black everywhere."

Method: Mobbin screen search (live app screenshots, iOS + web), web search for brand/design
documentation, and OpenAI's own public developer docs for ChatGPT. Every claim below is cited
inline. Where a hex value could not be confirmed from a primary source it is marked
"unconfirmed" rather than invented, per the no-invented-values rule.

---

## 1. X (Twitter)

### Where blue appears

Mobbin screenshots of the live X iOS app show blue (`#1D9BF0`, the historical "Twitter Blue")
used consistently for a specific, narrow set of jobs, not for general UI chrome:

- **The floating compose button (FAB).** Every X home/profile/search screen captured shows a
  solid blue circular "+" button pinned bottom-right. This is the single highest-frequency
  primary action in the app (start a new post) and it is blue, not black.
  ([X screen](https://mobbin.com/screens/9590c034-60dd-4cd1-9ea5-a6874f4aa75a), [X screen](https://mobbin.com/screens/c3bd9fe0-b62d-4ced-a8db-fc059d3601ea))
- **The composer's primary "Publish"/Tweet button.** In the compose/thread-editor screen
  captured, the top-right commit action reads "Publish" in solid blue fill on a dark
  background, while the secondary "Finish later" sits as plain blue text to its left.
  ([X compose screen](https://mobbin.com/screens/386512af-ad60-4fc7-892f-0ce5bbe51616))
- **Active tab / selected state.** The selected top tab ("For you", "Following", or a custom
  timeline) is marked with blue text plus a blue underline bar, while unselected tabs are grey.
  Same pattern on the profile sub-nav (Tweets / Tweets & replies / Media / Likes): the active
  tab is blue text + blue underline, inactive tabs are grey.
  ([X profile screen](https://mobbin.com/screens/182f4d32-8b26-410d-a625-f39c5c92a746))
- **Links inside post text and bios.** URLs, @mentions, and hashtags render in blue inline
  with otherwise black/white body text (e.g. "instagram.com", "@archillinks" in a bio).
  ([X profile screen](https://mobbin.com/screens/40bde1bc-2e43-4e64-8e25-4d1ace077fa8))
- **Selected/checked states in settings and toggles.** In a notification-preferences sheet,
  unselected radio circles are grey outlines; once tapped, every one of them fills solid blue
  with a white checkmark. This is a direct "selected = blue" pattern for list-style option
  pickers. ([X screen](https://mobbin.com/screens/8f563770-f5ed-4e39-9e7f-efbf910d5045))
- **A lightweight "you have unread activity" dot.** Search results describe a blue dot on the
  notifications-bell icon as the low-emphasis unread indicator, used specifically when the
  user has disabled the numeric badge count ([boostmeup.com](https://boostmeup.com/blog/disable-unread-notifications-counter-on-twitter-mobile/)).
  This is a secondary, quieter signal, separate from the red numeric badge (see section 4).

### Where blue does NOT appear

- **The "Follow" button is NOT blue.** Every profile screen captured shows "Follow" as a
  black-outline pill (unfollowed state) and, once followed, either a black-filled "Following"
  pill or a white pill with a black border and black text
  ([X profile screen](https://mobbin.com/screens/40bde1bc-2e43-4e64-8e25-4d1ace077fa8), [X screen](https://mobbin.com/screens/b8bff91d-84ed-41cc-8ed8-cc50e89577d2)).
  This is X's single highest-frequency relationship-commitment CTA and it is rendered in
  ink/black, not blue, mirroring Solen's own "the one commit action stays ink" rule.
- **Body text, names, timestamps, tab bar icons (unselected), and post metadata (reply/retweet/
  like counts)** are all rendered in white/grey/black, not blue. The bottom tab bar icons
  (home, search, communities, notifications, messages) are white/grey when inactive; only the
  active one picks up color, and even then it's typically white-on-black rather than
  blue-on-black for the tab bar specifically (blue is reserved for the top content tabs, per
  above).
- **Legacy verified-badge blue** (`#1D9BF0`) versus the newer paid-verification gold/grey
  badges is a separate brand-identity signal, not a general UI accent, and is out of scope
  here.

### How X mixes black primary CTAs with blue

The pattern that emerges from the screenshots is a **two-tier commitment model**, not a
single-accent system:

1. **Relationship / identity commitments → black.** Follow, Following, Subscribe-style
   membership actions read as black-fill or black-outline pills. These are actions with
   social or financial weight (you are committing to a person or a paid relationship).
2. **Content-creation / navigation / in-flow actions → blue.** Compose, Publish, active tab,
   links, and list-selection states are blue. These are lower-stakes, frequent, in-the-moment
   actions (write something, decide which tab you're viewing, follow a link).

This maps closely to what Solen's own contract already encodes: "ONE commit CTA stays ink" vs
"blue is a small clickable accent." X's twist is that blue also carries the **compose FAB**
(X's single most-repeated primary action) and **active-tab state**, both of which Solen
currently renders in ink/grey rather than blue.

Sources: [X screens via Mobbin](https://mobbin.com/screens/9590c034-60dd-4cd1-9ea5-a6874f4aa75a) (search "X Twitter home feed dark mode with blue accent buttons", "X Twitter profile follow button blue with unread notification dot", "X Twitter compose new post button and reply button black"); [Twitter Brand Color Palette, Mobbin](https://mobbin.com/colors/brand/twitter); [Twitter colors palette, color-hex.com](https://www.color-hex.com/color-palette/1011163); [boostmeup.com notification badge guide](https://boostmeup.com/blog/disable-unread-notifications-counter-on-twitter-mobile/).

---

## 2. ChatGPT app

### Baseline: near-monochrome by default

Every ChatGPT iOS screenshot captured on Mobbin (default theme, not a custom accent) shows a
white/light-grey canvas, black body text, black/grey icons, and a plain grey message-input
pill. There is no colored primary button visible in the resting/empty-chat state screens
([ChatGPT screen](https://mobbin.com/screens/f08ad45c-a3db-44f6-8cab-d42e1312f25d), [ChatGPT screen](https://mobbin.com/screens/ffe03669-a64a-406c-98c5-32d85f3ea382)).

### Where color DOES appear

- **The send button.** Multiple screenshots show the circular send arrow in a soft
  blue-violet/periwinkle fill (distinct from a pure blue) once there is text to send; it also
  appears as a plain black circle in at least one captured screen, and other screenshots show
  it grey/disabled with no text entered. This confirms the send button is the primary
  enabled/disabled color-bearing control in the composer
  ([ChatGPT screen](https://mobbin.com/screens/16cce99f-7c23-413e-b96f-5890122d694c), [ChatGPT screen](https://mobbin.com/screens/9686c84e-87cd-496a-bd48-9dc52c954cc5), [ChatGPT screen](https://mobbin.com/screens/154c98be-dad0-40f4-868f-72f1c2f6e635)).
- **"Get Plus +" upgrade chip.** Rendered as a pale lavender pill with dark violet text in the
  top nav, a distinct, branded "upgrade" accent separate from the send button's color
  ([ChatGPT screen](https://mobbin.com/screens/7cf7c3f2-c99e-4aeb-ac56-7d29ed82cc98)).
- **GPT-4 model-selector chip.** A small sparkle icon + "GPT-4" label picks up a light
  purple/violet tint against the neutral GPT-3.5 tab beside it, signaling "premium model
  selected" ([ChatGPT screen](https://mobbin.com/screens/f08ad45c-a3db-44f6-8cab-d42e1312f25d)).
- **Links inside assistant/user messages.** "Customize ChatGPT" and "Invite with link" render
  as blue text inside an otherwise black-and-white group-chat transcript
  ([ChatGPT screen](https://mobbin.com/screens/8cebeed2-fe06-43a2-b4c4-66b6d13a71fd)).
- **A user-configurable accent system.** OpenAI's own help center documents a "Chat Themes"
  feature: users pick one of Default, Blue, Green, Yellow, Red, Purple, Pink, Orange, or
  Pro/Black, and "the available accent colors ... currently affect only the background of user
  messages and the submit button" ([Threads post citing the feature](https://www.threads.com/@btibor91/post/DMgAQvkKo1x/new-chatgpt-web-app-experiment-chat-themesthe-available-accent-colors-default-bl), [Pureinfotech how-to](https://pureinfotech.com/change-chatgpt-accent-color/)).
  This is the clearest signal in this whole research pass: OpenAI has explicitly scoped color
  to exactly two elements (send button, user-message bubble) and left everything else
  monochrome regardless of which accent the user picks.
- **Loading/thinking indicator dot.** A solid dark teal/green circle appears as the
  "assistant is responding" indicator in several captured screens
  ([ChatGPT screen](https://mobbin.com/screens/16cce99f-7c23-413e-b96f-5890122d694c), [ChatGPT screen](https://mobbin.com/screens/f08ad45c-a3db-44f6-8cab-d42e1312f25d)).

### What the restraint signals (from OpenAI's own developer documentation)

OpenAI's public Apps SDK UI guidelines page states the rule explicitly for any third-party
surface embedded inside ChatGPT ([developers.openai.com/apps-sdk/concepts/ui-guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines)):

> "Use system colors for text, icons, and spatial elements like dividers."
> "Partner brand accents such as logos or icons should not override backgrounds or text
> colors."
> "Use brand accent colors on primary buttons inside app display modes."
> "Don't apply colors to backgrounds in text areas."
> "Use either system icons or custom iconography that fits within ChatGPT's visual world,
> monochromatic and outlined."

This is a codified version of "accent color is a PRIMARY-BUTTON-ONLY privilege." Every other
surface (text, icons, dividers, backgrounds) is locked to system neutrals. Even third-party
apps plugging into ChatGPT are told: your brand color gets exactly one job, the primary
button, and nothing else.

Sources: [OpenAI Apps SDK UI guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines); [ChatGPT screens via Mobbin](https://mobbin.com/screens/16cce99f-7c23-413e-b96f-5890122d694c) (search "ChatGPT app chat screen with send button"); [Pureinfotech: How to change ChatGPT accent color](https://pureinfotech.com/change-chatgpt-accent-color/); [Threads post on ChatGPT Chat Themes experiment](https://www.threads.com/@btibor91/post/DMgAQvkKo1x/new-chatgpt-web-app-experiment-chat-themesthe-available-accent-colors-default-bl).

---

## 3. Airbnb / Fresha (marketplace calibration)

### Airbnb: Rausch as a single reserved accent

Live Airbnb iOS screenshots (search results, PDP, review sections) confirm the current
in-product primary is a vivid reddish-pink used almost exclusively on the **"Reserve" button**,
which appears as a solid pink/red pill in every listing detail screen captured
([Airbnb PDP screen](https://mobbin.com/screens/e3d74ecb-1a94-421a-9f2e-816403d94fed), [Airbnb PDP screen](https://mobbin.com/screens/7e5254ab-24b9-44f2-b272-3ed89e1ec184), [Airbnb PDP screen](https://mobbin.com/screens/ead9ffcb-c223-4fc1-9d69-f4e98031d350)).

The heart-shaped "save to wishlist" icon also uses the same pink/red once filled/saved (e.g. a
filled heart in the top-right corner, and the toast "Saved to your Chill wishlist!" confirming
the save action), while it is a plain white/grey outline heart when unsaved
([Airbnb PDP screen](https://mobbin.com/screens/7e5254ab-24b9-44f2-b272-3ed89e1ec184)).
This means Airbnb's brand-pink and its save/heart semantic both share one hue. That is a
deliberate brand choice (make "love this place" feel like the brand), not a universal
semantic-color convention. Star ratings stay in plain black/dark-grey text next to a filled
black star glyph in every captured screen, not yellow, and not pink
([Airbnb PDP screen](https://mobbin.com/screens/ead9ffcb-c223-4fc1-9d69-f4e98031d350)), which
diverges from Solen's yellow-star convention and from the "universal" yellow-star pattern
described in section 4, an Airbnb-specific brand override worth noting as an exception, not a
rule to copy.

Design commentary on Airbnb's system describes the intent directly: "They use the rausch as
their primary color to accent important actions like requesting to book a listing. A single
high-chroma accent, reserved only for primary actions, reads as confidence. Everything else is
near-neutral ink and warm greys, so the one red always means 'do this.'"
([Superdesign: How Airbnb Designs Their UI](https://superdesign.dev/blog/airbnb-design-system)).
Two more source notes: the shipped hex has moved over time (2014-era Rausch `#FF5A5F` vs. a
newer, more vibrant `#FF385C` cited as the current live-UI primary in the same source); treat
`#FF5A5F`/`#FF385C` as Airbnb-attributed values from secondary design writeups, not something
to import into Solen. ([Superdesign: How Airbnb Designs Their UI](https://superdesign.dev/blog/airbnb-design-system); [U.S. Brand Colors: Airbnb](https://usbrandcolors.com/airbnb-colors/))

Text links inside Airbnb screens (e.g. "Show all 239 reviews" is NOT a link, it renders black
with an underline; "Show more" under a review renders black-underlined too, not colored) are
notably ink, not accent-colored, in the captured screens
([Airbnb PDP screen](https://mobbin.com/screens/ead9ffcb-c223-4fc1-9d69-f4e98031d350)). Airbnb
appears to reserve its accent even more tightly than X: pink is close to CTA-and-heart-only,
with link-style affordance carried by underline instead of color. This is a stronger form of
restraint than Solen's current "blue for text links" rule.

### Fresha: blue/azure as the single booking accent, black as the commit-button color

Fresha's own brand documentation describes a palette built on "Bunker" (near-black `#0D1619`),
white, and "Azure Radiance" (`#037AFF`) as the two-accent system, with the blue explicitly
scoped to "highlighting key actions" and guiding the booking flow
([Abduzeedo: Branding and Design System for Fresha](https://abduzeedo.com/branding-and-design-system-fresha)).

However, the live Fresha product screenshots captured on Mobbin tell a more specific story:
the actual **commit buttons in the booking flow are black**, not blue. "Confirm," "Pay now,"
"Continue to payment," and "Continue" all render as solid black-fill pills across checkout,
tip-selection, and payment screens
([Fresha screen](https://mobbin.com/screens/1f95a596-cc30-4467-8cde-013944cc6fe2), [Fresha screen](https://mobbin.com/screens/8dbb5c9c-f5a7-4b38-b986-947904840589), [Fresha screen](https://mobbin.com/screens/4362ca81-cdc5-40b3-9be8-b551a5d78d0b)).
Blue/purple appears instead on: the selected-state border of a radio-style choice card (e.g.
"Cash" payment method selected gets a purple-blue outline while unselected options stay grey-
outlined), the selected date circle in the date-picker strip, and small pill toggles like
"Any time" in a waitlist filter
([Fresha screen](https://mobbin.com/screens/54788d35-8d01-46e9-9195-fd4ab3049317), [Fresha screen](https://mobbin.com/screens/edfb1a02-b7ef-4354-850d-cf7b9ce8b74a), [Fresha screen](https://mobbin.com/screens/6a9aa1c2-0adc-4123-8dc9-3e9cdcab1562)).
A "Change" amount and other small currency deltas appear in green text, a semantic (not brand)
signal for "money owed back to the customer"
([Fresha screen](https://mobbin.com/screens/edfb1a02-b7ef-4354-850d-cf7b9ce8b74a)).

This is a strong, directly relevant precedent for Solen (same category, same booking-flow
shape): **Fresha's brand blue does NOT own the primary commit button. Black owns it. Blue owns
selection/active-state and small in-flow choices.** This is effectively the same two-tier model
X uses (ink for commitment, accent for lighter-weight in-flow choices), independently arrived
at by a direct competitor in the same vertical as Solen.

Sources: [Fresha screens via Mobbin](https://mobbin.com/screens/1f95a596-cc30-4467-8cde-013944cc6fe2) (search "Fresha booking checkout screen with confirm button"); [Abduzeedo: Branding and Design System for Fresha](https://abduzeedo.com/branding-and-design-system-fresha); [Airbnb screens via Mobbin](https://mobbin.com/screens/e3d74ecb-1a94-421a-9f2e-816403d94fed) (search "Airbnb search results listing card with heart save icon and reserve button"); [Superdesign: How Airbnb Designs Their UI](https://superdesign.dev/blog/airbnb-design-system); [U.S. Brand Colors: Airbnb](https://usbrandcolors.com/airbnb-colors/).

---

## 4. Universal / semantic color conventions across these apps

Cross-referencing the three apps above plus general design-system literature:

| Signal | Convention observed | Evidence |
|---|---|---|
| Success / confirmation | Green | General UI convention: "Green is often used to indicate success or completion of a task" ([UXPin / design-systems roundup search synthesis](https://www.uxpin.com/studio/blog/color-consistency-design-systems/)). Fresha uses green specifically for a "change owed" monetary delta, a success-adjacent signal ([Fresha screen](https://mobbin.com/screens/edfb1a02-b7ef-4354-850d-cf7b9ce8b74a)). |
| Error / destructive | Red | Universally cited convention: "red means error or danger" across the design-system sources surveyed. Not directly visible in the captured screenshots (none showed an error state) but this is the most consistent convention in the broader literature reviewed. |
| Star / rating | Black (Airbnb) vs colored (general convention elsewhere) | Airbnb specifically renders its star rating in black/dark-grey, not yellow, in every captured PDP screen ([Airbnb PDP screen](https://mobbin.com/screens/ead9ffcb-c223-4fc1-9d69-f4e98031d350)). This is a notable divergence from the "yellow star" pattern Solen already locks; treat Airbnb as the exception, not the rule, since yellow-star is a much broader convention (App Store, Google Play, Yelp, Fresha, Google Maps all use yellow/gold stars). No app captured in this pass showed a yellow star directly, so Solen's existing yellow-star lock should stay grounded in the wider convention, not in Airbnb.
| Like / heart / save | Brand-matched pink-red (Airbnb) | Airbnb's heart-save icon fills with the same Rausch pink as its primary CTA once saved ([Airbnb PDP screen](https://mobbin.com/screens/7e5254ab-24b9-44f2-b272-3ed89e1ec184)), toast-confirmed by "Saved to your Chill wishlist!" copy in the same screenshot. X's like-heart icon is not blue in any captured screenshot (X's like icon is conventionally its own red-pink, independent of the blue interaction accent, consistent with the broader "heart = pink/red regardless of brand accent" convention cited in general research, though this specific X screenshot detail was not directly re-confirmed in this pass and should be treated as a corroborating, not primary, data point). |
| Availability / online / active | Green | Not directly captured in this pass's screenshots (none of the three apps studied have an "availability" concept equivalent to Solen's salon open/closed signal), but this is the convention Solen already locks and nothing surfaced here contradicts it. |
| Unread / notification count | Red numeric badge, blue as a lighter secondary dot | X specifically documented: red badge shows the actual unread count; a blue dot is the fallback "you have something unread" signal when the numeric badge is turned off ([boostmeup.com](https://boostmeup.com/blog/disable-unread-notifications-counter-on-twitter-mobile/)). This confirms red, not the brand-blue accent, is the primary "needs attention" signal, even in an app whose accent IS blue, an important precedent: the interaction-accent color and the attention/urgency color are kept semantically separate even when they happen to both be a shade of blue-adjacent. |
| Premium / upgrade | App's own distinct tint, separate from its primary accent | ChatGPT's "Get Plus" pill and GPT-4 selector both use a light violet/lavender distinct from the send button's periwinkle-blue ([ChatGPT screen](https://mobbin.com/screens/7cf7c3f2-c99e-4aeb-ac56-7d29ed82cc98)). This shows even a single-accent app splits out a second, adjacent hue for "upgrade/premium" rather than reusing its primary accent for that job. |

**Overall pattern:** every app studied treats semantic colors (success, error, rating,
like/save, urgency/unread) as INDEPENDENT of its interaction/brand accent, even in cases where
the semantic color happens to be adjacent on the color wheel (X's blue accent vs. blue-dot
unread signal are still two separate, purposefully distinct tokens). No app studied recolors a
semantic element to match its brand accent, except Airbnb's heart/save icon, which is the one
deliberate exception, explainable because "love/save" is emotionally continuous with Airbnb's
brand meaning in a way "your booking succeeded" or "this booking failed" is not.

---

## 5. Synthesis: candidate rules for Solen

Eight concrete candidate rules, each with a pro/con against Solen's current lock (blue sparse,
small-clickable-only; big CTAs ink; selected states neutral-gray per V3-D450/2026-06-29).

### Rule 1: Give blue the active/selected TAB state (not just filter pills)

X's active content-tab (For you / Following, or profile's Tweets / Replies / Media) is blue
text + blue underline; inactive tabs are grey. Solen's current lock already uses blue this way
in some places (nav sub-items) but locks filter PILLS and selected LIST OPTIONS to neutral gray
fill instead (V3-D450, reconfirmed 2026-06-29).

- **Pro:** A tab underline is genuinely a small, low-stakes, purely-navigational element,
  exactly the profile blue is locked to ("small clickable bits"). Low risk of drifting toward
  "blue everywhere."
- **Con:** Solen's filter-pill lock was a deliberate reversal away from blue (V3-D450 superseded
  an earlier blue-pill state specifically because pills felt too loud). A plain top-tab
  underline (not a filled pill) is a different enough shape that this rule would NOT need to
  reopen the pill lock, but the owner needs to explicitly confirm "tab underline" is a distinct
  surface from "filter pill" before this ships, otherwise it reads as quietly re-litigating
  V3-D450.

### Rule 2: Blue on the primary FAB / compose-style action, when the action is content-creation, not a financial commitment

X's compose "+" FAB is blue, not black, even though it is arguably X's single most-used
primary button. The rationale from the two-tier model: black is for relationship/financial
commitments (Follow, Subscribe, pay), blue is for lightweight content actions (write a post).

- **Pro:** Solen doesn't currently have a true "compose" analog, but something like "leave a
  review," "message a salon," or "start a new search" could plausibly sit in this tier. It
  would give the owner a principled reason to use blue on ONE more surface without touching the
  booking-commit CTA.
- **Con:** Solen's core primary actions (Book, Pay, Confirm) are all financial/relationship
  commitments in the X/Fresha framing, meaning almost nothing in Solen's actual product
  currently qualifies for this treatment. Risk of forcing a distinction that doesn't cleanly
  exist in a booking marketplace the way it does in a social app. Needs owner to name a
  specific real screen this would apply to before it's actionable.

### Rule 2.5: Confirm Solen's booking commit stays ink, calibrated against Fresha directly

Fresha, the closest direct competitor and structural reference, renders Confirm / Pay now /
Continue as solid black across its entire booking flow, not its brand blue
([Fresha screens](https://mobbin.com/screens/1f95a596-cc30-4467-8cde-013944cc6fe2)). This is
the single strongest piece of competitive evidence in this research pass.

- **Pro:** Directly validates Solen's existing lock ("the ONE commit button stays ink"). This
  is not a new rule to adopt, it's confirmation the current lock is already correctly
  calibrated against the nearest competitor, and should NOT be loosened.
- **Con:** None identified against Solen's current position; if anything this argues for MORE
  confidence in the ink-CTA lock, not less. Flagging as a rule anyway because the owner's
  framing ("we use black everywhere," implying a wish to change) makes it worth stating
  explicitly that the evidence argues to keep, not loosen, this specific lock.

### Rule 3: Reserve a second, distinct accent hue for "premium/upgrade," never reuse the primary accent

ChatGPT never recolors its send-button blue for the "Get Plus" upgrade prompt; it uses a
separate light violet instead ([ChatGPT screen](https://mobbin.com/screens/7cf7c3f2-c99e-4aeb-ac56-7d29ed82cc98)).

- **Pro:** If/when Solen ships a paid-tier or promo-upsell surface, this is a ready-made
  precedent for NOT just reusing `#276EF1` for that too, keeping "interactive accent" and
  "upsell" visually distinct.
- **Con:** Solen has no current premium-tier UI, so this rule has no surface to apply to today.
  Also, introducing a second accent hue is exactly the kind of palette-expansion the owner's
  "black everywhere" framing may be pushing back against; this needs an explicit owner decision
  before any second hue gets defined, not an assumption.

### Rule 4: Keep destructive/error red fully separate from the accent, even if a future accent shifts

Every source in section 4 confirms error=red as one of the most universally stable
conventions, orthogonal to whatever the brand's interactive accent is.

- **Pro:** This is already Solen's rule (error red, independent of blue accent, LOCKFILE
  section on semantic colors). Zero risk, zero change needed. Worth stating explicitly as a
  "don't touch this" boundary condition for any accent-expansion proposal.
- **Con:** None. This is a guardrail, not a change.

### Rule 5: Let the unread/attention signal be red (or a dedicated urgency color), not blue, even on blue-accented surfaces

X's own bell-icon badge uses red for "count," reserving blue-dot only as a quieter fallback,
meaning even X (a blue-accented app) doesn't let its primary accent carry the "needs attention"
job. ([boostmeup.com](https://boostmeup.com/blog/disable-unread-notifications-counter-on-twitter-mobile/))

- **Pro:** Directly reusable if Solen ever adds notification badges (e.g. new booking request,
  unread salon message). Keeps "attention" and "brand interactivity" from competing for the
  same hue.
- **Con:** Solen doesn't currently have a notification-badge surface in scope, so like Rule 3
  this is forward-looking rather than immediately actionable. Low risk either way since it
  aligns with the existing red=error/urgent convention already locked.

### Rule 6: Heart/save icon can plausibly match a brand accent (Airbnb precedent), but this is the one sanctioned exception, not a general license

Airbnb's save-heart fills with the same Rausch pink as its Reserve CTA once saved
([Airbnb PDP screen](https://mobbin.com/screens/7e5254ab-24b9-44f2-b272-3ed89e1ec184)).

- **Pro:** Solen already has a save-heart in pink (`#FF3366`, separate token from the blue
  accent, per the project's semantic-colors memory). Airbnb's precedent argues this pairing
  (brand-adjacent, emotionally continuous "I love this") is fine to keep pink and not force
  into blue, i.e. this rule argues AGAINST expanding blue into the heart icon, confirming the
  current setup rather than proposing a change.
- **Con:** If read the other direction, someone could misuse this precedent to argue "Airbnb
  matches its heart to its main accent, so Solen's heart should become blue instead of pink."
  That would be a misapplication: Airbnb's heart matches ITS OWN accent (pink on pink), it does
  not argue for cross-hue matching. Flagging explicitly so this precedent isn't cited backwards
  later.

### Rule 7: A tri-tone system (ink CTA / accent selection-and-links / one semantic set) is the actual pattern in every app studied, not a binary "monochrome vs colorful" choice

Across X, ChatGPT, Airbnb, and Fresha, none of the four apps is either "monochrome" or
"colorful" in a simple sense. Every one of them runs three parallel tracks at once: (a) an
ink/black tier for the highest-commitment action, (b) a brand-accent tier for lower-stakes
in-flow choices (tabs, links, selection borders, compose), and (c) a semantic tier (red/green/
star-black-or-yellow) that never borrows from either of the first two.

- **Pro:** This reframes the owner's "we use black everywhere" observation usefully: the
  answer isn't "add more blue broadly," it's "identify which SPECIFIC additional surfaces
  belong in the accent tier vs. the ink tier," the same three-tier split Solen's LOCKFILE
  already encodes, just with room to review whether 1-2 more surfaces (tab underlines,
  potentially) should move from ink/neutral into the accent tier.
- **Con:** This is a meta-rule, not a specific surface change, so on its own it produces no
  action. It should frame the mockup-stage conversation (which specific surfaces move) rather
  than be treated as a shippable rule by itself.

### Rule 8: Restraint itself is often the stronger signal, not weaker: verify "more blue" is solving a real problem before applying any of the above

OpenAI's own developer documentation for ChatGPT explicitly locks partner accents to ONE job
(primary button only) and text/icons/dividers to system neutrals regardless of the accent
picked ([developers.openai.com/apps-sdk/concepts/ui-guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines)).
Airbnb goes even further, using underline instead of color for its text links. Both of the
apps with the most engineering/design maturity in this set are MORE restrictive with color
than X, not less, and Fresha (the closest direct competitor) keeps its commit buttons black
despite having a usable brand blue.

- **Pro:** This is the load-bearing counter-argument to "we use black everywhere = we should
  add more blue." Two of four reference apps studied (ChatGPT, Fresha) actively demonstrate
  that a booking/utility-style product deliberately keeps color OFF its highest-stakes buttons
  even when it owns a usable brand accent. Fresha does use its blue for selection state
  (payment-method radio border, selected date), so the restraint is specific, not total: it is
  scoped to keeping the accent OFF the commit button, while still allowing it on lower-stakes
  selection UI. This should be surfaced to the owner as a genuine tension before any mockup
  work begins: the evidence splits between "X uses blue more broadly (tabs, compose FAB)" and
  "ChatGPT + Fresha use it more narrowly than a first read of Solen's own lock might suggest,"
  and both readings are simultaneously true depending which surface is in question.
- **Con:** If the owner's actual goal is "the product feels flat/lifeless," restraint-as-answer
  risks being read as "no changes needed," which may not address the real complaint. The
  fable-methodology rule 5 (goal, not action) applies directly here: before scoping ANY mockup
  off this brief, ask the owner what specific feeling ("we use black everywhere") is supposed
  to produce, dull, corporate, unclear-what's-clickable, or something else, since the four
  candidate fixes (more tab-color, more selection-color, a second premium hue, nothing) solve
  different problems.

---

## Note on the "we use black everywhere" framing

Every reference app studied except X leans MORE restrained with its accent than Solen's own
already-locked rules in at least one dimension (Fresha's commit buttons, Airbnb's link
treatment, ChatGPT's per-surface accent scoping). X is the one outlier that uses its accent
more broadly, specifically on tab-selection state and its compose FAB. This means the honest
finding from this research pass is: there is a real, specific, evidence-backed case for
extending blue to ONE surface (active tab/selection state, rule 1) and possibly a
compose-style action if one exists (rule 2), but there is not a broad evidence base for
"more blue generally." The mockup-stage conversation should be scoped narrowly around rule 1
and rule 2, not treated as a general license to re-open the CTA-ink lock or the filter-pill
gray lock.
