<!-- exists-check: net-new doc for a net-new primitive. Closest existing docs (Step.md = marketing
"how it works", CheckoutSheet.md, SearchOverlay.md, SelectedCheckBadge.md) are unrelated surfaces;
none documents a one-time anchored feature-intro coachmark. The thing this GENERALIZES is the
orphaned components-legacy/TutorialTour.tsx (no .md of its own), confirmed via `npm run exists tour`. -->

# Coachmark

**Layer: 1 chrome hosting Layer-3 intro content** (the dark popover + overlay are chrome; the explanation it carries is a one-time Layer-3 feature hint, not a persistent UI surface).

**Purpose.** The ONE reusable, skippable **feature-intro coachmark** for Solen. It anchors a small dark card with a beak to a real control, explains a non-obvious feature once, and never nags again. It is a GENERALIZATION of the orphaned driver.js tour (`components-legacy/TutorialTour.tsx`) , same `driver()` engine, same `popoverClass: "solen-tour-popover"` (now restyled to the dark card), same 600ms settle , but it points at ANY control and persists PER-id instead of one global "tutorial_completed" flag.

> **Reuse, do not reinvent.** driver.js@^1.4.0 is already a dependency. The popover theme already lived in `app/globals.css`. This primitive only restyled that theme + wrapped the engine in a typed, per-id React component. Do NOT add a second tour/tooltip library.

**File.** `app/[locale]/_components/primitives/Coachmark.tsx` (barrel export from `primitives/index.ts`).

**Public API.**
```
<Coachmark
  id                // string , the seen-key (shared "solen_coachmark_seen" set). Once dismissed, never re-fires.
  anchor            // string CSS selector OR a RefObject<HTMLElement> , the target control (single-step)
  title             // string
  body              // string
  side?             // 'top' | 'bottom' | 'left' | 'right' , beak direction (driver.js native). Default 'bottom'.
  steps?            // Array<{ anchor, title, body, side? }> , multi-step tour (overrides single title/body/anchor)
  dismissLabel?     // string , single-step pill label. Default i18n tour.gotIt ("Verstanden").
/>
```
Renders **no DOM of its own** (returns `null`); driver.js owns the overlay + popover.

- **Single-step (default):** one full-width "Got it" pill (driver.js `showButtons:['close']`, the close button restyled into the pill). `dismissLabel` overrides the label.
- **Multi-step (`steps` with >1 item):** Next button + a step counter ("1 of N", via driver.js `progressText` + the `tour.stepCounter` placeholder string) + a grey "Skip the tips" text button (the relabelled close button).

**Mount gate.** On mount, after a **600ms settle** (matches `TutorialTour`), it fires ONLY if (a) `id` is not in the seen-set AND (b) the anchor element exists and is visible (`getBoundingClientRect().width/height > 0`). This is why a barbershop-gated control can mount the Coachmark unconditionally inside the `categories.includes("barbershop")` guard , the visibility check stops it firing on a mobile-hidden copy of the same selector.

**Persistence model (per-id).** `lib/coachmark-seen.ts` , `seen(id)` / `markSeen(id)`. Stores a JSON array of dismissed ids under ONE localStorage key `solen_coachmark_seen` (so every feature-intro shares a single entry, not one key per feature). Mirrors the proven localStorage flag in `components-legacy/ui/PWAInstallPrompt.tsx`. `markSeen(id)` fires on Dismiss (single-step close) OR completing the last step (multi-step done/skip), via driver.js `onDestroyStarted` + `onDestroyed`. SSR-safe (guards `typeof window`). If driver.js fails to load, the id is burned so it won't retry , the page never blocks on a tour.

**Dark-card recipe (owner-approved, mockup `public/_mockups/onboarding-tier-a/` "Coachmark" tab).** Lives in `app/globals.css` under `.solen-tour-popover`:
- card bg `#15161B`, radius `16px`, padding `16px`
- **real drop shadow** `0 20px 44px -18px rgba(0,0,0,.55)` , NEVER a `0 0 0 Npx` ring/halo
- title: white, Inter Tight, 16px, bold
- body: grey `#9CA0A8`, 13px, ~1-2 lines
- full-width Dismiss/"Got it" pill: bg `#2A2C33`, white text, radius `11px`, 42px tall
- footer row (multi): step counter "1 of N" grey `#6B7079` left + "Skip the tips" grey `#9CA0A8` text button right
- upward beak: 14px rotated square, same `#15161B`, pointing at the anchored control
- **NO `text-transform:uppercase`, NO `letter-spacing`** on any popover button (banned by the project copy rules , the old light-glass theme had uppercase, removed in this restyle)

The four dark-card hexes (`#15161B`, `#9CA0A8`, `#6B7079`, `#2A2C33`) are owner-locked literals with no Tailwind token, annotated `drift-ok` inline.

**Use for.** First-run explanation of a NON-OBVIOUS feature anchored to a real control: the Walk-in button (live, first usage), the full POS "Kassieren", block-off "Sperren", the cancellation-to-waitlist match. One per feature, shows once per browser.

**Don't reuse for.** Persistent help/tooltips that should re-show on every hover (use a hover tooltip , a coachmark is one-time). Modal dialogs or confirmations (use `Modal`). A multi-page product onboarding wizard (that's the wizard flow, not a single anchored hint). Marketing "how it works" sections (use `Step`). A semantic success/error beat (use `SuccessMark` / `Toast`).

**Provenance.** Built by generalizing `components-legacy/TutorialTour.tsx` (the only existing driver.js tour, confirmed via `npm run exists tour`). Dark-card recipe approved in the `onboarding-tier-a` mockup. First mounted on the calendar Walk-in control (`app/[locale]/dashboard/calendar/page.tsx`), barbershop-only.
