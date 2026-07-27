# Loading / Empty / Error State Grammar

**Type:** Grammar doc (not a component). Defines the patterns; consumers compose them per-feature.
**Layer:** Layer 1 chrome (Skeleton + empty state surfaces) + Layer 3 semantic UI (error states use `s-error`, success use `s-success` per universal-color rule §1). Toast = Layer 3 (see Toast.md).
**SOURCE.md links:** [§10 Loading / empty / error / async state grammar](../SOURCE.md#§10--loading--empty--error--async-state-grammar) · [§11 Clickable Surface Contract](../SOURCE.md#§11--clickable-surface-contract) · [§19 Supabase async patterns](../SOURCE.md#§19--supabase-async-patterns)

---

## Purpose

This document defines **the four async UI states** every data-driven surface must handle:

1. **Loading** — data hasn't arrived yet.
2. **Empty** — request succeeded but returned no rows.
3. **Error** — request failed.
4. **Success** — data rendered.

Every list, feed, detail page, and form result must consciously handle all four. Skipping any is a contract violation per [§11](../SOURCE.md#§11--clickable-surface-contract) (specifically: the surface shows nothing or shows broken UI on edge cases).

This is not a single React component. It's a **grammar** — the visual patterns and copy register that all four states share, so the user feels the app is responsive even when it's not yet rendering data.

---

## Pattern 1: Loading skeleton

### When to use

- ANY surface fetching data on first render (homepage feeds, search results, salon detail, dashboard).
- Optimistic mutations don't show skeletons — the optimistic UI assumes success.

### Visual signature

Three skeleton elements compose every loading layout:

```
SkeletonCard (matches SalonCard footprint):
┌──────────────────────┐
│                      │  ← aspect-square gradient shimmer
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                      │
└──────────────────────┘
▓▓▓▓▓▓▓▓▓▓▓▓▓▓             ← single line, 60% width, shimmer
▓▓▓▓▓▓▓▓                   ← second line, 40% width, shimmer
```

### CSS pattern (canonical)

Uses the existing `.skeleton-shimmer` keyframe (defined in `app/globals.css`):

```tsx
<div className="aspect-square w-full rounded-[22px] bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken skeleton-shimmer" />
```

Or via Tailwind utility once `<Skeleton>` primitive is built (see [Q14](../QUESTIONS.md#q14)):

```tsx
<Skeleton aspect="square" rounded={22} />
<Skeleton width="60%" height={20} rounded={4} className="mt-2" />
<Skeleton width="40%" height={16} rounded={4} className="mt-1" />
```

### Motion

- Background-position `0% → 100%` infinite over `~1.5s ease-glide`.
- Respects `prefers-reduced-motion` — skeleton stays static gradient (no animation) when user opts out.

### Skeleton count

- Match expected real-data count. SalonCard horizontal-scroll feed shows ~3 visible skeletons (matches "2 cards + 20% peek" mobile pattern).
- Don't show 10 skeletons just because the data MIGHT be 10 — overshoot reads as "page is slow."

### Anti-pattern

- ❌ Spinner-only loading (a centered circle on white). Communicates "wait" but doesn't pre-render layout. Layout shift on data arrival = jank.
- ✅ Skeleton matches future layout. Real cards swap into the skeleton slots with no shift.

---

## Pattern 2: Empty state

### When to use

- Request succeeded but the result set is empty.
- Examples: user has no saved favourites, no recently viewed, search returned 0 hits, filter combination yielded nothing.

### Visual signature

```
              ┌────────┐
              │   icon  │      ← lucide icon (32-48px), text-s-ink-3
              └────────┘

         Headline copy here       ← Inter Tight 600, 18px, text-s-ink
       One-line explanation       ← Inter 14px, text-s-ink-2

       [   Primary action    ]    ← optional CTA, bg-s-ink, rounded-full
```

### Copy register

- **Headline:** factual, non-apologetic. "Noch keine Favoriten." NOT "Oh nein, du hast keine Favoriten 😢".
- **Explanation:** one line, names the FIRST action they could take. "Tippe auf das Herz, um Salons zu speichern."
- **CTA:** present only if there's ONE obvious next action (e.g. "Salons entdecken" → /search). If multiple paths, no CTA — let the surface's nav drive.

### Layout

- Centered vertically + horizontally in the available area.
- Min vertical padding: 96px above and below content (mobile) / 128px (desktop).
- For full-page empties (e.g. /favoriten with no saves), use full available height. For section-level empties (e.g. Recently Viewed inside homepage), hide the whole section instead — don't show empty inside a section header.

### Section-level empty rule

- If a homepage section has no items, the section component should `return null` from its render. Showing "Du hast noch keine X" inside a stack of feeds creates noise.
- Only the destination page (e.g. /favoriten) shows the empty state with copy.

### Anti-pattern

- ❌ "No data available" — bureaucratic register. Use product copy.
- ❌ A skeleton that never resolves — looks like loading is broken. Empty must be visually distinct from loading.

---

## Pattern 3: Error state

### When to use

- Request failed (network error, 500, RLS denial, rate limit).
- Surface can't proceed without the data.

### Visual signature

```
              ┌────────┐
              │   ⚠️    │      ← AlertCircle (lucide), 32-48px, text-s-ink-3
              └────────┘

      Etwas ist schiefgelaufen.   ← Inter Tight 600, 18px, text-s-ink
      [retry-specific explanation]
                                  ← Inter 14px, text-s-ink-2

       [    Nochmal versuchen   ]  ← Primary action: retry
       Hilfe →                     ← Secondary: navigate to /help
```

### Copy register

- **Headline:** "Etwas ist schiefgelaufen." (German default). Keep neutral — don't speculate about cause to the user.
- **Explanation:** ONE sentence describing what they can do. "Bitte versuche es nochmal oder lade die Seite neu."
- **Two actions max:** primary retry + secondary help link.

### Differentiation by error source (per §19)

| Error source | Pattern |
|---|---|
| Network timeout / 5xx | Generic error state, retry CTA. |
| RLS denial (403) | "Bitte melde dich an, um X zu sehen." + login link. Not an error per se. |
| Rate limit (429) | Toast: "Zu viele Versuche, versuche es in 60 Sek. nochmal." Don't unmount the surface. |
| Validation (400, user input) | Inline error on the offending field. Don't show full-page error state. |
| Realtime sync mismatch | Toast: "Daten wurden aktualisiert." + auto-refresh after 3s. |

### Logging

ALWAYS log errors with the component prefix per CLAUDE.md error-handling rule:

```ts
catch (err) {
  console.error("[ComponentName] description:", err);
  setError(true);  // trigger error UI
}
```

Never `.catch(() => {})`.

### Anti-pattern

- ❌ Showing a console-error stack trace to the user.
- ❌ Disappearing the section with no replacement on error (user sees a blank space — looks like they did something wrong).
- ❌ Auto-retrying forever — quietly loops on an unrecoverable error.

---

## Pattern 4: Optimistic / mutation states

### When to use

- User triggers an action that mutates data (save heart, submit search, book appointment).
- The UI should respond INSTANTLY, then either confirm or roll back.

### Pattern: assume success

1. User taps save heart.
2. **Immediately:** local state flips to "saved." Animation plays. Aria-live announces. (V3-D103 motion).
3. **In background:** fire `/api/favorites/toggle`.
4. **On success:** no further UI change. The optimistic state IS correct.
5. **On failure:** ROLLBACK local state. Show toast: "Speichern fehlgeschlagen."

### Pattern: confirmation toast

For destructive or important mutations (delete account, cancel booking), confirm via toast:

```ts
toast.success("Termin abgesagt.");
toast.error("Konnte nicht abgesagt werden.", { action: { label: "Nochmal", onClick: retry } });
```

(Toast component TBD per [Q12](../QUESTIONS.md#q12).)

### Loading inside mutation

If the mutation takes >300ms (rare for our scale), show a loading state on the trigger button:

```tsx
<button disabled={isPending}>
  {isPending ? <Spinner size={14} /> : <Heart />}
</button>
```

Spinner = `lucide-react` `Loader2` with `animate-spin`.

### Anti-pattern

- ❌ Spinning the WHOLE page on a single-item mutation. Spin the trigger only.
- ❌ Showing a confirmation toast on every save heart. The animation IS the confirmation.

---

## Pattern 5: Stale / refreshing

### When to use

- Surface has old data and is fetching new (e.g. user pulls-to-refresh, or background refetch on stale time expiry).

### Visual signature

- Old data stays visible at 100% opacity.
- A thin progress bar (h-0.5) at top of section, animating left-to-right.
- OR no visual indicator if refetch is <500ms — let it complete silently.

### Anti-pattern

- ❌ Replacing rendered data with skeletons during refetch — user loses context.
- ❌ Showing "Refreshing..." text — interrupts reading.

---

## Pattern 6: Live reorder (motion-08 added 2026-07-27)

### When to use

- An already-rendered list's ORDER changes while the surface is visible, with no error and no
  refetch cycle: a live queue position update (walk-in tracker), a re-sort after a background
  price/availability change, a realtime rank change on a sortable browse surface. This is a
  distinct trigger from Pattern 5 (the whole surface's DATA is stale) and from a realtime
  conflict (something is now wrong, handled by the toast + auto-refresh error path below). The
  same, still-valid data just moved: neither staleness nor an error, so it gets neither pattern.

### Visual signature

- Measure each item's OLD position, then let it animate (transform only, never width/height/top)
  to its NEW position over the **snap** tier (150ms, THE SPEED LAW: an in-place state change).
- The row itself never unmounts and remounts. No skeleton, no re-render flash, no silent
  teleport to the new slot.
- A row's own content (e.g. the number inside it) still uses the existing motion-22 "Live
  position/number updates" departure-board flip (`.animate-num-flip`) for the VALUE changing;
  this pattern is about the row's DOM POSITION relative to its siblings, a different problem.
- In framer-motion terms: give the list's items a `layout` prop (or `layoutId` if items can
  cross container boundaries) so the library computes the FLIP transform itself, rather than a
  raw re-render that snaps every row to its new slot with no transition.

### Anti-pattern

- ❌ A silent instant reflow (rows just appear in their new slots with no transition), reads as
  a rendering glitch.
- ❌ A full list re-render/remount on every rank change, reads as data loss.
- ❌ Routing a legitimate reorder through the realtime-mismatch error path (toast + 3s
  auto-refresh) when nothing is actually wrong. That path is for a genuine conflict, not for
  data that is simply now in a new order.

---

## Composition: full async surface

A page that does it right:

```tsx
function MyFeed() {
  const { data, isLoading, error, isFetching } = useFeed();

  // Pattern 3: Error — replace surface
  if (error) return <ErrorState onRetry={refetch} />;

  // Pattern 1: Loading — skeleton matching expected layout
  if (isLoading) return <FeedSkeleton count={3} />;

  // Pattern 2: Empty — replace surface OR hide section
  if (!data.length) {
    return isFullPage ? <EmptyState /> : null;
  }

  // Pattern 4 / 5: Success (with optional refetch indicator)
  return (
    <>
      {isFetching && <RefreshBar />}
      <FeedList items={data} />
    </>
  );
}
```

---

## Do / Don't

### Do

- Match skeleton layout to final layout (no shift).
- Use product-tone copy ("Noch keine Favoriten") not bureaucratic ("No data available").
- Log errors with component prefix.
- Optimistic UI for mutations where rollback is cheap (heart save, filter toggle).
- Confirmation toast for mutations where rollback is expensive (booking, payment).

### Don't

- Don't ship a page without all four state handlers wired.
- Don't auto-retry on errors that aren't transient.
- Don't show empty state inside a horizontal feed — `return null` from the section.
- Don't use spinners as the only loading affordance. Skeleton first; spinner only inside buttons.
- Don't blur the dim backdrop on overlays (mobile perf, V2-D41-fu pattern).

---

## Provenance

- **CLAUDE.md error-handling rule** — `console.error("[Component] description:", err)` mandatory; never `.catch(() => {})`.
- **§10 SOURCE.md** — locked grammar with cross-references to §11 + §19.
- **V3-D173** spirit — "don't compete with the heart for attention" applies to all empty/error UI too. Be quiet, be clear.

---

## Open questions feeding this doc

- [Q12](../QUESTIONS.md#q12) — Toast component implementation status (path/skeleton).
- [Q14](../QUESTIONS.md#q14) — Skeleton shimmer utility + `<Skeleton>` primitive component.
- [Q11](../QUESTIONS.md#q11) — SaveHeart backend wiring (optimistic UI assumes success but backend is local-only today).

---

## Related

- **SOURCE.md §10** — primary canonical grammar.
- **SOURCE.md §11** — Clickable Surface Contract option D (Coming Soon affordance) is adjacent.
- **SOURCE.md §19** — Supabase-specific async patterns (RLS, rate limits, realtime).
- **HeartButton** — example of pattern 4 (optimistic save).
- **Toast** primitive (forthcoming) — used by error + Coming Soon affordances.
