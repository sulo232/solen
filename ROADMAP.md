# Solen Platform Backend & UI Integration Roadmap

> **Status:** React/Vite Micro-Frontend integration has been successfully COMPLETED and deployed via Vercel.
> The codebase now supports `shadcn/ui`, `Tailwind CSS`, and `TypeScript` natively out of `src/components/ui/` with proper DOM injection into the legacy `index.html`.
>
> **Phase 1 & Phase 2 COMPLETE (2026-03-13). Phase 3 is next.**

---

## 🛠 Phase 1: Fixing Salon Registration Crash ✅ DONE
**Goal:** Prevent the `stores` table from crashing during the `obPublish()` onboarding function due to missing columns or unhandled states.

### Action Items
- [x] **Supabase Schema Migration (011):**
  - Added missing columns to `stores`: `opening_hours`, `instagram`, `cancellation_policy`, `categories`, `email`.
- [x] **Supabase Schema Migration (012):**
  - Fixed `services.store_id` type: UUID → bigint (matches `stores.id`)
  - Added `start_date`/`end_date` to `blocked_dates` for vacation range support
- [x] **`obPublish()` Logic Overhaul:**
  - Inserts `email` and `owner_email` from onboarding wizard data.
  - Auth guard added — requires `currentUser` before insert.
  - Clears draft (localStorage + `salon_reg_drafts`) after successful publish.
  - PLZ auto-fills city from `BASEL_PLZ_MAP` in step 2.

---

## 🔑 Phase 2: Registration and Auth Refinement ✅ DONE
**Goal:** Create a seamless onboarding pipeline for both customers and business-owners, especially fixing overlap errors.

### Action Items
- [x] **Dual-Use Accounts:**
  - "Already registered" errors in salon signup now show "Anmelden und Salon eintragen →" link.
  - `pendingSalonReg` flag triggers `openSalonRegistration()` automatically after login.
- [x] **"Add Salon" Discoverability:**
  - "Salon eintragen" added to the logged-in user dropdown; hidden for existing salon owners.
- [x] **Auto-Draft Saving:**
  - `obSaveProgress()` now syncs to `salon_reg_drafts` Supabase table on every save.
  - `openOnboarding()` restores cloud draft (picks newer of local vs. cloud).
- [x] **Location Validation (Step 2):**
  - PLZ auto-fills city from `BASEL_PLZ_MAP` when field is empty.

---

## 🗓 Phase 3: Profile, Bookings & Admin Dashboards
**Goal:** Consolidate the user profile UI and build out the backend management tools for store owners to manage staff and hours.

### Action Items
- [ ] **Fix Duplication & Layout Bugs:**
  - Resolve the duplication bugs visible on the Profile and "Termine" (Bookings) pages.
  - Fix incorrect scrolling behavior, blank spaces, and unexpected UI wrapping.
- [ ] **Staff Scheduling & Splits:**
  - Add functionality for salons to define specific "break times" or "lunch breaks" during their operating hours.
  - Allow individual staff members within a salon to split their shifts visually in the booking system.
- [ ] **Admin Panel Overhaul:**
  - Fix the currently non-working Admin Panel.
  - Ensure the store owner can easily CRUD (Create, Read, Update, Delete) services, staff members, and manually modify existing bookings.

---

## 🌟 Context for Next Agent
If you are reading this roadmap, **DO NOT attempt to setup React, Vite, or Tailwind.** It has already been fully configured in the `solen-react` migration and works smoothly via `<script type="module" src="/src/react-entry.tsx"></script>`. 

Your job is strictly executing the **backend Supabase schema fixes, API routes within `index.html`, and structural CSS grid bugs** outlined in the three phases above!
