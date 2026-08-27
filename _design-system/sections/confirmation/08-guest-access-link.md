<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md pattern 8 and its components
     table, which records this block as "genuinely Solen-specific and correct": nothing in the
     49-app corpus does it, because a guest-checkout re-entry problem is one the corpus does not
     face. `npm run exists confirmation` returns 10 hits; nothing new is proposed here. -->

# Guest access link , section spec

**Reference:** none. **This block was not measured.** The measured booking has a `user_id`, so `isGuest` was false and it never rendered. `statesThatCouldNotBeMeasured.guestVariant` in `_design-system/sections/_measured/confirmation.json` records that. Every value below is read from source on 2026-08-27.
**Component:** `components-legacy/booking/BookingConfirmation.tsx:603-627`
**Layer:** 1 chrome, with a layer 3 semantic tick on the copied state

## Layout

```
  +---------------------------------------------------+  radius 16, hairline, shadow-float
  |  (key 15)  <save this link>                       |  13 ink-2
  |  +---------------------------------------+ +----+ |
  |  | https://solen.ch/...?t=...            | | [] | |  44px row, radius 12, sunken
  |  +---------------------------------------+ +----+ |
  +---------------------------------------------------+
```

A card holding one explanatory line and one copyable field.

## Measured

Nothing. Source-declared values, for whoever measures it next:

| item | source value | line |
|---|---|---|
| card | `mt-4 rounded-card border border-s-border bg-s-bg-surface p-3.5 shadow-float` | `:604` |
| explainer row | `flex items-center gap-2 text-[13px] text-s-ink-2`, `KeyRound size={15} strokeWidth={1.9} text-s-ink` | `:605-607` |
| link field | `mt-2.5 flex h-[44px] items-center gap-2 rounded-[12px] border border-s-border bg-s-bg-sunken pl-3 pr-1.5` | `:609` |
| the URL | `flex-1 truncate font-mono-code text-[13px] text-s-ink-2`, which renders Inter Tight tabular, not a monospace face | `:610-612` |
| copy button | `grid h-11 w-11 shrink-0 place-items-center rounded-[9px] border border-s-border bg-s-bg-surface`, `Copy` then `Check` at 16px | `:613-624` |
| copied state | the button's text colour flips to `text-s-success` for 1400ms, then reverts | `:344-353`, `:620` |

## Tokens

Three radii inside one block: 16 on the card, 12 on the field, **9 on the copy button**. The 9 is not a value the locked radius table contains anywhere. Source, not rendered.

## Interaction

- Tapping the copy button writes the access link to the clipboard through `navigator.clipboard`, marks `copiedLink` true for 1400ms and swaps the `Copy` glyph for a green `Check`. A clipboard failure is logged and **the tick still shows**, deliberately (`:345-352`), so the user is never left staring at a button that appears not to have worked.
- The same URL is also the destination of the "Buchung verwalten" link in `07` when the viewer is a guest.
- **A guest's ability to cancel or reschedule depends on a silent exchange that runs behind this block.** On mount, a guest posts their reference code and access token to `GET /api/bookings/guest-lookup`, which sets the httpOnly `solen_guest_access` cookie that both sheets authorize against (`:194-212`). `canManage` waits on that exchange's own success signal rather than on `!isGuest`, so the destructive affordances never appear before the cookie that would authorize them exists.

## Against the floors

Not gradeable: nothing rendered. Three things are checkable without rendering:

- **Touch target: PASS.** The copy button is `h-11 w-11`.
- **Locked radius: FAIL.** 9px on the copy button. The table's values are 16 card, 24 grouped list card, 12 input, 99 or 9999 pill, 28 sheet. There is no 9.
- **`shadow-float` on a light card**, which is a fourth elevation token in this one screen after `shadow-elevation-2` on the two cards and the flat buttons. Whether that reads as a tier or as drift needs a render.

## Intentional deviations

- **Nothing in the 49-app corpus does this.** The corpus's nearest pattern is the "check your email" reassurance line, in 16 of 49, which it rejects for a logged-in path as padding and keeps for a guest. Solen ships something stronger than a sentence: the actual re-entry URL, copyable. The corpus files it as Solen-specific and correct, and says not to add the email sentence on top of it.
- **De-emphasised on purpose.** It is grey, small and below the actions, because it matters only to the minority of viewers who are guests.

## Empty state

- **Logged-in booking, MEASURED as absent:** `props.isGuest` is false and the whole block is dropped. That is the state this pass measured.
- **Guest with no `accessLink`:** the block is dropped too (`:603` requires both), which would leave a guest with no way back into their booking. Not measured, and it is worth naming: the block is the guest's only re-entry.

## Provenance

- `CORPUS.md` pattern 8 and its components table , Solen-specific, correct, do not add the email sentence on top
- Checklist item 9 , the silent guest cookie exchange, so the manage sheets never appear before they can authorize
