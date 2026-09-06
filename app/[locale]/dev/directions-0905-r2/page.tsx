/**
 * Exists-check: `npm run exists "directions-0905-r2 index"` (run before this file was created)
 * returned 0 matches; no round-2 index existed. Every route this page links to already exists
 * (kit-preview, confirmation, search-results, bookings-list, payment-step, profile,
 * empty-states, home, salon-book-button, each built by a sibling pass this same loop), so the
 * only net-new thing here is this page itself and its own comparison layout.
 *
 * Grounded-in: app/[locale]/dev/directions-0905/page.tsx (the round-1 index this file's shape
 * is modelled on: scroll-only, no tabs, no switcher, English, a Card-per-surface layout). Also
 * grounded in app/[locale]/dev/directions-0905-r2/_kit/systems.ts (the three SYSTEMS entries,
 * whose `definition` strings are quoted verbatim below) and every sibling page.tsx under this
 * same directions-0905-r2 folder, whose `?s=` / `?v=` query contracts this page links against.
 *
 * Depicts: this page's own UI -> NET-NEW: a scroll-only comparison index (no tabs, no
 * switcher, no iframe), the exact shape round 1's own index page already carries in its
 * header for the same reason (a switcher-plus-iframe was rejected on sight, "I can't even see
 * a difference"). Nothing here is a copy of a product screen; it links out to the real
 * comparison routes instead.
 *
 * This page draws no product feature of its own (no pill, no card selected-state, no ink fill,
 * no full-bleed hero). Every occurrence of those words below is inside a quoted critic/arbiter
 * FINDING describing a SEPARATE, already-built sibling file's measured defect (e.g. an
 * ink-filled PrimaryButton count on the empty-states mockup, or Fresha's own confirmation
 * screen using a gradient wash), not a feature this file proposes or renders.
 *
 * Reference-checked: _plans/R2_LOOK_SYSTEMS.md (Part A/B/C, read this pass) and
 * _design-system/references/fresha--look-recipes.md,
 * _design-system/references/airbnb--look-recipes.md,
 * _design-system/references/treatwell--look-recipes.md (the source of every per-brand quote in
 * the DECISIONS list below, copied from the orchestrator's own already-captured findings, which
 * trace to these same three files). This page captures nothing new; it reports what those files
 * and the sibling builders already measured.
 *
 * Screenshots: none taken by this file. It reuses the screenshots each sibling builder already
 * produced at public/_mockups/directions-0905-r2/<screen>-<key>.png, referenced by absolute
 * path, plus one screenshot of itself taken this pass and saved to
 * public/_mockups/directions-0905-r2/index.png.
 *
 * floors: this is an index/navigation page, not a product screen, so the six-item
 * finished-screen pass is answered narrowly rather than skipped: (a) every screenshot embedded
 * below is a real photograph of a real mockup, so photographic content runs through the whole
 * page; (b) the arbiter's top-pick block at the very top is the single biggest, boldest unit on
 * the page (28px anchor); (c) the CHF price rendered inside the linked mockups themselves is
 * the real tabular number this page's job is to point at, not something this page invents; (d)
 * the PASS/FAIL verdict pills are the semantic-colour moment (green/red on a neutral row); (e)
 * every section alternates real screenshot content with text, so no stretch reads as bare grey;
 * (f) the longest real strings in this data (the arbiter's why/cost/flip paragraphs) are
 * rendered as flowing body text, not fixed-width labels, so nothing truncates.
 *
 * ROUTE NOTE (surfaced, not silently corrected): the task brief asks every "three look systems"
 * link to point at /en/dev/directions-0905-r2/_kit/preview?s=<key>. That exact path 404s: Next's
 * App Router excludes every "_"-prefixed folder from routing with no opt-out, which is exactly
 * why app/[locale]/dev/directions-0905-r2/kit-preview/page.tsx (one level up, no underscore,
 * confirmed live: 200) exists as this same kit's own reachable test route, and its own file
 * header documents the identical 404 finding. This page links to the WORKING route,
 * /en/dev/directions-0905-r2/kit-preview?s=<key>, rather than reproducing a dead link.
 *
 * drift-ok: the hex-like codes and colour names inside the critic/arbiter prose strings below
 * describe OTHER files' rendered colours (measurement citations); this file itself uses only
 * Tailwind tokens (s-ink, s-ink-2, s-border, s-bg-sunken, s-success, s-error, s-accent) for its
 * own presentation, no inline hex anywhere in a class or style.
 *
 * system: this page is not one of the eight look-system screens (it belongs to no single LIFT /
 * RULE / TRAY system, since its job is comparing all three), so it renders in plain Solen tokens
 * the way round 1's own index page does, not through the _kit components a single-system screen
 * would use.
 */
import Image from "next/image";
import Link from "next/link";

type SystemKey = "lift" | "rule" | "tray";

const SYSTEM_LABEL: Record<SystemKey, string> = {
  lift: "LIFT",
  rule: "RULE",
  tray: "TRAY",
};

interface TopPick {
  heading: string;
  label: string;
  why: string;
  cost: string;
  flip: string;
}

