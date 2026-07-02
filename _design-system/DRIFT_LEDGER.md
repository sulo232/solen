<!-- exists-check: net-new vs REMOVED.md (that graveyard = DELETED/rejected things; this ledger = RE-INVENTED structure) + scripts/removed.mjs. Different purpose, checked both. -->

# 🧭 Drift Ledger , re-invented / regressed UI structure (owner-flagged recurrences)

Like `REMOVED.md` (the graveyard for DELETED things), but for **RE-INVENTION**: cases where I rebuilt
a structure that already had an approved version. Fed on every recurrence. A UserPromptSubmit hook
(`~/.claude/hooks/drift-ledger-inject.py`) matches each entry's `keywords:` line against the incoming
prompt and INJECTS the entry, so the next relevant turn is forced to see it (same mechanism as the
binary-triggers table + REMOVED graveyard). Format: one `##` block per drift; the `keywords:` line is
machine-matched. Feed a new entry whenever the owner flags "you rebuilt/re-invented X again."

## 2026-07-02 , map salon card re-invented (compact thumbnail instead of the approved feed card)
- existing (REUSE THIS): `app/[locale]/dev/map-full/page.tsx` StoreCard + the real `app/[locale]/_components/search/SalonResultCard.tsx` variant="feed" , BORDERLESS: full-width `aspect-[3/2]` photo + heart + dots + name + inline star + "distance, address" + "category, N reviews" + up-to-3 service rows + "View N services".
- invented instead (WRONG): a compact 76x100 horizontal thumbnail card, no `aspect-[3/2]`, no service rows (in /dev/map-behavior list / not-selected state).
- owner: "on the normal not selected state that isnt what we have, you keep making up structure over and over."
- fix rule: on ANY map/search salon card, REUSE SalonResultCard or copy the map-full StoreCard structure verbatim. Enforced by `no-invented-ui-gate.py` (structural: requires the canonical signature or an import, not a comment).
- keywords: salon card, result card, feed card, bottom sheet, list card, map-behavior, map-single, map-full, salon list, store card, map sheet
