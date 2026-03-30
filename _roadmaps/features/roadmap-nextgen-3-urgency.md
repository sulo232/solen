# Roadmap: Next-Gen Urgency (Last-Minute Engine)

## Breakage Risk Assessment
| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 3.1 | 🟡 MEDIUM | Last-minute performance | Ensure countdowns run in client-components to prevent hydration mismatches. |
| Phase 3.2 | 🟡 MEDIUM | UI Rules compliance | Avoid raw red colors. Stick strictly to `shadow-coral-glow`. |

## 🤖 CLAUDE CODE PHASES

### Phase 3.1: Sneaker-Drop Glowing Slots
Add visual premium urgency to highly constrained slots in the Last-Minute page.

- `[MODIFY]` `app/[locale]/last-minute/page.tsx`
- `[MODIFY]` `components/SalonCard.tsx` (or specific slot component)

✅ **DO:** Apply `shadow-coral-glow` to cards ONLY when `slot.starts_at` is `< 24 hours` away.
❌ **DON'T:** Add glow to every single card, as it completely dilutes the luxury urgency.

> ⚠️ **BE CAREFUL:** `UI_RULES.md` demands the glow is subtle. Do not use raw red box-shadows. Rely strictly on the `shadow-coral-glow` token to match the brand.
- **Verification:** `npm run build` -> `git commit -m "phase 3.1: implement urgent coral glow for last-minute slots"`

### Phase 3.2: Floating Sticky Countdown
Inject a sleek, glassmorphic countdown timer for slots expiring in < 2 hours.

- `[NEW]` `components/ui/UrgentCountdown.tsx`
- `[MODIFY]` `app/[locale]/last-minute/page.tsx`

✅ **DO:** Utilize `backdrop-blur-glass` and a fixed/sticky header position (`z-overlay`) for the countdown.
❌ **DON'T:** Use large, intrusive red banners that break the luxury aesthetic.

> ⚠️ **BE CAREFUL:** Handle SSR hydration properly. The countdown must render safely without React hydration errors by wrapping the ticking state in a `useEffect` (or using client-only rendering).
- **Verification:** `npm run build` -> `git commit -m "phase 3.2: add floating glass countdown for expiring slots"`

## Execution Order
| Step | Type | What | Depends On |
|---|---|---|---|
| 1 | 🤖 | Glowing Urgent Slots | Nothing |
| 2 | 🤖 | Glassmorphic Countdown | Step 1 |
