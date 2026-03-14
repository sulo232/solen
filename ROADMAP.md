# Solen.ch UI/UX Overhaul & Conversion Optimization Roadmap

**Context for AI Assistant (Claude Code / Cursor / etc.):**
You are executing a critical UI/UX overhaul for Solen.ch. This roadmap is divided into strict, sequential phases. You MUST follow these phases exactly as written.

**CRITICAL INSTRUCTIONS FOR AI EXECUTION:**
1. **Never skip ahead.** Complete one phase entirely, verify the changes, and get user approval before moving to the next phase. Read the code carefully before making changes.
2. **Attention to Detail:** Pay microscopic attention to the exact design specifications, padding, typography, and color codes mentioned in each task. Do not generalize or ignore specific design requests.
3. **Responsive Design:** While some of these instructions target mobile specifically, you must ensure the changes also look perfect and apply correctly on Desktop (PC) screens.
4. **Modern Aesthetics:** Where relevant, incorporate **glassmorphism** effects (e.g., translucent backgrounds with blur, `backdrop-blur-md bg-white/70`, subtle borders) to make the UI feel premium, modern, and trustworthy.

---

## Phase 1: High-Priority Visual & Trust Fixes (The "First Impression")
**Goal:** Fix the most glaring visual bugs that instantly kill user trust or make the platform look unfinished.

- [ ] **1.1 Fix the Salon Image Placeholder ("Salons in deiner Nähe")**
  - **Problem:** Massive broken black image placeholder with a tiny camera icon screams "unfinished beta".
  - **Action:** Replace the black box with a high-quality 16:9 photo of a salon interior or beautiful haircut result (warm lighting, clean background).
  - **Action:** Add a soft beige skeleton loader (shimmer effect) while the actual real image loads. *Never* show a black box.
  - **Action:** Implement a fallback rule: Show a gorgeous category default image (e.g., a stylish Basel haircut for a Coiffeur) if the salon hasn't uploaded photos yet.
  - **Action:** Make the photo clickable so it opens a full gallery.
  - **Action (Backend/Onboarding logic):** Enforce mandatory upload of at least 4 photos (exterior, interior, work examples, team) during salon onboarding. Use Cloudinary/Supabase storage with auto-crop. 
  - *Implementation tip:* Start with 10 high-quality Basel stock photos as placeholders while salons upload.

- [ ] **1.2 Revamp the Homepage Hero Section**
  - **Action:** Add a proper, high-quality hero visual. This must immediately convey a premium "Beauty & Wellness in Basel" vibe. This makes the site feel 3x more professional.

- [ ] **1.3 Implement Prominent Social Proof on Homepage**
  - **Action:** Add a prominent stats row right after the hero section with icons:
    - 👥 40+ Salons in Basel
    - 📅 1.200+ Buchungen diesen Monat
    - ⭐ 4.8 / 5 Durchschnittsbewertung
  - **Action:** Add real review snippets to build immediate trust.

---

## Phase 2: Salon Card Redesign & Conversion Optimization
**Goal:** Transform the way salons are presented in the feed to make browsing addictive and drive clicks (similar to Treatwell or Fresha).

- [ ] **2.1 Overhaul the Salon Listing Cards**
  - **Action:** Redesign the card layout completely. Top 60% of the card must be a big, high-quality photo with a price overlay.
  - **Action:** Include the Salon Name, a prominent 4.8★ rating, and the number of reviews.
  - **Action:** Show the exact Location and Distance (e.g., "Basel • 450m").
  - **Action:** Add a Green urgency badge (e.g., "Heute noch Termine frei" or "Nächster Termin: 14:30").
  - **Action:** Display quick services as small pills below the details.
  - **Action:** Add a prominent red "Jetzt buchen" button on the card.
  - *Design Note:* Use glassmorphism overlays on the badges or info blocks overlapping the image.

- [ ] **2.2 Improve "Salons in deiner Nähe" Layout**
  - **Action:** Change the layout to a horizontal scroll of 3–4 full, improved salon cards instead of one broken/large one. (Ensure the desktop version shows a nice desktop grid or arrows for the slider).

