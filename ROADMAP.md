# Solen.ch Bug Fix & UI Polish Roadmap

**Context for AI Assistant (Claude Code / Cursor / etc.):**
You are executing a critical round of bug fixes and UI/UX polish for Solen.ch. This roadmap addresses broken forms, database registration crashes, and UI layout glitches based on recent visual feedback from the user. You MUST follow these phases exactly as written.

**CRITICAL INSTRUCTIONS FOR AI EXECUTION:**
1. **Never skip ahead.** Complete one phase entirely, verify the changes, and get user approval before moving to the next phase. Read the code carefully before making changes.
2. **Attention to Detail:** Pay microscopic attention to the exact design specifications, padding, typography, and color codes mentioned in each task. Do not generalize or ignore specific design requests.
3. **Database Guardrails:** Be super careful with the registration form (Step 1-5). The `stores` table schema requires certain columns (e.g. `cat`).

---

## Phase 1: Critical Registration Blockers (Database & Form Bugs)
**Goal:** Fix the most urgent bugs that are actively preventing salons from registering on the platform.

- [x] **1.1 Fix "null value in column 'cat' of relation 'stores' violates not-null constraint"**
  - **Problem:** When submitting the final registration step, Supabase rejects the insertion because the `cat` (categories) column is null.
  - **Action:** Investigate the form submission logic in `index.html` (e.g., `saveDraft` or `obPublish`).
  - **Action:** Ensure the selected categories from Step 3 are correctly formatted (e.g., as a text array or string) and included in the Supabase payload. Provide a safe fallback (e.g., `['Uncategorized']`) if none are selected, or remove the strict `NOT NULL` constraint from the database via migration if it's meant to be optional.
  - *Note:* Do not break the auto-save draft functionality while fixing this.

- [x] **1.2 Fix the "Exclamation Marks" Input Glitch (Step 2)**
  - **Problem:** When typing in the "STRASSE & HAUSNUMMER" or "PLZ/ORT" fields, multiple gray circles with exclamation marks appear inside the input field, overlapping text and preventing further typing.
  - **Action:** Locate the CSS/HTML governing form input validation (likely `:invalid` pseudo-class or a custom validation script adding icons).
  - **Action:** Remove or fix the styling so the input remains clean, or only shows a single validation icon outside the text bounds. Ensure the user can actually type without visual obstruction.

- [x] **1.3 Fix the Progression URL / Stepper Sync**
  - **Problem:** The user is clearly on Step 5 of the registration form ("Schritt 5 von 5: Beschreibung und Öffnungszeiten"), but the browser URL hash/parameters still say step 2.
  - **Action:** Check the `nextLink()` or `changeStep()` logical functions in `index.html`. Ensure `history.pushState` or `location.hash` is accurately updated to match the active step index.

- [x] **1.4 Redesign the "Deinen Salon eintragen" Form Layout**
  - **Problem:** The entire registration form feels cramped. Fields are squeezed, labels are tiny, and there is no breathing room.
  - **Action:** Increase the vertical gap between form fields (e.g., using `gap-4` or `gap-6` in Tailwind/CSS).
  - **Action:** Increase the font size and font weight slightly for labels.
  - **Action:** Fix the "Entwurf gespeichert um 13:08" timestamp text—make it slightly larger and improve color contrast so it's actually readable.

---

## Phase 2: Category Filters & "Was suchst du heute?" UI Glitches
**Goal:** Clean up overlapping UI, broken styles, and reposition the category section for better UX.

- [x] **2.1 Relocate and Restyle Category Horizontal Chips**
  - **Problem:** Filter chips at the bottom of the screen look awkward, have a weird red line underneath, and contain a buggy "Zurücksetzen" button.
  - **Action:** Move this entire category/filter row to the **TOP** of the site, placing it right under the stats row/search bar section ("wie viele Termine bereits gebucht").
  - **Action:** Remove the "Zurücksetzen" floating button entirely. The user only needs the chips. Selected chips turn red, which is enough indicator.
  - **Action:** Remove the thin, broken red bar that appears below the "Barbershop in Basel" header when a filter is active.
  - **Action:** Make the bounding boxes/background colors of these chips match the color surrounding the "Last Minute" boxes. Remove any extra borders.