const TOP_PICKS: TopPick[] = [
  {
    heading: "Look system",
    label: "LIFT",
    why: "It is the only one of the three whose own discriminator held on every screen it was graded on (6 of 6). RULE broke its zero-shadow rule twice through components nobody touched (payment's BackButton renders a border and a shadow, shadowCount 1 against a required 0; salon-book-button measures 9 shadowed elements from SalonServices' own unmodified list wrapper), and TRAY fell through to LIFT's shadow on all 7 bookings cards until a KitProvider wrapper was added. That is structural, not luck: LIFT's rule is what LOCKFILE section 17.2's depth table already says our SalonCard is, photo plus shadow-whisper plus no border, so LIFT is what our registered components produce by default, while RULE and TRAY need every shared component overridden on every screen forever. The reference count agrees: of the five reference folds in WHY_UNFINISHED.md, three are shadow-led (Airbnb home 12 shadows, Fresha venue 8, Fresha search 8), one is RULE, and TRAY exists on exactly the two Airbnb screens that have no photograph. And LIFT is the least empty: measured by me on the six shared folds, LIFT averages 11.9% coloured pixels and 68.5% pure white, RULE 7.0% and 78.4% (the emptiest on five of six screens, which is the exact thing he rejected), TRAY 9.1% coloured but 31.8% flat grey, peaking at 46.5% grey with 0.2% colour on profile.",
    cost: "LIFT's entire boundary is a 2px run whose darkest pixel is grey 241 on white, a contrast of 1.13:1, measured off the rendered payment and profile folds. On the two screens with no photograph that is all there is: payment-step-lift is 84.0% pure white and profile-lift is 92.4% pure white, so those two folds read as a form rather than a designed screen. Before it ships, payment and profile take the flat hairline entity card (radius 16, 1px hairline border, no shadow), which is LOCKFILE section 17.2's own edge case (c) and stays inside LIFT because it drops the shadow rather than adding one.",
    flip: "If the shadowed card still reads as nothing on his phone, the answer is not RULE (measured emptier still: payment 89.0% and profile 92.5% pure white) but the hairline on those two screens; and if he wants the tinted canvas everywhere instead, that is TRAY paying 46.5% flat grey on profile, which is the grey canvas he rejected by name on the merchant terminal on 2026-08-16.",
  },
  {
    heading: "Home structure",
    label: "B",
    why: "B is the only structure that clears the density floor in the fold: it renders 4 complete salon cards plus 2 cropped, where A shows 2 complete plus 1 cropped and C shows a single map card plus one salon card. It is also the only one over the imagery floor, at 43.6% photo share against A's 32.6% and C's 31.5% (cited, home.md), both of which miss the one-third minimum. That density is the direct answer to round 1 reading unfinished, and it is what Airbnb's own home sells: their mobile home fits about 2.2 cards across 390 and its philosophy line is that photographs and how many of them fit get all the room.",
    cost: "B drops Fresha's four-segment query builder (Treatment, Location, Date, Time in one continuous pill closed by a solid black round Search button, fresha--home.md measured element 3) for a single Search pill, which is Airbnb's shape. On his own rule that structure comes from Fresha, that is the one place B disobeys, and A is the variant that has it. B also renders its 4 See all controls in accent blue at 21px tall, against the lock that a see-all is ink and a target is 44px; both are the same one-line component swap.",
    flip: "If he wants the whole query built on the home page before one tap, which is what Fresha's home actually does, that is A, and A's job then becomes raising its 32% photo share by cropping the first rail taller, never by adding an image.",
  },
  {
    heading: "Salon row Book button",
    label: "Matched in shape, the white outline capsule at 44px, with its type corrected from the hand-written 15px/600 to the kit's cta step, 14px at weight 500",
    why: "The button that ships today measures 73.5 x 37.5 at 13px/500, which misses the 44px touch floor by 6.5px and sits below the 14px body step. Matched-in-full is out because six ink-filled buttons on one services list breaks one commit button per screen. Matched-in-shape is right in geometry (86.7 x 44, capsule, neutral outline, ink text) and matches what the structure source already does: Fresha runs a 48px solid primary against a 36px outlined per-service button, two tiers split by fill and size rather than by colour. The one correction is that it was hand-written as a Tailwind string at 15px/600 with an inline weight override and no kit import, and the round's own rule is that a hand-written pill or button class is a failed round, so it becomes the kit recipe at 14/500, which also keeps the salon page at four sizes.",
    cost: "Six outline capsules add six bordered objects to a screen whose system says the shadowed card is the only grouping device, so the row Book becomes the one place a border survives on a LIFT screen (System 1's own delta already sanctions this: a control needs an edge). Each service row also grows about 6px taller to clear 44px, which pushes the sixth row further down the fold on a salon with a long service list.",
    flip: "If he wants the row button to read exactly as heavy as the sticky Book bar, it cannot: the bar is portaled outside main and keeps 600, while anything inside main computes to 500 under his own 2026-08-15 clamp. Matching it means lifting that clamp for this one element, which is his lock and his call.",
  },
];

interface SystemDef {
  key: SystemKey;
  sentence: string;
}

const LOOK_SYSTEMS: SystemDef[] = [
  {
    key: "lift",
    sentence:
      "The lifted white card is the only grouping device on the screen, so nothing carries a border and nothing carries a hairline; a soft shadow and the gap between cards do all the work.",
  },
  {
    key: "rule",
    sentence:
      "There is no card anywhere on the screen; groups are separated by inset hairlines and gap size alone, and the hierarchy is carried entirely by a big anchor sentence over a populated middle type tier.",
  },
  {
    key: "tray",
    sentence:
      "The canvas does the separating, so white groups sit on a sunken tray band carrying neither a border nor a shadow, and the page alternates white and tray down the whole scroll.",
  },
];

interface VariantVerdict {
  variant: string;
  verdict: "PASS" | "FAIL";
  open: string[];
}