- [ ] **2.3 Enhance Salon Detail Pages (Gallery & Reviews)**
  - **Action:** Add a swipeable photo gallery at the top of the salon detail page.
  - **Action:** Implement a "Vorher/Nachher" (Before/After) slider component.
  - **Action:** Create a "Kundenfotos" (Customer Photos) section where clients can upload photos in their reviews (huge trust booster). Create a photo style guide logic to reject low-quality uploads.

---

## Phase 3: Navigation, Filtering & Layout Polish
**Goal:** Make the app intuitive, fill empty spaces smartly, and guide the user seamlessly without confusion.

- [ ] **3.1 Overhaul Global Navigation Flow**
  - **Action:** Modernize the Top bar: Logo + Search + Location pill.
  - **Action:** Implement standard Bottom nav (Mobile): Home | Entdecken | Karte | Profil.
  - **Action:** Add a permanent horizontal filter bar on listing pages (Service + Quartier + Preis). Apply a glassmorphism effect to the sticky filter bar.

- [ ] **3.2 Implement Interactive "Quartiere" and Categories**
  - **Action:** Turn "Quartiere" (Grossbasel, Kleinbasel, etc.) into tappable horizontal chips placed directly under the "Salons in deiner Nähe" title for instant filtering.
  - **Action:** Replace plain category pills with a "Visual Category Grid": big square cards featuring a photo background + icon (e.g., Coiffeur with scissors photo, Spa with massage stones).

- [ ] **3.3 Fix Empty Spaces and White Gaps**
  - **Action:** Audit pages like "Du hast einen Salon in Basel?", "Warum solen?", and the footer. Reduce top/bottom padding by ~20% where appropriate.
  - **Action:** Fill these empty areas strategically. Use a subtle background texture (very light hair/spa pattern), trust badges, your stats, or mini testimonial carousels.

---

## Phase 4: Styling, Aesthetics & Micro-Interactions (Quiet Luxury)
**Goal:** Elevate the entire platform to a "quiet luxury Basel style", escaping the generic minimalist aesthetic, and softening aggressive UI elements.

- [ ] **4.1 Global Color Palette & Typography Update**
  - **Action:** Apply new Background color: warm cream `#F9F5F0`.
  - **Action:** Apply new Accents: Keep the existing red, but add soft terracotta or sage green for wellness elements.
  - **Action:** Update Typography: Use slightly serif fonts for Headings (Playfair Display or Satoshi) and 'Inter' for body text.

- [ ] **4.2 Soften the Login Wall Error**
  - **Action:** Change the harsh red "Bitte zuerst einloggen…" banner. The logic is fine, but it feels aggressive.
  - **Action:** Redesign to: "Melde dich kurz an, um deinen Salon einzutragen" with a pleasant illustration, a Google login button on top. Keep the error color theme but make the box warmer and less alarming. (Glassmorphic background is a good fit here).

- [ ] **4.3 Add Micro-Animations & Polish**
  - **Action:** Add card tap/hover scale animations (e.g., scale to 1.02x).
  - **Action:** Ensure smooth page and component transitions.
  - **Action:** Use loading shimmers (skeletons) across the app instead of spinners or blank screens.

---

## Phase 5: "Nice-to-Have" & Ongoing Delight Features
**Goal:** Add features that surprise and delight the user, converting a good experience into a great one.

- [ ] **5.1 Dynamic Weather Banner**
  - **Action:** Implement a dynamic weather header based on current conditions. Example: "Regentag in Basel? Perfekt für Spa & Massage — jetzt buchen!" with direct links to relevant services.

- [ ] **5.2 Separate "Für Salons" Section**
  - **Action:** Build a clear, distinct flow/portal for salon owners so the B2B (business) and B2C (customer) experiences do not mix.

- [ ] **5.3 Testimonials Carousel**
  - **Action:** Add a "Was Basler*innen sagen" carousel at the bottom of the homepage with real photos and quotes.
