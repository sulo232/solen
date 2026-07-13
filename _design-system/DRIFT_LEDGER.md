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

## 2026-07-02 , map live-list: built a BUTTON (council rec) over the owner's repeated "auto-update on zoom"
- what the owner asked (REPEATEDLY): the map bottom sheet must AUTO-update to the VISIBLE viewport as you zoom/pan , zoom into an EMPTY area -> sheet EMPTY; zoom to a place with stores -> THOSE stores, never random far-away ones. No manual button.
- what I built instead (WRONG): a "In diesem Bereich suchen" BUTTON (the design council's rec), and I verified the MECHANISM (API bounds call fires) not the owner's DESCRIBED scenario (zoom-to-empty -> empty). It "passed" the verifier while failing the owner's actual use.
- owner: "why is it still the same problem over and over, i told you to fix the map function... is it the subagents or you not prompting them good?"
- fix rule: (1) the owner's LITERAL repeated ask OVERRIDES a council/subagent recommendation , when they conflict, do what the owner said and flag the council disagreement. (2) VERIFY THE OWNER'S EXACT DESCRIBED SCENARIO (reproduce zoom-into-empty -> sheet-empty), not a proxy mechanism. (3) Don't redesign an already-approved element (the search-this-area pill / the map bar).
- keywords: map, live list, search this area, zoom, viewport, bounds, auto update, in diesem bereich, map sheet, map function, empty area

## 2026-07-03 , search-model-b mockup INVENTED a search bar (not the real one)
- existing (REUSE THIS): the REAL category-page top in `app/[locale]/_components/search/SearchTemplate.tsx`: header (home icon-btn + city selector + burger), the LARGE category pills row (3D icons, gray-sunken active), the 67px TWO-LINE search bar (`rounded-pill border-s-border bg-white px-3.5`, "Suchen"/subline + map icon-btn inside right), then the filter-pill row. Measured live 380x67 at 412px.
- invented instead (WRONG): a "Category" label + small segmented 4-tab control + a generic single-line search field , nothing like the real anatomy.
- owner: "what the fuck is wrong with your search bar? that shit is not what we have."
- fix rule: ANY mockup of the search/category page MUST copy the real SearchTemplate top verbatim (extract the real JSX; screenshot the real /de/coiffeur as reference). Model-B deltas are BEHAVIORAL (param separation), not a new bar.
- keywords: search bar, suchleiste, category page, model b, composer, segmented, suchen, schweizweit, category pills, search template

## 2026-07-13 , decision mockups built as isolated A/B component panels (owner: "makes no sense")
- existing (USE THIS FORMAT): mockup = a preview of the WHOLE real page with only the treatment applied (the real route's full chrome: header, content, footer), variant-switchable (?v=), hardcoded copy ALWAYS ENGLISH (corrected 2026-07-13 second message: the first message's "always in german" was a mis-dictation, owner: "i told you mockups always always in english"; real i18n components exempt, link /en/). The owner reacts to pages, not swatch boards.
- invented instead (WRONG): /dev/decision-* routes showing the component cropped into labeled A/B panels on a bare page (glass button on a photo box, two bells in cards, two isolated result cards).
- owner: "those mockup makes no sence and there should be a hook abt saying maiking the mockup a preview of the whole page and also always in german" (2026-07-13).
- fix rule: every mockup file declares `Mockup-scope: whole-page`, imports the real page components, ENGLISH hardcoded copy. Enforced by the mockup-format gate (.claude/hooks/mockup-english-gate.py, 2026-07-13 final: English reaffirmed + whole-page declaration + real import required).
- keywords: mockup, decision, a/b, panel, vergleich, preview, variante, entscheidung, swatch, side-by-side
