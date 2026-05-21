# Solen Dashboard Ecosystem Audit & Expansion Roadmap

This document provides a highly detailed, section-by-section audit of the Solen B2B Dashboard (Sidebar). It identifies current functionality states (working, partial, broken), UX bottlenecks, and architect-level proposals for completing unfinished segments and introducing industry-leading features.

---

## 1. Betrieb (Operations)

### 1.1 Overview (`/dashboard`)
*   **Current State:** Partial. Shows basic metric counters (appointments, revenue).
*   **Bottlenecks:** Lacks actionable insights. SolenScore requires deeper gamification.
*   **Expansion Ideas:** 
    *   **Action Center Widget:** A dynamically generated list of tasks (e.g., "3 Reviews require attention", "Confirm 2 pending bookings").
    *   **Revenue Heatmap:** A visual mini-chart indicating the busiest days of the current week compared to the last.

### 1.2 Bookings (`/dashboard/bookings`)
*   **Current State:** Working. Displays a list/table of upcoming appointments.
*   **Bottlenecks:** Hard to manage high-volume days. Lacks bulk state mutations.
*   **Expansion Ideas:**
    *   **Quick-Actions:** Right-click context menu to transition status (Arrived, No-Show, Completed).
    *   **Waitlist Automation:** If a booking cancels, automatically notify clients who requested that specific time slot.

### 1.3 Calendar (`/dashboard/calendar`)
*   **Current State:** Working/Partial. Renders the schedule grid.
*   **Bottlenecks:** Collision detection can be rigid; performance degrades with 5+ staff members rendering simultaneously.
*   **Expansion Ideas:**
    *   **Drag & Drop Rescheduling:** Click and drag an appointment block to a new time or staff member with automatic conflict resolution.
    *   **Smart Gap Filler:** AI highlights gaps in the calendar and suggests specific client segments to text via Marketing blast.

### 1.4 Messages (`/dashboard/messages`)
*   **Current State:** Partial. Basic 1-to-1 chat interface.
*   **Bottlenecks:** No rich media (sharing inspirational photos) or real-time typing indicators.
*   **Expansion Ideas:**
    *   **Automated Triage:** AI auto-replies for common questions ("How much is a fade?", "Do you have parking?").
    *   **Broadcasts:** Ability to send a mass message (e.g., "Running 15 mins late today due to traffic") to all clients booked for the day.

---

## 2. Team & Kunden (Team & Clients)

### 2.1 Team (`/dashboard/staff`)
*   **Current State:** Working (Recently fixed invite flows during onboarding).
*   **Bottlenecks:** Missing granular permission matrices (e.g., Staff can see their own schedule, but not total salon revenue).
*   **Expansion Ideas:**
    *   **Commission Tracking:** Automated tier-based commission splits calculated per completed booking.
    *   **Roster Shift Templates:** Copy-paste weekly rotating shift structures instead of manually building them.

### 2.2 Clients (`/dashboard/clients`)
*   **Current State:** Partial. Displays basic CRM data.
*   **Bottlenecks:** Hard to identify top-spenders or frequent "No-Shows".
*   **Expansion Ideas:**
    *   **VIP & No-Show Tagging:** Automatically badge clients based on attendance ratio and total lifetime value (LTV).
    *   **Client Formulation History:** Unified timeline showing past appointments, notes, and uploaded reference photos.

---

## 3. Business

### 3.1 Services (`/dashboard/services`)
*   **Current State:** Working (Enhanced with Gemini Smart Suggestions).
*   **Bottlenecks:** Reordering large category lists is tedious. No package grouping.
*   **Expansion Ideas:**
    *   **Service Bundling:** Create packages (e.g., "Fade + Beard + Wash") with a built-in discount.
    *   **Add-on Prompts:** "Suggest Hair Treatment" toggle that up-sells clients during their booking flow.

### 3.2 Marketing (`/dashboard/marketing`)
*   **Current State:** Unfinished / Planning.
*   **Expansion Ideas:**
    *   **Lifecycle Emails/SMS:** "We haven't seen you in 6 weeks" automated win-back campaigns.
    *   **Birthday Rewards:** Auto-issue a 15% discount code valid during their birthday month.

### 3.3 Analytics (`/dashboard/analytics`)
*   **Current State:** Partial. 
*   **Expansion Ideas:**
    *   **Staff Leaderboards:** Who sold the most retail? Who has the highest retention rate?
    *   **Export Engine:** 1-click PDF/CSV export for accounting and taxes.

### 3.4 Reviews (`/dashboard/reviews`)
*   **Current State:** Working.
*   **Bottlenecks:** Responding to every review takes time.
*   **Expansion Ideas:**
    *   **AI Auto-Responder:** Gemini drafts a customized, polite response to both 5-star and 1-star reviews.
    *   **Dispute System Integration:** Direct interface to challenge malicious reviews via Solen Admin.

### 3.5 Portfolio (`/dashboard/gallery` - Formerly "Fotos")
*   **Current State:** Working (Drag-and-drop enabled).
*   **Expansion Ideas:**
    *   **Before/After Slider:** Upload two photos that clients can drag left/right to see the transformation.
    *   **Service Tagging:** Tag a photo with "Balayage" so it appears when clients book that specific service.

### 3.6 Discovery Posts (`/dashboard/discovery-posts` - Formerly "Meine Posts")
*   **Current State:** Working.
*   **Expansion Ideas:**
    *   **TikTok / IG Sync:** Background worker that automatically pulls new Instagram reels and converts them to Solen Discovery posts.

---

## 4. Spezial (Specialized CRM Tools)

### 4.1 Nail Clients (`/dashboard/nail-clients`)
*   **Current State:** Unfinished.
*   **Expansion Ideas:**
    *   **Visual Hand Chart:** A digital diagram where techs can tap a specific finger to save notes (e.g., "Acrylic break on Left Thumb", "Allergies to gel").
    *   **Color Library Picker:** Save exact polish brand/serial codes used for a client to replicate the exact set 4 weeks later.

### 4.2 Barber Clients (`/dashboard/barber-clients`)
*   **Current State:** Unfinished.
*   **Expansion Ideas:**
    *   **Fade Blueprint:** Select visual sliders for Guard sizes (e.g., "Skin", "0.5", "1") on different zones of the head.

### 4.3 Barber Ops (`/dashboard/barber-ops`)
*   **Current State:** Unfinished.
*   **Expansion Ideas:**
    *   **Chair Utilization Metrics:** Track the percentage of time a specific chair is occupied versus empty.

---

## 5. Mehr (More / Settings)

### 5.1 Treueprogramm (`/dashboard/loyalty`)
*   **Current State:** Partial.
*   **Expansion Ideas:**
    *   **Tiered Loyalty:** "Gold Member" status for clients who visit >12 times a year, unlocking a secret booking tier.

### 5.2 Verifizierung (`/dashboard/verification`)
*   **Current State:** Working (Stripe Connect).
*   **Expansion Ideas:**
    *   **DocAI Auto-Extract:** Instead of manual review, use Vision AI to instantly verify business licenses and IDs.