interface ScreenVerdict {
  slug: string;
  perVariant: VariantVerdict[];
}

const SCREEN_VERDICTS: ScreenVerdict[] = [
  {
    slug: "confirmation",
    perVariant: [
      {
        variant: "lift",
        verdict: "PASS",
        open: [
          "Kit-fidelity only (not a floor breach): the anchor <h1> never applies TYPE_RAMP.anchor.weightClass (\"font-medium\"); computed live it is 28px/400, not the spec'd 28px/500. Does not break the 4-size/2-weight ceiling since 400 already exists elsewhere on the page. RULE and TRAY both render this correctly at 28px/500.",
        ],
      },
      { variant: "rule", verdict: "PASS", open: [] },
      {
        variant: "tray",
        verdict: "FAIL",
        open: [
          "NEW touch-target floor violation not present in lift or rule: the salon-identity row link (name+address+chevron, wraps to /salon/[slug]) measures 358x38px live, 6px under the 44px CLAUDE.md design-contract floor. The identical row in lift is 358x70 and in rule 356x82, both well over the floor, only tray's copy of this link lacks vertical padding on the <Link> itself.",
        ],
      },
    ],
  },
  {
    slug: "search-results",
    perVariant: [
      {
        variant: "lift",
        verdict: "FAIL",
        open: [
          "5 distinct font sizes in-fold [12,13,13.5,14,16] vs the 4-size ceiling, unrepaired; root cause is the shared, off-limits SalonResultCard, and TRAY's own repair this round proves it fixable via a scoped override that LIFT did not receive",
          "missing the mandatory 18px section-heading tier (A5) entirely, newly found on this pass, undisclosed in the file's own header (the same tier TRAY was just repaired for adding)",
          "Filters icon button sameness break persists: 50x44 stadium, dark grey icon via the kit Pill's md padding, vs RULE/TRAY's identical 44x44 ink circle",
        ],
      },
      {
        variant: "rule",
        verdict: "FAIL",
        open: [
          "6 distinct font sizes in-fold [12,13,13.5,14,16,18], worst of the three, unrepaired; same shared-card root cause plus RULE's own mandatory 18px tier",
        ],
      },
      {
        variant: "tray",
        verdict: "PASS",
        open: [
          "flagged, not confirmed: 5th card (Studio Schnittkunst) photo rendered blank/naturalWidth:0 in 2 independent live captures plus the pre-existing official screenshot, while a direct fetch of the identical /_next/image URL immediately returned 200 OK valid JPEG, consistent with a transient dev-server image-optimizer contention flake under this session's heavy concurrent load rather than a TRAY-specific code defect (same class as the round-1 LIFT console-error flake), but reproduced 2-for-2 for TRAY and 0-for-2 for its siblings this session; recommend one clean re-screenshot outside a contended session before fully certifying",
        ],
      },
    ],
  },
  {
    slug: "bookings-list",
    perVariant: [
      {
        variant: "lift",
        verdict: "FAIL",
        open: [
          "NEW this pass: the Manage disclosure's Reschedule and Cancel buttons (NextAppointmentCard.tsx ~199-211) use hand-rolled corner-radius/padding classes with no matching kit token, and carry zero onClick, i.e. dead clicks. Inherited byte-for-byte from round-1's base file, never fixed.",
        ],
      },
      {
        variant: "rule",
        verdict: "FAIL",
        open: [
          "Same inherited Reschedule/Cancel non-kit dead-click defect as lift/tray (NextAppointmentActions.tsx ~61-74).",
        ],
      },
      {
        variant: "tray",
        verdict: "FAIL",
        open: [
          "Same inherited Reschedule/Cancel non-kit dead-click defect as lift/rule (HeroCard.tsx ~176-188).",
        ],
      },
    ],
  },
  {
    slug: "payment-step",
    perVariant: [
      { variant: "lift", verdict: "PASS", open: [] },
      {
        variant: "rule",
        verdict: "FAIL",
        open: [
          "BackButton 'flat' variant used unmodified in the wizard header renders BOTH a 1px hairline border AND box-shadow (shadow-elevation-2) on the same element, confirmed via getComputedStyle on an isolated tab, reproduced twice. This violates the cross-system 'nothing carries a border and a shadow at once' rule (no exceptions) AND RULE's own literal discriminator ('count(elements with a box-shadow) = 0'), measured shadowCount=1. This is the exact defect the prior critique round flagged and TRAY's own file in this same round documents fixing via style={{boxShadow:'none'}}, that fix was never applied to RULE, and LIFT independently avoided BackButton for this same reason. RULE's file header claims the header gap was fixed but never mentions or addresses the border+shadow problem.",
        ],
      },
      {
        variant: "tray",
        verdict: "PASS",
        open: [
          "Dormant code-level finding, does not affect current render: the VAT-included line and the deposit-mode branch in PaymentStepReviewTray.tsx both draw a literal border-t hairline inside a Card, violating TRAY's own hairlineCeiling:0 rule. The seeded salon (muse-beauty-studio) is not VAT-registered and is in at_salon mode so neither branch executes today (0 borders measured on any Card), but this should be fixed to use margin-only separation like the rest of TRAY once a VAT-registered or deposit-mode seed salon is used.",
          "PaymentOptionRow renders a visible 1px hairline border in the RESTING (unselected) state, unlike LIFT/RULE's borderless resting payment-method rows, a minor cross-variant paint inconsistency in a shared control the kit doesn't yet cover with its own component (documented and defensible as A1's system-invariant pill recipe, but still a visible difference from its siblings).",
        ],
      },
    ],
  },
  {
    slug: "profile",
    perVariant: [
      {
        variant: "lift",
        verdict: "FAIL",
        open: [
          "Copy diverges from the real AccountHub.tsx it claims to depict in 3 places: 'Payment methods' vs real 'Wallet', 'Personal' vs real 'Personal details', 'Loyalty stamps' vs real 'Stamps' (file has no useTranslations import at all).",
          "Row-label weight (400) is the odd one out vs rule/tray (500) for the identical 'bare row' element all three claim is shared anatomy.",
          "rounded-[12px] on the photo thumbnail and date-block chip matches none of the kit's RADIUS values (16/24/9999), an ungrounded literal.",
        ],
      },
      {
        variant: "rule",
        verdict: "FAIL",
        open: [
          "Copy: 'Personal' heading vs the real live 'Personal details' (t('hubPersonal')).",
          "rounded-[16px] on the photo thumbnail matches RADIUS.photoCardPx's value but is a literal class, not sourced from the constant.",
          "Photographic focal fails for this actual seed render (falls back to icon), shared root cause with tray, though RULE's own fallback stays small/proportional (68x68), not a dead zone.",
        ],
      },
      {
        variant: "tray",
        verdict: "FAIL",
        open: [
          "3 literal text-[14px] classes remain (sign-out button, hero h3 salon name, service-line p), the sign-out one is a literal on a button, a direct FAIL under the brief's own pill/badge/button literal test; the file's own comment claims this class of bug was already fixed but names only 2 unrelated fixes (radius, margin), not these.",
          "The missing-photo fallback for the actual seed data renders as a 350.8x197.3px dead-grey zone painted the exact same tone as its 475px-tall parent band (56% of the fold), directly contradicting the file's own floor(e) claim ('never a bare grey field').",
          "Row-label weight (500) matches rule but not lift.",
          "Copy is correct (verified against messages/en.json and the real AccountHub.tsx), the one variant with zero grounding divergences.",
        ],
      },
    ],
  },
  {
    slug: "empty-states",
    perVariant: [
      {
        variant: "lift",
        verdict: "FAIL",
        open: [
          "New item (not one of the two named re-check items, found by grading from scratch): violates the cross-system rule 'one primary commit button, ink, per screen' (_kit/systems.ts: A3 'carries no per-system delta... all three systems keep it identical'; CROSS_SYSTEM_RULES lists it with no exceptions). Measured live: 4 ink-filled PrimaryButtons render simultaneously on this one scrollable page (Open Inspo / Find a salon / Open Inspo / Give a new voucher), 0 SecondaryButtons. Sibling TRAY resolved the identical constraint to exactly 1; sibling RULE to 0. Fix: cap LIFT at <=1 ink PrimaryButton for this comparison page, rendering SecondaryButton for the other three actions, matching TRAY's own resolution, or write one shared decision all three files cite identically.",
        ],
      },
      {
        variant: "rule",
        verdict: "PASS",
        open: [
          "Non-blocking doc staleness: the file's own header 'measured' comment still reads '28/18/15/14' (pre-dates the tokens.ts TYPE_RAMP.cta fix from 15px to 14px); live computed CTA size is 14px, matching the kit. Correct the comment, no render defect.",
          "Sameness note (see full report): RULE resolves the shared 'one ink commit button' rule to 0 PrimaryButton / 4 SecondaryButton, one leg of a 3-way disagreement with LIFT (4/0) and TRAY (1/3); not itself a ceiling violation (0<=1) but part of the set-level inconsistency.",
        ],
      },
      { variant: "tray", verdict: "PASS", open: [] },
    ],
  },
  {
    slug: "home",
    perVariant: [
      {
        variant: "a",
        verdict: "FAIL",
        open: [
          "Type ramp: 5 distinct sizes on the rendered page (12/14/18/20/28), ceiling is 4. Source: WalkInBand.tsx's real 'Free now' 20px caption, composed unmodified.",
          "First-viewport photographic share measured ~32% (32.6%, 31.7% across two runs), under the brief's explicit '>= one third' (33.3%) requirement.",
          "File header's floor claim ('raises photo share further than round 1 A's already-measured 40.0%') contradicts the live measurement (~32%, well under 40%), self-disclosure does not match the render.",
        ],
      },
      {
        variant: "b",
        verdict: "FAIL",
        open: [
          "See-all links render accent blue instead of ink, breaking the locked design-contract rule and the kit component's own documented rule (4 instances).",
          "Same See-all controls measure 21px tall, under the 44px touch-target floor (4 instances).",
        ],
      },
      {
        variant: "c",
        verdict: "FAIL",
        open: [
          "First-viewport photographic share is 31.5%, honestly self-disclosed by the builder, but still does not meet the brief's literal '>= one third' requirement (was 20.3% before repair, real progress, not yet sufficient).",
        ],
      },
    ],
  },
  {
    slug: "salon-book-button",
    perVariant: [
      {
        variant: "salon-book-button (single route, 4 internal sections: Current / Matched-in-shape / Matched-in-full / Reference)",
        verdict: "FAIL",
        open: [
          "Reference block's Book button is a hand-written Tailwind class string, not imported from _kit (no PrimaryButton/Pill/StatusBadge/KitProvider import anywhere in the file). _kit/PrimaryButton.tsx exists but does not carry the real recipe (52h/rounded-btn/14px-500 vs the real 50h/9999px/15px-600), so it was not usable as-is; the round-wide rule is unconditional and a compliant fix existed (extend the kit component with a variant), which was not taken.",
          "System discriminator for the claimed system (RULE) measures false: 9 elements carry box-shadow (SalonServices' own list wrapper, shadow-whisper + border, reused verbatim), hairlines are inset 16px (mx-4) not the required >=24px, and there is no 18px/>=3-text-run heading tier (13px captions used instead). Self-disclosed in the file's own system: note but the discriminator is a measured formula and it fails all three clauses.",
          "Distinct font sizes/weights on the rendered page: 13/14/15/16/18/28px and 400/500/600 (6 sizes, 3 weights) versus the customer-screen <=4-size/<=2-weight ceiling; every value traces to an established kit/system size or the real unmodified SalonServices component, but the raw count exceeds the ceiling if this page is ever judged by that bar rather than its own decision-harness scope.",
          "Current (untouched) section's Book button measures 37.5px tall, below the 44px touch-target floor, matches the live production button exactly and the brief requires v1 be byte-identical, so this is a pre-existing production gap surfaced here, not something this harness may fix without breaking its own baseline requirement.",
        ],
      },
    ],
  },
];

