// GENERATED from the wide council run `wf_0f33d9f6-bfc` on 2026-08-12: 15 readers over every
// customer screen group, every shared element family and motion, then an adversarial pass that
// killed 91 of 142 findings for lacking a number on one side, for coming from memory rather than a
// capture, or for re-opening something the owner already decided. These 51 are what survived.
//
// Every row carries BOTH measurements, theirs and ours, taken live at 390x844 on the same day.
// Nothing here is applied. Owner 2026-08-12: "no apply mockups i told u".

export type Finding = {
  screen: string; element: string; airbnb: string; solen: string;
  gap: string; proposal: string; cost: string; collidesWith: string;
};

export const FINDINGS: Finding[] = [
  {
    "screen": "/de/salon/[slug]",
    "element": "Review body text colour and weight ranking",
    "airbnb": "Body 14 px / 400 in rgb(34,34,34), the page ink. Reviewer name 12 px / 500, same ink. Body is larger than the name.",
    "solen": "Body 15 px / 400 in rgb(107,107,107) (s-ink-2 grey). Reviewer name 16 px / 600 in rgb(10,10,10). Name is larger AND heavier than the body.",
    "gap": "We set the testimony in the same grey we use for timestamps and hints while shouting the reviewer's name, so the most persuasive content on the page reads as a caption.",
    "proposal": "In the PDP reviews list, set the review body to 14/400 s-ink and the reviewer name to 14/500 s-ink, inverting the current ranking.",
    "cost": "Two text classes in the reviews component. Reviewer names get visually quieter.",
    "collidesWith": "none, and it repairs one. FLOORS LAW 6 authorises s-ink-2 only for non-load-bearing text (chevrons, placeholders, timestamps, hints); a review body is load-bearing. The graveyard entries on reviews (the \"+N ohne Kommenta"
  },
  {
    "screen": "/de/salon/[slug]",
    "element": "Vertical budget the reviews section spends",
    "airbnb": "20 review cards in a horizontal rail, all at doc y 3233, cards about 236 to 269 px wide, borderless and transparent. Heading at 3229 to the bottom of the see-all button at 3497 = 565 px total, and that 565 also carries the rating summary and the keyword chips.",
    "solen": "3 review rows stacked vertically at doc y 1749, 2086 and 2273. Heading at 1603 to the bottom of the see-all pill at 2505 = 902 px total.",
    "gap": "Three reviews cost us 902 px of scroll; twenty cost them 565 px including their summary block, so a customer who wants a fourth opinion has to leave the page.",
    "proposal": "Turn the PDP reviews list into a horizontal card rail, the same pattern this page already uses for Team and Portfolio, keeping the existing Alle / 5 / 4 filter chips above it.",
    "cost": "One component's list direction changes. The salon reply block, which Airbnb has no equivalent for, has to fit inside a roughly 250 px wide card or move to the see-all page.",
    "collidesWith": "The owner picked chips-with-counts over distribution bars on 2026-07-24; a rail keeps the chips, so that call stands. The salon reply block is real Solen content with no Airbnb counterpart and is the one thing this port "
  },
  {
    "screen": "/de/salon/[slug]",
    "element": "Fixed chrome while the page is scrolled",
    "airbnb": "At scrollY 1400, one fixed layer: 390 x 80 at y 764. Total chrome 80 px, leaving 764 px (90.5%) of the 844 px viewport for content. No top bar at all once the photo scrolls away.",
    "solen": "At scrollY 1400, two fixed layers: 390 x 110 at y 0 (salon title bar plus a five-item content-tab strip: Fotos, Angebot, Team, Bewertungen, Ueber uns) and 390 x 75 at y 770. Total chrome 185 px, leaving 659 px (78.1%).",
    "gap": "Once a customer starts reading, we take 105 px more of every single screen for navigation than Airbnb does, on a page whose job is to show them the salon.",
    "proposal": "Drop the 49 px content-tab strip from the PDP and keep the 61 px title bar. Every section it links to is already reachable by scrolling and already carries its own see-all.",
    "cost": "The jump-to-section shortcut goes away; customers scroll instead. Content gains 49 px per screen.",
    "collidesWith": "The 2026-07-21 owner decision locks how a content tab LOOKS (title plus 2 px ink underline, active 600 ink, inactive 400 ink-2), not whether the PDP has one, and this page renders exactly that treatment. Separately, top-"
  },
  {
    "screen": "/de/salon/[slug]",
    "element": "Gallery position indicator, and how it scales",
    "airbnb": "One constant-size chip, 50 x 22 at x 328 y 309, background rgba(34,34,34,0.66), radius 4 px, text \"1 / 34\" at 12 px / 500 white. Size does not change with 34 photos.",
    "solen": "One dot per photo: 6 x 6 px at an 11 px pitch (measured centres x 165, 176, 187, 198), the active one stretching to 18 x 6. Nine photos render a 106 px rail. SalonHero.tsx maps every photo with no cap, so at Airbnb's 34-photo count the same code renders a 381 px rail, 97.7% of the 390 px viewport.",
    "gap": "Our indicator grows with the gallery, so a well-stocked salon gets a bar of dots spanning almost the full photo width instead of an indicator.",
    "proposal": "Cap the dot rail at 7 dots with a windowed slide, keeping the dots and the active-stretch behaviour. Do not restore the numeric chip.",
    "cost": "A few lines in the hero's dot renderer. With more than 7 photos the customer sees position, not total count.",
    "collidesWith": "The numeric chip must NOT come back: SalonHero.tsx records that the dots plus gradient band replaced \"the lone n / N counter chip\" in an owner-approved every-state PDP mockup on 2026-06-11. Capping the dots leaves that d"
  },
  {
    "screen": "/de/salon/[slug]",
    "element": "Horizontal page gutter",
    "airbnb": "24 px. 254 of the measured visible elements have their left edge at exactly x 24, and section hairlines run 342 px wide from x 24, so content occupies 87.7% of the 390 px width.",
    "solen": "16 px. 53 elements sit at x 16 (a second cluster of 43 sits at x 37, inside the section cards), and the sticky bar's CTA runs 358 px from x 16, so content occupies 91.8%.",
    "gap": "Our text runs 8 px closer to each bezel than theirs, which is why our lines read tighter at the same font size.",
    "proposal": "Take the PDP page gutter from 16 to 24 px.",
    "cost": "One container class. Every section narrows by 16 px, so long service names and review lines wrap about 5% sooner.",
    "collidesWith": "FLOORS LAW 8 (the same thing looks the same everywhere). The 16 px gutter is used across the whole customer product, so this is a product-wide change or none, never a PDP-only one. The LOCKFILE spacing row locks card pad"
  },
  {
    "screen": "/de/salon/[slug]/booking, the Datum & Zeit step and the Ihre",
    "element": "Running total in the sticky bottom bar",
    "airbnb": "The total is on screen at every stage. Listing bar: \"Fr. 209\" 16px/700 underlined + \"Gesamtpreis\" 16px/400 + \"14.-16. Aug.\" 12px/400, inside a 390x113.5 fixed bar. Price sheet: \"Gesamtbetrag Fr. 208.55\" 16px/600. Checkout review: row \"Gesamtpreis / Fr. 229.30 inklusive Steuern\" 14px/600 at y=422, in",
    "solen": "Present on 2 of the 5 steps. Services and Stylist steps: a 390x69 fixed bar, \"CHF 45\" number 20px/700 ink with \"1 Artikel / 30 Min\" 12px/400 grey and a 113x44 Weiter pill. Datum & Zeit and Ihre Haare: a bare full-width Weiter, 358x48, bg rgb(10,10,10), and no price, item count or duration text anywh",
    "gap": "On the two steps where the user is weighing time slots and adding preferences, the amount they are about to commit to is not on the screen at all.",
    "proposal": "Render the existing summary bar (price, item count, minutes) on the Datum & Zeit and Ihre Haare steps in place of the bare Weiter button, so the total is continuous from step 1 to the commit.",
    "cost": "Re-use a bar that already exists on the first two steps for two more screens. No new component and no new data.",
    "collidesWith": "none. REMOVED.md line 15 kills any progress UI in the booking flow, not a price summary; the LOCKFILE sticky-CTA row requires exactly the sticky commit path this keeps."
  },
  {
    "screen": "/de/salon/[slug]/booking, the Bestätigen & Zahlen step",
    "element": "The Ändern controls on the summary card",
    "airbnb": "Tapping Ändern opens a 390x832 bottom sheet (\"Zeitraum ändern\", radius 32px top) over the review page. The URL stays /book/stays/40508822 and the review stays mounted underneath, so closing the sheet costs 0 extra steps.",
    "solen": "Tapping Ändern unmounts the confirm step and walks the wizard back. Date Ändern lands on \"Datum & Zeit\" and needs 2 further Weiter taps (through Ihre Haare) to return. Service Ändern lands on \"Services auswählen\" and needs 4 further Weiter taps. Zero dialogs open in either case.",
    "gap": "Correcting a detail on the review screen throws the user back into the flow and makes them walk forward again, so a small edit costs up to four extra taps.",
    "proposal": "Open the owning step in a sheet over the confirm screen and return to the confirm screen on close, instead of calling goToStep.",
    "cost": "Medium. The step components already exist; this wraps them in the existing sheet primitive and adds a return path. Roughly a day, not an afternoon.",
    "collidesWith": "none found. REMOVED.md line 86 killed SalonServicesSheet because it was a second implementation of the service step; this re-uses the step itself, so it is not that pattern. Worth naming to the owner anyway."
  },
  {
    "screen": "/de/salon/[slug]/booking, the Bestätigen & Zahlen step",
    "element": "Tap target of the Ändern control",
    "airbnb": "A filled pill, 75x32, background rgb(242,242,242), radius 8px, label 12px/500 ink.",
    "solen": "Bare blue text, 46x20, 13px/600, colour rgb(39,110,241).",
    "gap": "The control is 20px tall, so on a phone it is a text sliver rather than a button, and it is the only way to correct a wrong service or time on the pay screen.",
    "proposal": "Keep the text treatment but pad the hit area to 44px tall (h-11), or adopt a small neutral pill like the reference.",
    "cost": "One class per control, three call sites.",
    "collidesWith": "none, it repairs two floors we already own: the LOCKFILE touch-target row (interactive controls >= 44px) and WCAG 2.2 SC 2.5.8, which sets a 24x24 CSS px minimum. The inline-in-a-sentence exemption does not apply here si"
  },
  {
    "screen": "/de/salon/[slug]/booking, the Bestätigen & Zahlen step",
    "element": "The largest element on the screen",
    "airbnb": "Largest visible text 26px (the h1 \"Überprüfen und fortfahren\", weight 600) against a 14px body, a ratio of 1.86.",
    "solen": "Largest visible text 22px (the \"CHF 45\" total, weight 700) against a 14px body, a ratio of 1.57. The step title is 16.5px/600 inside the top bar.",
    "gap": "Nothing on the pay screen is decisively the biggest thing, so the eye has no entry point and the screen reads flat.",
    "proposal": "Raise the Total figure to 28px. It is already the right candidate for the anchor and it is the number the screen exists to confirm.",
    "cost": "One font-size value in the price card.",
    "collidesWith": "the title route is closed: mockup 26, owner-approved 2026-06-12, deliberately shrank the step title to 16.5px because a 30px page title \"read unbalanced\". So raise the price, never the title. Raising the price also clear"
  },
  {
    "screen": "/de/profile",
    "element": "the 'Gespeichert' destination",
    "airbnb": "Exactly one saved destination, one label. Their bottom nav carries a single heart item, 'Wunschlisten', href /wishlists, and the profile root's own two row groups (Account settings, Get help, View profile, Privacy, then Refer a host, Find a co-host, Legal, Log out) contain no saved or wishlist row a",
    "solen": "Two, both visible in the same viewport and both labelled 'Gespeichert'. The account row at y648.5 (heart icon, subline '2 Stores') goes to /de/profile/favorites, which lists saved salons. The bottom-nav heart at y811 goes to /de/inspo/saved, which lists saved Inspo looks from /api/discovery/saves.",
    "gap": "Two identical words on one screen lead to two different lists, so a customer tapping the heart to find the salon they saved gets a grid of photos instead.",
    "proposal": "Give the two destinations distinct labels, for example keep 'Gespeichert' for looks on the nav and rename the account row to 'Gespeicherte Stores', which the row's own subline already says.",
    "cost": "One copy key in four locales; no layout change.",
    "collidesWith": "None. The heart-equals-saved-looks meaning is settled (owner 2026-06-23, 'the heart icon just saves, simple plain'), and this changes only the account row's wording, not that decision."
  },
  {
    "screen": "/de/profile/bookings",
    "element": "the Anstehend / Vergangen / Storniert tab strip",
    "airbnb": "On their two-tab strip the active label is #222222 and the inactive is a mid grey #818181, and the active underline is 116px wide against a 108px label, i.e. it hugs the label rather than the tap target. The track under both tabs is 1.0pt #DDDDDD, a different grey from the #EBEBEB used for row divid",
    "solen": "Inactive tabs render at 14px/600 in #6B6B6B, the same weight as the active tab (14px/600 in #0A0A0A), so only colour separates them. The active underline is 2px ink spanning the full 105.7px padded button box, not the label. Track is 1px #E4E4E7 at x16 w358.",
    "gap": "Every tab shouts equally, so the selected one is carried by colour alone, and the underline reads as a block under the button rather than a mark under the word.",
    "proposal": "Set the inactive tabs to 400 weight, which is what the locked content-tabs rule already says, and shrink the underline to the label's own width.",
    "cost": "Two class changes on the tab component; the underline gets visibly shorter.",
    "collidesWith": "None, it restores a lock: the design contract's CONTENT TABS row (owner 2026-07-21) is 'active = 600 ink + underline, inactive = 400 ink-2'. Their #818181 inactive grey is not proposed; ours stays s-ink-2 #6B6B6B, which "
  },
  {
    "screen": "/de/inspo/saved and /de/inspo/[id]",
    "element": "the fixed bottom navigation bar",
    "airbnb": "a fixed bottom bar on 4 of 4 screens measured: a 125px nav at top 779 on home, search and wishlists, and an 80px price plus Reservieren bar at top 764 on the room page",
    "solen": "a fixed nav at top 774, h58, w366 on /de/inspo only; /de/inspo/saved and /de/inspo/[id] return zero fixed or sticky elements apart from the cookie banner, so 1 of 3",
    "gap": "Tapping \"Gespeichert\" in the nav lands the user on a screen where the nav has vanished, and the only way out is a hand-drawn circle arrow in the corner.",
    "proposal": "Render the same bottom nav on /inspo/saved and /inspo/[id]; on the detail screen it can carry the cheapest real salon price and \"Diesen Look buchen\" the way Airbnb's room bar carries price plus Reservieren.",
    "cost": "The bar you tap to move around the site stops disappearing on two screens out of three.",
    "collidesWith": "none; REMOVED.md line 124 (owner, 2026-08-10) approved the customer mobile-web bottom nav and cites Airbnb as the support, so these two screens are the unfinished part of that rollout rather than a new proposal"
  },
  {
    "screen": "/de/inspo/saved",
    "element": "the loading skeleton's width",
    "airbnb": "innerWidth and documentElement.scrollWidth both 390 on all four screens measured (home, search, wishlists, room), so no zoom-out at any point",
    "solen": "innerWidth 400 and scrollWidth 400 in a 390 viewport 350ms after navigation, with skeleton cards measured at left = -4",
    "gap": "For the first moment of every visit the whole page shrinks about 2.6% and the skeleton cards are clipped on both edges, then it snaps back.",
    "proposal": "Give DiscoveryGridSkeleton a variant without the negative margin for this screen, or wrap it in the px-4 container that /de/inspo already provides.",
    "cost": "The saved screen stops shrinking and jumping for a moment when it opens.",
    "collidesWith": "none"
  },
  {
    "screen": "/en/inspo/saved (and /fr, /it)",
    "element": "the screen's three strings",
    "airbnb": "airbnb.com/wishlists in en-GB returns \"Wishlists\" 32/600, \"Log in to view your wishlists\" 22/500, \"Log in\" 16/500; airbnb.ch in de-CH returns \"Wunschlisten\", \"Logge dich ein, um deine Wunschliste zu sehen\", \"Einloggen\"",
    "solen": "/en/inspo/saved renders byte-identical German to /de: \"Gespeichert\" 22/700 at y=20 and \"Tippe bei einem Look auf das Herz, um ihn hier zu speichern.\" 14/400 at y=84",
    "gap": "An English, French or Italian customer who taps their saved list gets a German screen.",
    "proposal": "Move the three hard-coded strings in app/[locale]/inspo/saved/page.tsx (lines 73, 88, 95) into messages/*.json alongside the rest.",
    "cost": "The saved screen speaks the language the rest of the site is already speaking.",
    "collidesWith": "none"
  },
  {
    "screen": "/de/auth/login",
    "element": "The name of each field once the user has typed into it",
    "airbnb": "A persistent floating label: at rest a 20px-tall line reading \"Telefonnummer oder E-Mail-Adresse\" at 16px rgb(108,108,108) sitting at y186 inside the box; once a value is typed it rises to y178 and scales to 15px tall (0.75x), so the field is still named while it holds text",
    "solen": "Placeholder only, on both fields. Zero label elements render on the page. The placeholder strings are \"E-Mail-Adresse\" and \"Passwort\", and both vanish the moment a character is typed",
    "gap": "After typing, our two boxes carry no name at all, so anyone who looks away and back, or who is filling this in a second language, has to clear the field to find out which one it was.",
    "proposal": "Apply the shape he already picked. TASTE_LOG 2026-08-09 decision 7 (verbatim \"7C\") says the small grey label is gone and a larger ink question goes above the box, the Uber shape. That is already implemented on /de/auth/register for Geburtsdatum and Salon-Name ",
    "cost": "Two lines of markup in one component, plus two new copy strings in the four locales. Adds roughly 50px of height to the screen.",
    "collidesWith": "None. It does the opposite of re-opening: decision 7 of 2026-08-09 mandates exactly this treatment and login is the screen it was never applied to."
  },
  {
    "screen": "/de/auth/register",
    "element": "The field itself while it is showing a validation error",
    "airbnb": "The box turns rgb(255,245,243) with a 1px inset rgb(215,37,28) edge (5.03:1 on white), and a 12px rgb(193,53,21) line with a red alert glyph renders 8px below it, role=alert",
    "solen": "The box does not change: still 1px solid rgb(228,228,231) on white, only aria-invalid=\"true\" is set, which is invisible. The message renders 22px below the field at 13px rgb(220,38,38) with an alert icon",
    "gap": "Our error text says which rule was broken but nothing on the screen points at the box that broke it, so on a three-field form the user has to read and match rather than just look.",
    "proposal": "Add the existing .input-error class to the field whenever its error state is set. It already lives in app/globals.css and sets border-color to the error token; it currently has exactly one call site in the whole codebase.",
    "cost": "One conditional class on each of the three register fields. No new CSS, no new copy.",
    "collidesWith": "None. LOCKFILE 14.4 already requires \"red border + red line w/ alert icon\" for a field error. The line and the icon ship; the border is the half that was never wired. This closes our own rule rather than opening a new on"
  },
  {
    "screen": "/de/auth/login, /de/auth/register, /de/onboarding",
    "element": "The height of the fields and of the primary button, across one flow",
    "airbnb": "One height each on the one screen: the field box is 60px (the input inside it 55px) and the Weiter button is 48px",
    "solen": "Three field heights and two button heights across three screens: fields 56px on login, 50px on the register email and password, 52px on the register date; buttons 56px on login, 48px on register, 48px on onboarding",
    "gap": "The same control changes size three times while the user walks a single sign-up, which is the kind of wobble people read as an unfinished product without being able to name why.",
    "proposal": "Pick one field height and one button height for the whole auth flow and set them in the shared base rule rather than per page. The 48px button already holds on two of the three screens, so login is the outlier to move.",
    "cost": "A few utility classes across three files. Purely mechanical, no design decision beyond choosing the number.",
    "collidesWith": "None. FLOORS LAW 8 (2026-07-29, the same thing looks the same everywhere) requires this rather than forbidding it. The touch-target floor of 44px is cleared by every value involved."
  },
  {
    "screen": "/de/auth/login",
    "element": "The two social sign-in buttons and the vertical space they take",
    "airbnb": "Two 60x60 icon-only squares, radius 12, 1px rgb(221,221,221), 12px apart, centred, Google first then Apple, each carrying an aria-label. The whole block is 60px tall",
    "solen": "Two full-width 342x56 labelled pills, radius 99px, 1px rgb(228,228,231), 12px apart, Apple first then Google, with the mark absolutely positioned at the left edge. The whole block is 124px tall",
    "gap": "Two thirds of our sign-in screen below the divider is spent on buttons most people will not press, and they are the two largest neutral rectangles on the page, so they compete with the black Anmelden button for the eye.",
    "proposal": "Put the two social buttons side by side in one row, roughly 165px wide each, keeping our locked pill radius and the 56px height, with the mark plus a short label. That halves the block from 124px to 56px without adopting their square shape.",
    "cost": "One flex row and a width change in one component. Two copy strings shorten from \"Mit Apple anmelden\" to \"Apple\". Check the French and Italian strings still fit at 165px before shipping.",
    "collidesWith": "The LOCKFILE design-contract radius row freezes button and chip radius to pill, which is why the proposal keeps 99px and does not copy their 12px squares. The copy-economy ladder (project CLAUDE.md, rule 3) permits icon-"
  },
  {
    "screen": "/de/auth/login",
    "element": "The terms sentence the user is told they are accepting",
    "airbnb": "Their equivalent privacy sentence carries a real link, \"Datenschutzerklaerung\", 12px weight 500 rendered underlined, and it sits under the field at y234, above the Weiter button at y298",
    "solen": "\"Mit der Anmeldung akzeptieren Sie unsere Nutzungsbedingungen.\" renders as a plain paragraph at 12px rgb(107,107,107) at y654.3, with no anchor anywhere in it, and it sits 286px below the Anmelden button and below both social buttons",
    "gap": "We tell someone they are accepting our terms and then give them no way to read them from the screen where they accept.",
    "proposal": "Make \"Nutzungsbedingungen\" a link to the existing terms route, in all four locales. Leave the sentence exactly where it is.",
    "cost": "Split one translation string into two parts with a link between them, in de, en, fr and it. An hour, and it removes a claim we currently cannot back.",
    "collidesWith": "REMOVED.md line 27 (owner 2026-06-12, \"we don't need that at all, it's a web\") killed the blocking ToS acceptance modal and recorded that acceptance stays implicit via this footer text. That decision governs the PLACEMEN"
  },
  {
    "screen": "/de/queue/[token]",
    "element": "First-viewport type budget on the live waiting tracker",
    "airbnb": "5 distinct font sizes (26, 16, 14, 12, 11), 3 weights (400/500/700), 2 of 24 text nodes at weight >=600 = 8.3%",
    "solen": "12 distinct font sizes (30, 19, 17, 16, 15.5, 14, 13.5, 13, 12.5, 12, 11, 10.5), 3 weights (400/600/700), 14 of 19 text nodes at weight >=600 = 73.7%",
    "gap": "Almost every line on the screen is bold and almost every line is its own size, so nothing reads as more important than anything else and the customer has to hunt for the one number they came for.",
    "proposal": "Collapse to 4 sizes and 2 weights: keep 30/700 for the wait figure, 17/600 for section titles, 14/400 for body, 12/400 for the stepper labels and the ticket reference. Drop weight 700 everywhere except the wait figure. The three near-duplicates (15.5/16/17, 12",
    "cost": "One page restyled, half a day. Nothing moves position, only text sizes and weights change.",
    "collidesWith": "None. It enforces LOCKFILE.md line 376 (HARD: <=4 distinct sizes and <=2 weights per screen) and the EMPHASIS BUDGET 30% weight-share ceiling. The queue tracker is a customer screen and carries no carve-out."
  },
  {
    "screen": "/de/queue/[token]",
    "element": "Action bar: the Wegbeschreibung button and the cancel button",
    "airbnb": "One commit control in the bar, 342x48, radius 999px, 16px/500 white on a single brand gradient (rgb(230,30,77) to rgb(215,4,102)); no second coloured control beside it",
    "solen": "Primary is 286x54, background rgb(39,110,241) accent blue, label 14px/600 white; directly beside it a 54x54 circle filled rgb(220,38,38) error red",
    "gap": "Two saturated colours compete for the eye in one row, and the loudest thing in it is a maps link rather than anything about the queue.",
    "proposal": "Make Wegbeschreibung ink-filled per the lock, and demote cancel to a neutral outline control with a text label rather than a red disc, so the bar carries one coloured moment at most.",
    "cost": "Two class strings in one file, well under an hour.",
    "collidesWith": "None, it enforces a frozen literal. LOCKFILE.md line 213 names this exact control: a bare Wegbeschreibung label is blue as TEXT, and 'if given button geometry -> ink'. Taste rule 3 also puts blue on small clickable bits "
  },
  {
    "screen": "/de/profile/bookings",
    "element": "The booking card's photograph",
    "airbnb": "Photo 326 x 216 pt, inset about 8 pt inside a 343 pt-wide card, filling roughly 55% of the card's ~390 pt height. The same reservation on their detail screen carries the same photo at 323 x 216 pt.",
    "solen": "Zero <img> elements on the whole page. Photographic area of the 390x844 first viewport = 0.0%. Meanwhile GET /api/bookings/user returns salon.cover_photo_url populated for all four bookings.",
    "gap": "The customer picked this salon off a photo on /de, and here it comes back as a wall of grey text they have to read to recognise.",
    "proposal": "Render salon.cover_photo_url at the top of BookingCard, inset inside the card the way Airbnb insets theirs, not edge to edge. The data is already on the wire.",
    "cost": "One image per card. The list gets taller, so about two bookings fit per screen instead of four.",
    "collidesWith": "none. Named check: the 2026-07-16 full-bleed rejection in REMOVED.md is not re-opened, because Airbnb's own photo is inset inside the card, not edge to edge. FLOORS LAW 2's decoration ban is not touched either: the src i"
  },
  {
    "screen": "/de/profile/bookings",
    "element": "The empty state",
    "airbnb": "Ghost-preview illustration 203 to 412 pt, headline at 459 to 480 pt, two-line subline ending 526 pt, then a filled pill CTA 125 x 50 pt at 549 to 599 pt. Message-to-CTA gap 23.5 pt. Space between the CTA and the tab bar icons = 164 pt, 19.4% of 844.",
    "solen": "Grey Lucide Calendar 32 x 32 at rgb(107,107,107), headline 18px weight 400, message 14px ending at y=392, and no CTA at all. Space between the message and the bottom-nav icons = 391 px, 46.3% of 844.",
    "gap": "A customer with no bookings is shown a grey calendar and a dead half-screen, with nothing to press.",
    "proposal": "Pass the CTA that EmptyState already accepts (it has an unused `action` prop) pointing at search, raise the headline to weight 600, and swap the grey Lucide calendar for a ghost-preview of a booking card, which is what Airbnb draws there.",
    "cost": "Small. The prop exists and is simply not being passed; the icon swap is one line.",
    "collidesWith": "none, it closes three of our own rules: NEVER-AGAIN floor 3 (dead space under 30%, message-to-CTA at most 24px), the `states` lock row (promise headline 18/600 plus gesture subline plus a filled ink CTA plus a 3D icon or"
  },
  {
    "screen": "/de/partner (and /de/fuer-salons, which 308-redirects to it)",
    "element": "Hero headline block, the two-line H1",
    "airbnb": "40px / weight 700, line-height 44px, ratio 1.10, wrapping to 4 lines in a 176px block (airbnb.ch/host/homes)",
    "solen": "27.3px / weight 600, line-height 27.3px, ratio 1.00, wrapping to 2 lines in a 55px block",
    "gap": "Our two headline lines have zero leading, so the descenders of \"Ihr Salon. Mehr Kunden.\" run into the caps of \"Weniger Aufwand.\" and the most important sentence on our only sales page is the hardest thing on it to read.",
    "proposal": "Set the hero line-height to 1.10 (30px at 27.3px, or 1.1 alongside the size fix in the next finding). Nothing else in the block moves.",
    "cost": "One line-height value on one headline. The hero grows about 6px taller.",
    "collidesWith": "none"
  },
  {
    "screen": "/de/partner and /de/warum-solen",
    "element": "The page's largest text (display anchor)",
    "airbnb": "40px on the host landing with 22.7% of the first viewport photographic; 32px on the help centre with 0% photographic",
    "solen": "27.3px on /de/partner with 17.3% of the first viewport photographic; 27.3px on /de/warum-solen with 0% photographic",
    "gap": "Both pages sit 0.7px under our own 28px display-anchor floor, and neither can claim the floor's photo exemption because on both the largest element is text, not a photograph. Two of our five static pages have no element that clearly leads.",
    "proposal": "Raise both heroes to 30px minimum. The value comes from a clamp() that currently resolves to 27.3px at 390 wide, so the fix is raising the clamp floor, not hand-setting a size.",
    "cost": "One clamp minimum per page. Headlines get about 3px taller and may take one more wrapped line in French and Italian.",
    "collidesWith": "none, it fixes a FLOORS LAW 6 violation rather than creating one"
  },
  {
    "screen": "/de/partner",
    "element": "Long dashes inside shipped German body copy",
    "airbnb": "1 text node containing a long dash across 69 body nodes on /host/homes, 0 across 35 body nodes on /help",
    "solen": "9 text nodes containing a long dash, including \"Registrieren Sie Ihren Salon kostenlos auf solen.ch - Basels Beauty-Plattform\", \"Leere Slots füllen mit Rabatten - mehr Umsatz, weniger Leerlauf\", \"Ihr Salon ist live - Kunden können ab sofort buchen\", and \"15-25%\"",
    "gap": "Nine long dashes on the page a salon owner reads before deciding to sign up. It is the single most reliable tell that a sentence was machine-written, and it breaks a rule this project already treats as absolute.",
    "proposal": "Rewrite all nine strings using a period, comma, colon, parentheses or a spaced hyphen, in all four locales. \"15-25%\" becomes \"15 bis 25%\".",
    "cost": "A copy edit on nine strings times four locales. Zero layout risk.",
    "collidesWith": "none. CLAUDE.md taste rule 10 already bans them; this is the rule being broken on a live page, not a new proposal."
  },
  {
    "screen": "/de/help",
    "element": "The category filter row (Alle / Für Kunden / Für Stores / Kontakt)",
    "airbnb": "A single horizontally scrolling row of text-only tabs: transparent background, 14px / 500, active in ink rgb(34,34,34) with a rule under it, inactive rgb(108,108,108), 40px tall tap row (airbnb.ch/help)",
    "solen": "Four filled pills that wrap onto two rows: active is a solid black fill rgb(10,10,10) with white text, inactive is rgb(244,244,245) with rgb(107,107,107) text, 12px / 500, 28px tall",
    "gap": "The black selected pill is the loudest element on a help page, our pills are 28px tall against our own 44px touch floor, and they wrap to two rows where Airbnb keeps one. The awkward part is that Airbnb's treatment is exactly what our own lock already specifie",
    "proposal": "Replace the pills with the locked content-tab treatment: title text, active 600 ink with a 2px ink underline, inactive 400 ink-2, no fill, one scrolling row, 44px tall.",
    "cost": "One control swapped for a component we already own. The row gets 16px taller and stops wrapping.",
    "collidesWith": "It resolves two collisions rather than creating one. The ink fill breaks the locked selected-state row (calm gray bg-s-bg-sunken, never ink, gate no-black-selected, LOCKFILE §13.1 item 3) and the help pills are not one o"
  },
  {
    "screen": "/de and /de/search",
    "element": "Salon card, name and rating weight",
    "airbnb": "name 500 and rating 400 on both surfaces (15/500 + 15/400 on search, 13/500 + 12/400 on home)",
    "solen": "name 14px/600 with rating 12px/400 on home, name 16px/500 with rating 14px/600 on search",
    "gap": "On home the salon's name is the heaviest thing on the card; on search the rating outweighs the name, so the eye lands on a different word depending on which screen you are on.",
    "proposal": "Fix one weight ladder for the salon card, name 600 and rating 400, and let only the pixel size change between the rail and the list.",
    "cost": "Two style values across two files. Nothing reflows. Half a day including re-measuring both screens.",
    "collidesWith": "none found. Grepped TASTE_LOG.md and REMOVED.md for a dated call on card name or rating weight; the only card-weight entry is the 2026-08-06 owner pick that raised the home card name to 600, which this proposal keeps."
  },
  {
    "screen": "/de",
    "element": "Look card, photo aspect ratio",
    "airbnb": "one photo shape across every home rail, 165x157, ratio 1.05, radius 20px, 48 of 48 cards",
    "solen": "the same eight looks render at 82x82 (ratio 1.00) in one rail and 171.59x305.05 (ratio 0.56) in another, both on /de",
    "gap": "The same haircut is a small square thumbnail in one rail and a tall portrait 300 pixels further down the same page, so the two rails read as two different products.",
    "proposal": "Pick one look aspect (the 9:16 portrait is the shape the source photos are actually shot in) and make the compact rail a documented size variant of that same component instead of a second one.",
    "cost": "One rail restyled and two components merged into one. About a day, plus fresh screenshots of the home page.",
    "collidesWith": "none found. Grepped REMOVED.md and TASTE_LOG.md for a look-card or look-aspect decision and there is none. REMOVED.md:116 is the nearest neighbour and it points the same way: the profile CollageTile was killed 2026-08-02"
  },
  {
    "screen": "/de/search",
    "element": "Salon card, count of distinct type sizes on one card",
    "airbnb": "two sizes on the measured card: 15px carries the title, the subtitle, the host line, the dates, the price and the rating, separated only by weight (500 against 400) and colour (rgb(34,34,34) against rgb(108,108,108)); an 11px badge is the only second size",
    "solen": "five sizes on one card: 16px name, 14px rating, 13.5px service name and price, 13px on two meta lines, 12px duration",
    "gap": "Five sizes packed inside a 4px range read as wobble rather than rank, and the design contract caps a whole screen at four, so one card is already over the budget for the screen it sits on.",
    "proposal": "Collapse the card to two of the already-locked values, 14 for the name and 12 for everything else, and let weight and colour carry the rank the way theirs does.",
    "cost": "A pass over one component, about half a day, then re-measure the results screen against the type budget before shipping.",
    "collidesWith": "none. This moves toward the LOCKFILE 4-size ceiling rather than away from it. Take the replacement values from the locked text-size row (name 14, meta 12) rather than importing their 15 and 13, which would trade one lock"
  },
  {
    "screen": "/de/search",
    "element": "the floating \"Karte\" map button versus the bottom navigation",
    "airbnb": "0 px of their fixed bottom nav's band is claimed by any other fixed control. Their nav is a full-bleed 390 x 125 bar at y=779 with 60px of bottom padding, and a sweep of every fixed/absolute control in the bottom 40% of their search screen returned exactly one element, a listing card at z-index 0, n",
    "solen": "the Karte button is fixed at (148, 782), 95 x 42, z-index 30. The bottom nav is at (12, 774), 366 x 58, z-index 700. document.elementFromPoint at the Karte centre (195, 803) and at both of its inner corners (156, 790) and (234, 816) all return the nav's \"Gespeichert\" link, 3 of 3 points.",
    "gap": "On a phone the map view of search cannot be opened at all, because every pixel of its button is owned by the navigation bar painted on top of it.",
    "proposal": "Lift the Karte chip clear of the nav (bottom offset at least the nav's 58px height plus its 12px margin) and raise its z-index above 700, or move the map entry into the pinned search chrome where Airbnb keeps its equivalent controls.",
    "cost": "A one-line position change on the map button. Nothing else on the page moves.",
    "collidesWith": "none. REMOVED.md 2026-07-02 killed a fabricated bottom nav drawn on a map mockup, which is a different thing; the nav itself was approved 2026-08-10."
  },
  {
    "screen": "/de/salon/[slug], /de/salon/[slug]/reviews, /de/auth/login, ",
    "element": "the back control",
    "airbnb": "40 x 40 on both surfaces measured, and one recipe: on the listing the circle is a ::before at rgba(240,240,240,0.5) with backdrop-filter blur(36px) saturate(1.6), no border and no box-shadow; the search bar's back is the same 40 x 40 box.",
    "solen": "four different controls. PDP hero overlay 40 x 40, rgba(255,255,255,0.80) + blur(4px) + 1px solid rgba(255,255,255,0.6) + shadow 0 1px 3px rgba(0,0,0,0.10), glyph 18. PDP sticky tab nav 36 x 36, transparent fill, no edge. /reviews and /auth/login 44 x 44 white circle, no border, shadow rgba(50,47,44",
    "gap": "The same control changes size and edge four times inside one session, so nothing teaches the eye where \"back\" lives.",
    "proposal": "One shared back control at the locked 44px circle with the locked glyph, plus a single documented over-photo variant that swaps only the fill. Four call sites adopt it.",
    "cost": "One small shared component and four import swaps. No layout moves.",
    "collidesWith": "none, and it repairs one. LOCKFILE 'NAV CONTROLS' (LOCKED 2026-08-10, owner) freezes back as a 44 circle, white fill, shadow only, ChevronLeft and never ArrowLeft. None of our four back controls satisfies that row today."
  },
  {
    "screen": "/de/salon/[slug]",
    "element": "the top bar at deep scroll (SalonStickyTabNav)",
    "airbnb": "zero fixed or sticky elements anywhere in the top 200px of the listing at scroll 0, 700 and 2200. Their only fixed chrome on that page is the bottom bar, 390 x 127 at y=717, carrying the price, the rating and the Reserve CTA.",
    "solen": "a fixed nav 390 x 110 at y=0, opaque white, z-index 60, present at scroll 900 and carrying back 36 x 36, share 36 x 36, save 44 x 44 and five section tabs 49px tall.",
    "gap": "13% of the phone screen is permanently spent on chrome on the one screen where the photos, the services and the price have to do the work.",
    "proposal": "Reopen the sticky tab nav. Either drop it to a back-only bar or let it go entirely and let the bottom Buchen bar be the only fixed chrome, which is the shape Airbnb ships.",
    "cost": "The PDP loses jump-to-section navigation, which is the real trade and the reason to show him a mockup rather than just cut it.",
    "collidesWith": "LOCKFILE line 1273 lists 'Sticky tab nav after hero' as a Fresha STRUCTURE lock, and line 1239 makes Fresha the structure source of truth. The owner's 2026-08-12 decision replaced Fresha with Airbnb, so this is a collisi"
  },
  {
    "screen": "/de/salon/[slug]",
    "element": "the control cluster floating over the hero photo",
    "airbnb": "exactly three controls, all 40 x 40: Zurück at (13, 82.5), Teilen at (285, 82.5), Zur Wunschliste at (337, 82.5). No report control appears anywhere in the top 180px of the page.",
    "solen": "four controls at two sizes: Zurück 40 x 40 at (16, 16), Store teilen 44 x 44 at (218, 16), Speichern 44 x 44 at (274, 16), Melden 44 x 44 at (330, 16).",
    "gap": "A report button carries the same weight as save and share before the visitor has read a single thing about the salon, and the four controls are not even the same size as each other.",
    "proposal": "Move Melden to the bottom of the page, where a complaint actually gets made, and bring the remaining three to one size.",
    "cost": "One control changes position; nothing new is built.",
    "collidesWith": "none found. FLOORS LAW 10 (every element must belong to the screen's job) supports the move."
  },
  {
    "screen": "/de/auth/login (same field on /de/auth/register, /de/booking",
    "element": "Resting border of a text-entry field",
    "airbnb": "1px ring rgb(140,140,140), painted as an inset box-shadow on the field wrapper. Computed contrast 3.36:1 against white.",
    "solen": "1px solid rgb(228,228,231) (#E4E4E7). Computed contrast 1.27:1 against white.",
    "gap": "An empty field is hard to see as a box at all, so on a form the person cannot tell where they are meant to type without hunting for the placeholder text.",
    "proposal": "Darken the resting line on TEXT-ENTRY fields only, to Airbnb's own measured value rgb(140,140,140). Leave the no-line-on-tap rule from 2026-08-09 exactly as it is, and leave the light #E4E4E7 hairline on cards, chrome pills and dividers untouched.",
    "cost": "One line in the base input rule, then look at the six form pages to confirm nothing else moved. Half a day.",
    "collidesWith": "TASTE_LOG 2026-08-09 names #E4E4E7 as the resting input line by literal value. That same entry records the owner's ask as 'make like airbnb', and the Airbnb line it measured that day was rgb(140,140,140), so this is an u"
  },
  {
    "screen": "/de/auth/register (and every other form using the shared fie",
    "element": "How the field itself looks when its value is wrong",
    "airbnb": "The errored field is repainted: wrapper background rgb(255,245,243), inset ring 1px rgb(215,37,28).",
    "solen": "The message appears (13px rgb(220,38,38), 'Das Passwort braucht mindestens 8 Zeichen.', aria-invalid set to true) but the input keeps border 1px rgb(228,228,231) and box-shadow none. The CSS rule that would colour it, .input-error at app/globals.css line 398, has zero call sites anywhere in app/, co",
    "gap": "On a form with several boxes the sentence tells you what is wrong but nothing points at which box holds the bad value, so you re-read the whole form to find it.",
    "proposal": "Apply the existing error styling on the six files that already compute an error and already set aria-invalid, so the box and the message agree. Add the pale fill so the field reads as wrong at a glance, not only its outline.",
    "cost": "Six files, no new component, no new colour. Half a day.",
    "collidesWith": "none"
  },
  {
    "screen": "/de/search, the Filter sheet, Preis section",
    "element": "Setting a price range",
    "airbnb": "Two typed numeric fields, #price_filter_min and #price_filter_max, each in an 84 x 48 pill of radius 50px with an inset 1px rgb(221,221,221) ring and 14px text, sitting under a two-thumb range slider drawn over a histogram of the actual prices in the results.",
    "solen": "Zero input elements anywhere in the sheet. Preis is a single role=\"slider\" of 350 x 24 labelled 'Maximalpreis', with two static end captions CHF 20 and CHF 300+.",
    "gap": "You can say how much is too much but not how little; and you cannot type a number, so on a phone the only way to reach a value is to drag a thumb across a 350px track.",
    "proposal": "Add the second thumb and a pair of numeric pills below the track, reusing our own field chrome. The minimum is already plumbed end to end and only the control is missing.",
    "cost": "Front-end only. FilterSheet already declares a minPrice prop, and app/api/salons/route.ts already reads min_price and applies a .gte on it, so no backend work. Two days.",
    "collidesWith": "none"
  },
  {
    "screen": "/de/search, the Filter sheet, Sortieren segmented control",
    "element": "Segment label size and how many options are squeezed into one row",
    "airbnb": "Three segments across the same width, each 110.7 x 44, label 14px weight 500, radius 12 on the two end caps.",
    "solen": "Four segments across 350, each 82.1 to 83.6 x 44, label 12.5px, radius 9px, selected weight 600 ink and unselected weight 500 rgb(107,107,107).",
    "gap": "The sort labels are the smallest text on the sheet and sit on a control you are meant to tap, which makes the one thing you scan first the hardest thing to read.",
    "proposal": "Raise the label to 14px and let the row hold three options plus horizontal scroll, or drop one option, rather than shrinking type to make four fit.",
    "cost": "One component and four locale strings that may need shortening. Half a day.",
    "collidesWith": "LOCKFILE's text-size row says a button label is never at or below 13px. 12.5px breaks that, and 12.5 is not on our size scale (11 / 12 / 14 / 15) either, so this is a drift fix as much as a copy of Airbnb."
  },
  {
    "screen": "/de/auth/login and /de/auth/register",
    "element": "Whether a field still says what it is once you have typed in it",
    "airbnb": "A real label element, 'Telefonnummer oder E-Mail-Adresse', 16px rgb(108,108,108), tied to the input with for/id. The input carries 29px of top padding so the label rides above the value instead of being replaced by it.",
    "solen": "/de/auth/login renders zero label elements; both boxes carry placeholder text only ('E-Mail-Adresse', 'Passwort') with padding '0px 16px', so the name disappears the moment you type. /de/auth/register renders three fields and one label, on the birthdate only.",
    "gap": "On review, or after an autofill, the two boxes on the sign-in screen are two identical empty rectangles with values in them and nothing saying which is which.",
    "proposal": "Ship the second half of the 2026-08-09 decision: put the bigger ink question above each box on login and register, which is the replacement that decision named. Not a return of the small grey label it deleted.",
    "cost": "About five question strings in four languages plus the vertical rhythm. A day.",
    "collidesWith": "TASTE_LOG 2026-08-09 decision 7 deliberately dropped the small label above a field in favour of a bigger black question above the box, and it overruled the option to keep the label. So do not re-propose the label. This f"
  },
  {
    "screen": "/de/search",
    "element": "loading skeleton vs the card it stands in for",
    "airbnb": "one skeleton. Photo block 342 x 256.5 px, radius 20px, one column at x=24. The loaded card photo is 342 x 256.5 px (ratio 1.333), radius 20px, same x. Delta between placeholder and real: 0 px in width, 0 px in height, 0 px in radius.",
    "solen": "three different layouts in sequence on one load. (1) route file skeleton: one column, photo 356 x 356 (ratio 1.000), radius 0, at x=17 y=105. (2) client skeleton: TWO columns, grid-template-columns 177px 177px, gap 16px 12px, photo 177 x 177 (ratio 1.000) radius 8px, at x=12 y=162 and x=201 y=162. (",
    "gap": "The grey blocks a user stares at are half the width and the wrong shape, laid out in two columns, and then the page throws all of it away and rebuilds as a single column of taller cards, so everything the eye had settled on jumps.",
    "proposal": "Delete both placeholder layouts and generate one placeholder from the real result card: one column, 366 wide, photo aspect 5/4, radius 16. Use it for the route file and for the in-page loading branch so a user never sees two different waits.",
    "cost": "One focused afternoon. No new design decisions needed, the target numbers are the ones the real card already uses.",
    "collidesWith": "none"
  },
  {
    "screen": "/de/search",
    "element": "is the wait announced to a screen reader",
    "airbnb": "every skeleton block carries aria-busy=\"true\" (27 such nodes in the measured viewport) and the container that holds them carries aria-label=\"Lädt\". The page also carries 3 live regions, one of them role=\"alert\" aria-live=\"assertive\".",
    "solen": "33 skeleton nodes, 33 of them aria-hidden=\"true\", 0 with aria-busy. The only live region on the page is a single sr-only span with aria-live=\"polite\" whose text is the empty string while loading is true (SearchTemplate.tsx:1574-1576). Nothing is announced.",
    "gap": "A blind user asks for search results and the page says nothing at all, then some time later a count appears with no warning that anything was happening in between.",
    "proposal": "Put aria-busy=\"true\" on the results container while loading and give it an accessible name (\"Salons werden geladen\"), and let the existing sr-only region carry that same string instead of an empty string during the loading branch. Do not touch the animation.",
    "cost": "About an hour, two attributes and one string in four languages.",
    "collidesWith": "none"
  },
  {
    "screen": "/de/search",
    "element": "zero-results state, explanatory line",
    "airbnb": "headline \"Keine genauen Treffer\" 22px / weight 500, left aligned at x=24 y=539.9, then a subline 14px / weight 400, 342 wide and 40 tall (two lines) starting immediately at y=565.9: \"Versuche, einige deiner Filter zu ändern oder zu entfernen oder deinen Suchbereich anzupassen.\"",
    "solen": "headline \"Keine Salons gefunden.\" 20px / weight 600, centred, 202.7 wide at x=93.6 y=290, then straight to the button at y=341.5. There is no subline. The component has no slot for one: C1State in SearchTemplate.tsx:2326-2365 renders icon, headline, primary button, optional secondary link, and nothi",
    "gap": "The screen states a fact and stops. The user is not told what to change to get a different result, so the only obvious move is to leave.",
    "proposal": "Add a message line to C1State between the headline and the button, 14px / weight 400 in s-ink-2, and write one per cause (no supply in this city, date too narrow, filters too tight, query missed).",
    "cost": "Half a day, mostly writing four short sentences in four languages.",
    "collidesWith": "none"
  },
  {
    "screen": "/de/[any dead link]",
    "element": "error page length and what sits under the recovery",
    "airbnb": "document scrollHeight 1072 against an 918 viewport. \"Oops!\" at 145px / weight 700 in rgb(72,72,72), a 30px / weight 400 line under it, a 313 x 428 illustration at y=595.9, then a short link list. No marketing footer, no newsletter block.",
    "solen": "document scrollHeight 1920 against an 844 viewport. \"404\" at 96px / weight 700 (rendered aria-hidden through a gradient clip so its computed colour is rgba(0,0,0,0)), an H1 at 20px / weight 700, the ink pill \"Salons finden\" 141.3 x 48 at y=576.4 and a grey link at y=640.4. Below all of that the page",
    "gap": "A user who hit a dead link scrolls past a newsletter sign-up and the whole footer. The page is 1.8 times taller than the reference for a screen whose only job is to send you somewhere useful.",
    "proposal": "Hide the newsletter section and collapse the footer to a short link row on the 404 and root error routes, so the page ends shortly after the recovery button.",
    "cost": "Two hours, one layout condition on two routes.",
    "collidesWith": "none"
  },
  {
    "screen": "/de (and every screen with a wide button)",
    "element": "press feedback on the home search bar",
    "airbnb": "342 x 56 bar. Held pointer-down to settle, computed transform = matrix(0.9942, 0, 0, 0.9643, 0, 0), i.e. scaleX 0.9942 and scaleY 0.9643. Left/right edge travels 1.00px; top/bottom edge travels 1.00px.",
    "solen": "356 x 62 bar. Same method, computed transform = uniform scale(0.97). Left/right edge travels 5.34px; top/bottom edge travels 0.93px.",
    "gap": "Their wide bar sinks by the same 1px on all four edges, so it reads as pressed; ours pinches inward 5.34px horizontally against 0.93px vertically, so on tap it reads as the bar being squeezed rather than pushed.",
    "proposal": "Make the press scale per-axis instead of uniform on any control wider than roughly 200px: sx = 1 - 2/width, sy = 1 - 2/height, which fixes edge travel at 1px on both axes. Keep the existing uniform rungs for small controls, where the two already agree.",
    "cost": "One shared press utility changes. Every wide button on the site pinches about five times less when you tap it; small buttons look identical.",
    "collidesWith": "LOCKFILE section 3.5 state matrix freezes scale(.97) as the primary button's pressed state, and MOTION.md motion sheet 22's press ladder (0.97 CTA/card, 0.98 row, 0.94 icon) is owner-approved 2026-06-09. MOTION.md's own "
  },
  {
    "screen": "/de",
    "element": "SalonCard link (a[aria-label=\"<name>, Termin buchen\"]) in the home rails",
    "airbnb": "Their home listing card also declares no press transform (scale held at 1.000 for the whole 500ms sample), but it computes -webkit-tap-highlight-color rgba(51,181,229,0.4), so a tap paints the native highlight over the card.",
    "solen": "scale 1.000 and opacity 1.000, unchanged for the full 500ms under forced :active and again under a held mouse-down, with tap highlight rgba(0,0,0,0). Nothing happens at all.",
    "gap": "The biggest and most-tapped thing on the home page gives a finger no answer whatsoever, while theirs at least flashes.",
    "proposal": "Keep the entrance animation exactly as it is but stop it holding the end state: put the resting values (opacity 1, transform none) on .salon-card-stagger > * and switch the animation to backwards fill, at app/globals.css:597-600.",
    "cost": "One line of CSS. The entrance looks identical and 24 cards on the home page start answering a tap.",
    "collidesWith": "none. MOTION.md's locked \"List first-load: stagger rise-in, capped at item 8\" pattern is preserved unchanged by this fix."
  },
  {
    "screen": "/de vs /de/search",
    "element": "The card for the same salon on two of our own surfaces",
    "airbnb": "Their home listing card and their /s/ result card behave identically: no transform, no opacity change, tap highlight rgba(51,181,229,0.4) on both.",
    "solen": "/de card: no change at all. /de/search card (366x367.8): scale 1.000 -> 0.970, opacity 1.000 -> 0.900, press-in settled at 105.1ms, release instant.",
    "gap": "Tapping the same salon feels like two different products depending on which screen you arrived from.",
    "proposal": "One press spec for the salon card on every surface. Fix the home card first, then bring the search card's values onto the same number.",
    "cost": "No new design decisions, just making two existing places agree.",
    "collidesWith": "none. This is currently a FLOORS LAW 8 violation (\"the same thing looks the same everywhere\"), so fixing it satisfies a lock rather than re-opening one."
  },
  {
    "screen": "every customer screen",
    "element": "Every a, button and [role=button] on press",
    "airbnb": "0 of the 9 elements measured changed opacity on press. Home heart, home listing card, home category pill, home search bar, PDP Reservieren, PDP back button, PDP rating row and both search result cards all held opacity at 1.000.",
    "solen": "8 of the 9 elements measured drop to opacity 0.780 (the /de/search result card drops to 0.900).",
    "gap": "A 22% fade is what a disabled control looks like. On a phone the whole button greys out under the thumb instead of just pressing in.",
    "proposal": "Delete the opacity term from the coarse-pointer press rule at app/globals.css:1055-1062 and keep the transform. Any element that genuinely wants a fade keeps its own active:opacity-* class.",
    "cost": "One property removed from one CSS rule.",
    "collidesWith": "none, and it moves toward a lock: the LOCKFILE section 3.5 state matrix defines the pressed primary button as scale(.97) plus the pressed shadow, with no opacity term anywhere."
  },
  {
    "screen": "every customer screen",
    "element": "How long a press takes to complete",
    "airbnb": "Declared transitionDuration is 0.25s on the heart, the back button, Reservieren and the home search bar, and 0.22s on the category pill. Measured travel is 192 to 201ms on the two icon controls and 108ms on the CTA.",
    "solen": "80ms declared in the :active rules, measured travel 42 to 67ms across the CTA, heart, pill, search bar, tabs and icon buttons.",
    "gap": "Theirs is roughly three times longer, so their press reads as a soft depress and ours as a flick.",
    "proposal": "Do not change this without the owner. Report it as a correction to the SPEED LAW's evidence line, which cites \"Airbnb 100ms x28\" for the press tier: that number came from a whole-page duration histogram over all elements, and not one Airbnb press element I cou",
    "cost": "None if only the citation is corrected. Changing the tier itself would be a sweep of every press site in the estate.",
    "collidesWith": "MOTION.md \"THE SPEED LAW\", press tier 80-100ms, owner-approved 2026-07-25. Flagged, not overridden. Also worth noting the estate already disagrees with itself here: LOCKFILE line 748 still lists press as 150ms on the thu"
  },
  {
    "screen": "/de/[city]/[category] (measured on /de/basel/coiffeur)",
    "element": "The pinned search-context pill, the line that says which search you are looking at (\"Coiff",
    "airbnb": "Their equivalent pinned pill title (\"Unterkuenfte in Zuerich\") renders at 15.91:1 contrast at scrollY 0 and 15.91:1 at scrollY 400, identical. Their chrome collapses into ONE 82px band with no self-overlap.",
    "solen": "The same label renders at 19.80:1 at scrollY 0, then 1.22:1 at scrollY 200, 1.20:1 at 400, 1.21:1 at 900 and 1.41:1 at 1500. Cause measured: at scrollY 400 both the HEADER (sticky, top 0, height 68, z-index 50, background rgba(255,255,255,0.65)) and the pill band (sticky, top 0, height 74, z-index 5",
    "gap": "The moment the customer scrolls a results list, the line telling them what they searched for becomes invisible and stays invisible at every depth.",
    "proposal": "Stop the two sticky layers sharing top:0. Either offset the pill band to top:68 so it stacks under the header instead of behind it, or fold the query text into the collapsed header so the chrome becomes one band the way theirs does.",
    "cost": "About half a day of front-end work on one component.",
    "collidesWith": "none. WCAG 1.4.3 sits at tier 2 (statutory floors) in the precedence chain in CLAUDE.md, above taste at tier 5, so this outranks any styling preference rather than competing with one."
  },
  {
    "screen": "/de (home) and /de/[city]/[category]",
    "element": "Horizontal card rails, what happens when you swipe past the last card",
    "airbnb": "Every card rail sets overscroll-behavior-x: contain. Five of the six scrollable rails on their home carry it (the sixth is a 580px non-card row at auto), and so does the card photo carousel on their search results.",
    "solen": "overscroll-behavior-x computes to \"auto\" on all nine scrollable rails on our home and on both rails on our search results. Not one uses contain.",
    "gap": "Swiping a rail past its last card hands the leftover motion to the page, which on a phone is what fires the browser back gesture, so a hard flick through a card row can navigate away from the screen.",
    "proposal": "Add overscroll-behavior-x: contain to the shared rail container.",
    "cost": "One line in the shared rail component.",
    "collidesWith": "none"
  },
  {
    "screen": "/de (home)",
    "element": "Snapping on the top category chip rail",
    "airbnb": "scroll-snap-type: inline mandatory, children scroll-snap-align: start, scroll-padding-left: 24px. Proven by behaviour, not just by the property: nudging the rail 30px and waiting 900ms settles it back at 0, so the snap really engages.",
    "solen": "scroll-snap-type: none, children scroll-snap-align: none, scroll-padding-left: auto. Same probe: nudged 27px, settled at 27, no snap. (Our content card rails below do snap, at x mandatory with scroll-padding 12px, and land correctly on card edges when tested, so this is specific to the chip rail.)",
    "gap": "The chip rail drifts to a half-chip resting position after a swipe instead of landing on a chip edge, which is the one rail on the page where the reference is strict about it.",
    "proposal": "Add scroll-snap-type and scroll-snap-align: start to the chip rail, matching the card rails that already do it.",
    "cost": "One line.",
    "collidesWith": "Worth his eye rather than a blocker: on 2026-07-19 he downgraded snap-mandatory to snap-proximity on the PDP staff row because \"staff jumps when u scroll\" (REMOVED.md, TASTE_LOG). Different element, same mechanism, so if"
  }
];
