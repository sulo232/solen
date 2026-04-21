# 🔍 Search Bar Rules — MOVED

> **This file has been merged into [`_rules/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) §15 on 2026-04-21.**
>
> The full search bar hierarchy, category scoping rules (S-1 to S-3), date picker rules (S-4, S-5), AI search two-tier approach (S-6 to S-8), and API security matrix now live in `DESIGN_SYSTEM.md` §15.
>
> This stub remains so agents grepping for `search-bar-rules.md` can find the redirect.

## Quick reference

| Rule | Where it lives now |
|---|---|
| Search bar hierarchy (`HomeSearchBar` vs `FilterBar → SearchAutocomplete`) | `DESIGN_SYSTEM.md` §15.1 |
| S-1 Category-scoped search on subpages | §15.2 |
| S-2 Cross-category redirect suggestion (never show wrong results) | §15.2 |
| S-3 Homepage search unscoped + Gemini auto-detect | §15.2 |
| S-4 Date picker must have quick chips + calendar | §15.3 |
| S-5 Unavailable salons: grey overlay + "Nächster Termin", never hide | §15.3 |
| S-6 Two-tier results: instant ILIKE + AI smart | §15.4 |
| S-7 Embedding generation admin-only, batched | §15.4 |
| S-8 Gemini failure: empty results, never 500 | §15.4 |
| API security matrix (auth, rate limits, validation) | §15.5 |

## Component ownership

| Component | Owner |
|---|---|
| `HomeSearchBar.tsx` | Dev 2 (customer frontend) |
| `FilterBar.tsx` | Dev 2 (customer frontend) |
| `SearchAutocomplete.tsx` | Dev 2 (customer frontend) |
| `SalonCard.tsx` | Dev 2 (customer frontend) |
| `app/api/search/*` | Dev 1 (backend) |
| `lib/search/*` | Dev 1 (backend) |
| `search_embeddings` table | Dev 1 (infra) |

## Where to look now

→ **[`_rules/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)** §15.