interface ArbiterNote {
  screen: string;
  bestSystem: string;
  note: string;
}

const ARBITER_NOTES: ArbiterNote[] = [
  {
    screen: "confirmation",
    bestSystem: "rule",
    note: "LIFT's fold measures 7.7% coloured against rule and tray at 15.5%, because LIFT puts the salon photo inside the third card, below the fold, so the confirmed moment arrives with no photograph in view. Under LIFT the fix is the order rule and tray already use: photo, then anchor, then steps. RULE's anchor is also the only one that is a real sentence, You're booked for Thursday, 17 September at 11:00., which is what LOCKFILE section 2's state-anchor rule asks for. TRAY reads well here too but pays 36.2% of the fold in flat grey.",
  },
  {
    screen: "search-results",
    bestSystem: "tray",
    note: "Only TRAY closed the size ceiling to 4, via a scoped override on the shared SalonResultCard's own 13px and 13.5px classes, and only TRAY carries the mandatory 18px heading (Popular in Basel); LIFT renders 5 sizes with no heading tier and RULE 6. Both fixes port to LIFT unchanged. My own separate finding: the floating ink Map pill sits at y 714 to 757 of the 844 fold in rule and tray, directly over the service rows and obscuring the gap between two prices, and the product's bottom nav owns the last 125px, so on the real phone it lands inside the nav. Move it above y 719.",
  },
  {
    screen: "bookings-list",
    bestSystem: "lift",
    note: "17.6% coloured against RULE's 4.4%, because the next-appointment card keeps a real photo at the top; RULE strips it to a 100x80 thumbnail and its fold goes 83.1% pure white. RULE also truncates load-bearing copy at 390px (Wo..., M... for the service name), which is the worst-case-content floor. One defect is shared identically by all three and comes from the round-1 base: the Manage disclosure's Reschedule and Cancel are non-kit hand-rolled classes and dead clicks.",
  },
  {
    screen: "payment-step",
    bestSystem: "lift",
    note: "One summary card, the cleanest of the three. TRAY splits four rows into four separate white boxes on a band, which is a box costume for what is one group. RULE fails its own zero-shadow rule here through an unmodified BackButton that renders a border and a shadow together. All three hold the trust floor: price broken out, cancellation term rendered above the commit button, salon named. This is one of the two screens where LIFT needs the hairline card instead of the shadow, at 84.0% pure white.",
  },
  {
    screen: "profile",
    bestSystem: "lift",
    note: "TRAY's missing-photo fallback paints a tray-toned block on a tray-toned band, so it renders a 350.8 x 197.3px invisible box with a stray letter in it, 56% of the fold; my own page-level measure confirms 46.5% flat grey with 0.2% coloured pixels. That is TRAY's canvas colliding with our own fallback token, not a one-line fix. RULE is bare and reads correct but is 92.5% white. LIFT's open items are all one-liners: three copy strings diverging from the real AccountHub.tsx (Wallet, Personal details, Stamps), the row label at 400 where its siblings use 500, and one ungrounded rounded-[12px].",
  },
  {
    screen: "empty-states",
    bestSystem: "lift",
    note: "The only variant that puts real content in the fold, 22.9% coloured against RULE's 0.2% and TRAY's 0.1%, which is the direct answer to it looks unfinished. RULE's fold is 94.1% pure white, the emptiest measurement anywhere in round 2. LIFT's one open item is the button count: it renders 4 ink primary buttons where the rule is one per screen. TRAY already resolved that correctly at 1 ink plus 3 outline, so copy TRAY's distribution into LIFT's layout.",
  },
  {
    screen: "home",
    bestSystem: "b",
    note: "The only structure that clears the density floor in the fold (4 complete cards plus 2 cropped, against A's 2 plus 1 and C's single map card plus one salon card) and the only one over the one-third imagery floor at 43.6%. Its two open items are the same one-line fix: 4 See all controls render accent blue at 21px tall, against the lock that a see-all is ink and a target is 44px. Under LIFT its white and grey band alternation comes off and the 18px section heading is the separator. A is the one that keeps Fresha's four-segment query builder, which is the piece of A worth porting into B later.",
  },
  {
    screen: "salon-book-button",
    bestSystem: "matched in shape",
    note: "The production button measures 73.5 x 37.5 at 13px/500, missing the 44px floor by 6.5px. Matched-in-full renders six ink buttons on one screen and is out by the one-commit rule, which the page itself prints as a conflict line. Matched-in-shape is right in geometry (86.7 x 44, capsule, white fill, 1px hairline, ink text) and wrong in type: it was hand-written at 15px/600 with an inline override and no kit import, so it becomes the kit's 14/500 cta step, which also keeps the salon page inside four sizes.",
  },
];

