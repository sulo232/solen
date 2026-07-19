<!-- batch: full frontend sweep , audit every surface vs the new design system, mockup improvements (multi-direction), fix gaps/inconsistencies. Owner 2026-07-19, LOOP till done. -->
# Frontend sweep , every surface vs the design system (LOOP)

Owner 2026-07-19: "go look into every frontend in solen and see improvements cz of all the new principles n design system. if we can have multiple direction make few mockups too for that page. every gap and inconsistency we need to fix it." LOOP till done.

## Process per surface (the loop body)
1. AUDIT , score the surface vs LOCKFILE + TASTE_LOG + RATIONALE + the 10 taste rules + COMPONENT_REGISTRY. List: token drift, missing/hand-rolled states, cross-surface inconsistency, copy issues, real improvement opportunities. (code-level via workflow agents; visual via my own render)
2. FIX-NOW , clear mechanical inconsistencies (token drift, wrong radius/shadow family, retired tokens, hand-rolled where a primitive exists, missing states) get fixed directly (no mockup needed , they're objective).
3. MOCKUP , genuine design/taste improvements get a copy-of-real-page mockup; where multiple directions are viable, 2-3 side by side. Delivered as a served page (gallery index). Owner approves per surface, THEN apply.
4. VERIFY , render + measure; commit each surface.

## Tiering (132 customer routes; dashboards are a separate DS = last)
- **Tier 1 , core customer journey (auditing now):** homepage `[city]` · search results `[city]/[category]` + `/search` · salon PDP `salon/[slug]` · booking flow (ServicesStaffStep/StaffStep/DateTimeStep/HairStep/PayConfirmStep) · inspo feed `/inspo` (+ `/inspo/nails`) · profile hub `/profile` (+ `/profile/haarprofil`) · walk-in `/walk-in-join`+`/walk-in-pay`+`/queue/[token]` · reviews `salon/[slug]/reviews` · confirmation · auth `/auth/*` · onboarding.
- **Tier 2 , secondary customer:** account, notifications, termine, vouchers/gift-cards, rewards/loyalty, referral, favorites, looks, recently-viewed, nail-tech, brand, behandlungen, tip, booking-lookup.
- **Tier 3 , marketing/legal/info:** fuer-salons, warum-solen, ueber-uns, business, blog, help(+slug), karriere, presse, kontakt, agb/impressum/datenschutz/privacy/terms/sicherheit, coming-soon.
- **Tier 4 , dashboard/admin (owner-facing, LOCKFILE §12 DS):** ~55 dashboard/* routes , last, and only against the dashboard DS.

## Status
- [ ] Tier 1 audit , RUNNING (workflow, 2026-07-19).
- [ ] Tier 1 fix-now + mockups
- [ ] Tier 2 / 3 / 4

## Log
- 2026-07-19: sweep started. Tiered 132 routes. Tier-1 design audit launched (parallel read-only agents vs LOCKFILE/TASTE_LOG/RATIONALE).