- [x] **2.2 Fix Overlapping Glitched Boxes in "Was suchst du heute?"**
  - **Problem:** When a user clicks a category (e.g., Barbershop), the active state styling looks glitched (overlapping borders / cut-off text).
  - **Action:** Audit the active state CSS for these boxes. Ensure padding and borders don't collapse or overlap neighboring elements.
  - **Action:** Fix the section subtitle text ("Wähle direkt einen Service und finde Salons in deiner Nähe"). It is currently getting cut off. Use `text-wrap: balance` or remove `white-space: nowrap` to allow it to span two lines if needed on mobile.

- [x] **2.3 Fix Filter Auto-Scroll Behavior**
  - **Problem:** When a user taps one of the category filter chips (e.g., Barbershop), the page aggressively auto-scrolls down to the "Was suchst du heute?" section, which is disorienting.
  - **Action:** Remove any aggressive scroll-into-view or anchor link jumping attached to the category filter chips. The filtering should happen instantly in-place without forcing the user's viewport to change.

---

## Phase 3: Salon Cards & Placeholders Polish
**Goal:** Make salon discovery look complete, trustworthy, and styled consistently.

- [x] **3.1 Populate "Alle Salons" Cards with Missing Info**
  - **Problem:** The salon cards in the "Alle Salons" wrapper have almost zero information compared to mocks.
  - **Action:** Add the following elements to these list cards:
    - Rating stars (e.g., 4.8★).
    - Distance (e.g., 450m).
    - Starting price ("ab CHF XX").
    - The "Heute noch Termine frei" badge (Green urgency pill).

- [x] **3.2 "Bald hier" Placeholder Cleanup**
  - **Problem:** Grey cards saying "Bald hier" look very temporary and break trust.
  - **Action:** Change the text to a more professional "Bald verfügbar".
  - **Action:** Style these placeholder cards natively with a subtle loading shimmer / reduced opacity to make them look intentionally coming-soon rather than broken. (Alternatively, hide them dynamically if the database has 0 matching salons).

- [x] **3.3 Last Minute Cards Details Upgrade**
  - **Action:** Add more detailed info directly inside the 'Last Minute' boxes (how far the salon is, ratings, and *exactly* which service is being offered last minute).

---

## Phase 4: Last Minute Offer Feature (Dashboard & Homepage)
**Goal:** Implement a brand-new flow for Salon owners to push canceled slots to the feed, and map it for users.

- [x] **4.1 Salon Dashboard Toggle**
  - **Action:** Add an option in the Salon Owner Dashboard to manually trigger a "Last Minute Offer" (e.g., when an appointment gets canceled). 
  - **Action:** Capture which exact service it is and the start time.

- [x] **4.2 Customer Feed Implementation (Prioritization)**
  - **Action:** When users are browsing the homepage, modify the "Last Minute" display logic. If there is a last minute offer from a salon that the user *has already visited in the past*, prioritize showing that specific card at the very front of the list.

---

## Phase 5: Visual Transitions & Polish
**Goal:** Final aesthetic touch-ups.

- [x] **5.1 Soften the "FÜR SALONBESITZER/INNEN" Transition**
  - **Problem:** The black "FÜR SALONBESITZER/INNEN" container placed right under the white Testimonials section creates a very harsh, amateur visual cut.
  - **Action:** Implement a softer transition. Add significantly more vertical padding (`py-20`), consider a subtle gradient bleed, a soft wave divider (SVG), or change the background color off-black to something slightly warmer/softer to bridge the gap smoothly.

- [x] **5.2 Cleanup Minor Oddities**
  - **Action:** Ensure the spacing/breathing room matches the new glassmorphism and "Quiet Luxury" aesthetic established in the prior roadmap.

- [x] **5.3 Fix Cut-off Text in Testimonials**
  - **Problem:** The testimonial text in the "Was Basler*innen sagen" cards is abruptly cut off at the bottom.
  - **Action:** Fix the height/overflow CSS on these testimonial cards so the entire quote is visible. Allow the card to expand vertically to fit the content safely.