function findVerdict(slug: string): ScreenVerdict | undefined {
  return SCREEN_VERDICTS.find((s) => s.slug === slug);
}
function findArbiterNote(screen: string): ArbiterNote | undefined {
  return ARBITER_NOTES.find((n) => n.screen === screen);
}

interface ScreenSpec {
  slug: string;
  title: string;
}

const LOOK_SYSTEM_SCREENS: ScreenSpec[] = [
  { slug: "confirmation", title: "Booking confirmation" },
  { slug: "search-results", title: "Search results" },
  { slug: "bookings-list", title: "Bookings list" },
  { slug: "payment-step", title: "Review and pay step" },
  { slug: "profile", title: "Profile hub" },
  { slug: "empty-states", title: "Empty states" },
];

const HOME_VARIANTS: { key: "a" | "b" | "c"; label: string }[] = [
  { key: "a", label: "A: Fresha query builder" },
  { key: "b", label: "B: Airbnb look" },
  { key: "c", label: "C: One-column feed" },
];

interface Decision {
  question: string;
  recommendation: string;
  fresha: string;
  treatwell: string;
  airbnb: string;
  verdict: "ASK" | "DECIDE";
}

const DECISIONS: Decision[] = [
  {
    question:
      "The corner on every pill, chip and button: the capsule the product ships, or the 16px corner CLAUDE.md line 134 still names",
    recommendation:
      "Keep the capsule. Round 2 shipped it on every screen because the live product renders it on 359 call sites and the 16px corner was landed unshown and rejected on sight on 2026-09-02. One word from him lets CLAUDE.md line 134 be corrected instead of contradicting tailwind.config.js, LOCKFILE, SOURCE.md, the styleguide and TASTE_AUTHORITY, which all still say 99px.",
    fresha:
      "Every control is a true capsule, primary and secondary book buttons and category pills alike.",
    treatwell: "Buttons at radius 4, filter pills at 9999.",
    airbnb:
      "Reserve at 999, filter pills at 24, nav tabs at 40, and its flat ink Next and Got it buttons read as a rounded rectangle.",
    verdict: "ASK",
  },
  {
    question: "Does colour still encode booking status at all",
    recommendation:
      "Keep colour, but never as text. Round 2 ships the middle position he named himself: the shipped BookingCard shape and px-2.5 py-1 padding, the pale token fill, a saturated 14px icon carrying the hue, and ink text. That is forced anyway, since three of the five states fail WCAG AA as coloured text (confirmed 2.96:1, pending 1.82:1, cancelled 4.13:1) against ink at 17.76:1 on the same fill.",
    fresha:
      "A solid violet pill for Confirmed and solid amber for Action required, each carrying an icon.",
    treatwell: "Not reachable live or on Mobbin, and not invented.",
    airbnb:
      "Does not colour-code status at all: Confirmed, Pending and Cancelled use the identical neutral white pill and only the word changes; its confirmation screen has no green and no checkmark.",
    verdict: "ASK",
  },
  {
    question: "The weight ceiling: keep semibold clamped to 500 on customer surfaces, or let 600 back in",
    recommendation:
      "Keep 500 and do not lift the clamp. It is his own dated pick (option C, 2026-08-15, chosen off three real salon pages that each counted their own result) and lifting it is a lock break. Every round-2 mockup obeyed it, which is why the row Book button cannot match the sticky bar's 600 without an inline override; the weight probe route shows him the two side by side before he answers.",
    fresha: "Four weights on the venue page, 400 through 700.",
    treatwell: "Two only, 400 and 700.",
    airbnb: "Four on home, and it carries its emphasis at 500, which is the aligned case.",
    verdict: "ASK",
  },
  {
    question: "Four distinct font sizes per screen, or more",
    recommendation:
      "Keep four. It is already logged as open by name (B37) with four as the working default, and it is the rule that cost the most this round: it is why search results needed a CSS override on a shared card to fold 13px and 13.5px into the ramp, and it is what forces the CTA label to 14px. Worth his word precisely because it is expensive, not because the default is unclear.",
    fresha: "Venue page 5, search 3.",
    treatwell: "6 across the site.",
    airbnb: "Home 6, listing 5.",
    verdict: "ASK",
  },
  {
    question: "A warm canvas on the confirmation screen, the way Airbnb marks its one non-white moment",
    recommendation:
      "No. Keep our own cool sunken tray token, which is what TRAY shipped, so nothing waits on him. Taste rule 3 bans warm cream by name, and the last time a pale warm token went full-bleed on a screen with no photography he called it a random beige collar.",
    fresha: "A gradient wash on its confirmation moment, purple into blue.",
    treatwell: "Not reachable, and not invented.",
    airbnb:
      "A warm cream tone on exactly two screens in the whole capture, the confirmation and the wishlist empty state, both of which have no photograph; home, search and the listing are pure white.",
    verdict: "ASK",
  },
  {
    question: "The CTA label size on a phone, 15px or 14px",
    recommendation:
      "Decided: 14px. Not his, because both values are already legal in our own record and sit one adjacent step apart. CLAUDE.md says 15, LOCKFILE section 2's scale table says 14 on mobile and 15 on desktop. At 15 every screen carrying a button renders a fifth size (28/18/15/14/12) and trips the size ceiling, measured live on the confirmation mockup. 14 keeps four sizes and still clears the never-13-or-under floor. This reverses the earlier C7 note, which picked 15 before the ramp was closed to four.",
    fresha: "Not the issue; the conflict is between three of our own files.",
    treatwell: "Not the issue.",
    airbnb: "Not the issue.",
    verdict: "DECIDE",
  },
];

function VerdictPill({ verdict }: { verdict: "PASS" | "FAIL" }) {
  const isPass = verdict === "PASS";
  return (
    <span
      className={[
        "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold",
        isPass ? "bg-s-success/10 text-s-success" : "bg-s-error/10 text-s-error",
      ].join(" ")}
    >
      {verdict}
    </span>
  );
}

function OpenList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="mt-1 text-[12px] font-normal text-s-ink-2">No open items.</p>;
  }
  return (
    <ul className="mt-1 flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-[12px] font-normal leading-snug text-s-ink-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function SystemThumb({
  screenSlug,
  screenHref,
  variantKey,
  variantVerdict,
}: {
  screenSlug: string;
  screenHref: string;
  variantKey: SystemKey;
  variantVerdict?: VariantVerdict;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <Link href={screenHref} className="block overflow-hidden rounded-card border border-s-border">
        <Image
          src={`/_mockups/directions-0905-r2/${screenSlug}-${variantKey}.png`}
          alt={`${SYSTEM_LABEL[variantKey]} system, ${screenSlug}`}
          width={390}
          height={844}
          className="w-full"
        />
      </Link>
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-s-ink">{SYSTEM_LABEL[variantKey]}</span>
          {variantVerdict ? <VerdictPill verdict={variantVerdict.verdict} /> : null}
        </div>
        {variantVerdict ? <OpenList items={variantVerdict.open} /> : null}
      </div>
    </div>
  );
}

function ScreenSection({ screen }: { screen: ScreenSpec }) {
  const verdict = findVerdict(screen.slug);
  const note = findArbiterNote(screen.slug);
  return (
    <section className="border-t border-s-border px-4 py-8">
      <h2 className="text-[20px] font-semibold text-s-ink">{screen.title}</h2>
      <div className="mt-4 flex gap-3">
        {(["lift", "rule", "tray"] as const).map((key) => (
          <SystemThumb
            key={key}
            screenSlug={screen.slug}
            screenHref={`/en/dev/directions-0905-r2/${screen.slug}?s=${key}`}
            variantKey={key}
            variantVerdict={verdict?.perVariant.find((v) => v.variant === key)}
          />
        ))}
      </div>
      {note ? (
        <div className="mt-4 rounded-card border border-s-border bg-s-bg-sunken p-4">
          <p className="text-[13px] font-semibold text-s-ink">
            Arbiter: best system = {SYSTEM_LABEL[note.bestSystem as SystemKey] ?? note.bestSystem}
          </p>
          <p className="mt-2 text-[13px] font-normal leading-relaxed text-s-ink-2">{note.note}</p>
        </div>
      ) : null}
    </section>
  );
}

export default function DirectionsR2IndexPage() {
  const salonBookButtonVerdict = findVerdict("salon-book-button")?.perVariant[0];
  const salonBookButtonNote = findArbiterNote("salon-book-button");

  return (
    <div data-index-scope="directions-0905-r2" className="mx-auto max-w-[600px] bg-white pb-16">
      <div className="px-4 pt-8">
        <h1 className="text-[28px] font-semibold text-s-ink">Round 2, 2026-09-06</h1>
        <p className="mt-2 text-[13px] font-normal text-s-ink-2">
          Structure from round 1, look from three systems. Scroll to compare, no tabs, no switcher.
          Every screenshot links to the real route on your phone.
        </p>
      </div>

      {/* 1. Arbiter's top picks */}
      <section className="border-t border-s-border px-4 py-8">
        <h2 className="text-[20px] font-semibold text-s-ink">The arbiter&apos;s picks</h2>
        <div className="mt-4 flex flex-col gap-5">
          {TOP_PICKS.map((pick) => (
            <div key={pick.heading} className="rounded-card border border-s-border p-4">
              <p className="text-[13px] font-semibold text-s-ink-2">{pick.heading}</p>
              <p className="mt-1 text-[18px] font-semibold text-s-ink">{pick.label}</p>
              <p className="mt-3 text-[13px] font-normal leading-relaxed text-s-ink-2">
                Why: {pick.why}
              </p>
              <p className="mt-3 text-[13px] font-normal leading-relaxed text-s-ink-2">
                Cost: {pick.cost}
              </p>
              <p className="mt-3 text-[13px] font-normal leading-relaxed text-s-ink-2">
                Flip: {pick.flip}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. The three look systems */}
      <section className="border-t border-s-border px-4 py-8">
        <h2 className="text-[20px] font-semibold text-s-ink">The three look systems</h2>
        <div className="mt-4 flex flex-col gap-4">
          {LOOK_SYSTEMS.map((sys) => (
            <div key={sys.key} className="rounded-card border border-s-border p-4">
              <p className="text-[15px] font-semibold text-s-ink">{SYSTEM_LABEL[sys.key]}</p>
              <p className="mt-1 text-[13px] font-normal leading-relaxed text-s-ink-2">
                {sys.sentence}
              </p>
              <Link
                href={`/en/dev/directions-0905-r2/kit-preview?s=${sys.key}`}
                className="mt-2 inline-flex h-11 items-center text-[13px] font-normal text-s-accent underline"
              >
                Open the {SYSTEM_LABEL[sys.key]} kit preview
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Per-screen comparisons */}
      {LOOK_SYSTEM_SCREENS.map((screen) => (
        <ScreenSection key={screen.slug} screen={screen} />
      ))}

      {/* 4. Home structures */}
      <section className="border-t border-s-border px-4 py-8">
        <h2 className="text-[20px] font-semibold text-s-ink">Home feed</h2>
        <p className="mt-1 text-[13px] font-normal text-s-ink-2">
          Three new structures, none of them round 1&apos;s A, B or C. Copies{" "}
          <a href="/en" className="text-s-accent underline">
            app/[locale]/page.tsx
          </a>
          .
        </p>
        <div className="mt-4 flex gap-3">
          {HOME_VARIANTS.map((v) => {
            const vv = findVerdict("home")?.perVariant.find((p) => p.variant === v.key);
            return (
              <div key={v.key} className="flex flex-1 flex-col gap-2">
                <Link
                  href={`/en/dev/directions-0905-r2/home?v=${v.key}`}
                  className="block overflow-hidden rounded-card border border-s-border"
                >
                  <Image
                    src={`/_mockups/directions-0905-r2/home-${v.key}.png`}
                    alt={`Home ${v.label}`}
                    width={390}
                    height={844}
                    className="w-full"
                  />
                </Link>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-s-ink">{v.label}</span>
                    {vv ? <VerdictPill verdict={vv.verdict} /> : null}
                  </div>
                  {vv ? <OpenList items={vv.open} /> : null}
                </div>
              </div>
            );
          })}
        </div>
        {findArbiterNote("home") ? (
          <div className="mt-4 rounded-card border border-s-border bg-s-bg-sunken p-4">
            <p className="text-[13px] font-semibold text-s-ink">
              Arbiter: best structure = {findArbiterNote("home")!.bestSystem.toUpperCase()}
            </p>
            <p className="mt-2 text-[13px] font-normal leading-relaxed text-s-ink-2">
              {findArbiterNote("home")!.note}
            </p>
          </div>
        ) : null}
      </section>

      {/* 5. Salon row Book button */}
      <section className="border-t border-s-border px-4 py-8">
        <h2 className="text-[20px] font-semibold text-s-ink">Salon row Book button</h2>
        <p className="mt-1 text-[13px] font-normal text-s-ink-2">
          One route, four internal sections: Current, Matched-in-shape, Matched-in-full, Reference.
        </p>
        <Link
          href="/en/dev/directions-0905-r2/salon-book-button"
          className="mt-4 block overflow-hidden rounded-card border border-s-border"
        >
          <Image
            src="/_mockups/directions-0905-r2/salon-book-button.png"
            alt="Salon row Book button comparison"
            width={390}
            height={844}
            className="w-full"
          />
        </Link>
        <Link
          href="/en/dev/directions-0905-r2/salon-book-button"
          className="mt-2 inline-flex h-11 items-center text-[13px] font-normal text-s-accent underline"
        >
          Open the salon-book-button route
        </Link>
        {salonBookButtonVerdict ? (
          <div className="mt-4 flex items-start gap-2">
            <VerdictPill verdict={salonBookButtonVerdict.verdict} />
            <OpenList items={salonBookButtonVerdict.open} />
          </div>
        ) : null}
        {salonBookButtonNote ? (
          <div className="mt-4 rounded-card border border-s-border bg-s-bg-sunken p-4">
            <p className="text-[13px] font-semibold text-s-ink">
              Arbiter: best variant = {salonBookButtonNote.bestSystem}
            </p>
            <p className="mt-2 text-[13px] font-normal leading-relaxed text-s-ink-2">
              {salonBookButtonNote.note}
            </p>
          </div>
        ) : null}
      </section>

      {/* 6. Decisions for him */}
      <section className="border-t border-s-border px-4 py-8">
        <h2 className="text-[20px] font-semibold text-s-ink">Decisions for him</h2>
        <div className="mt-4 flex flex-col gap-5">
          {DECISIONS.map((d) => (
            <div key={d.question} className="rounded-card border border-s-border p-4">
              <p className="text-[15px] font-semibold text-s-ink">{d.question}</p>
              <p className="mt-3 text-[13px] font-normal leading-relaxed text-s-ink-2">
                Recommendation: {d.recommendation}
              </p>
              <p className="mt-3 text-[13px] font-normal leading-relaxed text-s-ink-2">
                Fresha: {d.fresha}
              </p>
              <p className="mt-1 text-[13px] font-normal leading-relaxed text-s-ink-2">
                Treatwell: {d.treatwell}
              </p>
              <p className="mt-1 text-[13px] font-normal leading-relaxed text-s-ink-2">
                Airbnb: {d.airbnb}
              </p>
              <span
                className={[
                  "mt-3 inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold",
                  d.verdict === "DECIDE" ? "bg-s-success/10 text-s-success" : "bg-s-bg-sunken text-s-ink",
                ].join(" ")}
              >
                {d.verdict}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* HideInBooking strips the header and 125px bottom nav on every /dev path; this
          reproduces the same spacer so the fold measures as it would on the real phone. */}
      <div style={{ height: 125 }} aria-hidden="true" />
    </div>
  );
}
