# Discovery / Entdecken , Full Audit (2026-06-13)

> Owner brief: "go section by section, make mockups (lots of variation). But FIRST a big audit, pass it through council, THEN section-by-section mockups , because you don't even know what exists and what doesn't."
>
> Method: live exists-scan (`npm run exists`) + live Supabase queries + 4 parallel deep-dive agents (frontend cohesion / backend+upload / AI+match / TikTok legal). Every verdict below is backed by `file:line` or a live-DB count, not memory.
>
> Status of the NO-TOUCH lock: `/entdecken` page + the home discovery section were owner-locked NO-TOUCH (graveyard: "discovery entdecken redesign"). Owner reopened the whole feature by name on 2026-06-13 for this redesign. Lock lifted for this work, on the record.

---

## 0. TL;DR , the brutal truth

**The Pinterest gallery structure already exists and the feed surface is mostly clean. The problems are: (1) the front end is two design eras stitched together and the detail page is the rot, (2) the whole thing runs on 18 rows of TikTok content and almost every way to add more is broken, (3) the headline "Gemini finds the right salon" is fake, and (4) the TikTok attribution that's supposed to keep us legal is under-implemented, not over-implemented.**

Five numbers that frame everything:
- `discovery_items` = **18 rows** (all TikTok). `discovery_boards` = 3. Everything social (`saves`, `likes`, `collections`, `comments`, `interactions`, `products`) = **0 rows, forever so far**.
- **0 of 18** items have `owner_salon_id` set , so every "this look belongs to a bookable salon" feature renders on nothing.
- **0 of 18** items have `author_url` , so there is no creator-profile link anywhere, on any surface.
- **1** content-ingest path actually works (admin manual single-file upload). The TikTok importer, bulk-import, smart-import, and the user "New Post" button are all **broken against the live schema**.
- **30** banned uppercase-tracked eyebrows across the legacy components , the single biggest "this looks beta" tell.

This is NOT a "rebuild discovery from scratch" situation. The bones are good. It's a cohesion sweep + a detail-page rebuild + a real content/upload pipeline + an honest decision about the booking link.

---

## 1. What exists vs what doesn't (master inventory)

### Routes (9)
`/discover` (feed) · `/discover/[id]` (look detail) · `/discover/board/[id]` · `/discover/saved` · `/discover/saved/[id]` · `/discover/nails` (redirect) · `/entdecken` + aliases (re-export) · `/dashboard/discovery-admin` · `/dashboard/discovery-posts` · `/terms/discovery`. Home section: `app/[locale]/_components/homepage/Entdecken.tsx`.

### API (35 endpoints) , wired vs broken
| Endpoint | Verdict |
|---|---|
| `discovery/feed` + `discovery_feed` RPC | **WIRED** , works, gender soft-bias real but inert |
| `discovery/feed` search → `search_discovery` (FTS, GIN) | **WIRED** , real full-text, discriminating |
| `discovery/thumb/[id]` (TikTok oEmbed proxy) | **WIRED** , but caches+re-serves TikTok bytes (legal risk, §5) |
| `discovery/{boards,boards/[id],chip-terms,trending,style-suggest,style-names,similar,recent-searches}` | **WIRED** , real SQL/heuristic, no AI |
| `discovery/{save,save/sync,saves,like,collections*,comments}` | **WIRED** (work via DEFINER RPCs) but **0 rows ever** |
| `discovery/interactions` | **DEAD** , writes `interaction_type`, live column is `action`; fire-and-forget, error swallowed (silent no-op) |
| `discovery/salons-for-style` | **STUB + ORPHAN** , naive category-equality, ignores the style param, **zero callers** |
| `discovery/post` (user "New Post") | **DEAD** , 3 independent failures (§3) |
| `nail-discovery/publish` | DB-valid but **orphaned** (no UI path) |
| `admin/discovery/upload` | **WIRED** , the ONE working ingest path |
| `admin/discovery/{import-tiktok,bulk-import}` | **DEAD** , write `content_type:'inspo'` (CHECK violation) + `uploaded_by` (column doesn't exist) |
| `admin/discovery/smart-import` | **PARTIAL** , search works, import half dead (same two killers) |
| `admin/discovery/{staging,analyze,moderation,backfill,search-stock,check-ai}` | **WIRED** but staging is starved (importers don't feed it); `backfill` is what produced the 18 clean rows |

### DB (12 tables) , populated vs empty-forever
| Table | Rows | Note |
|---|---|---|
| `discovery_items` | 18 | all `content_type='tiktok'`, 0 salon, 0 user. 59 columns; **no `uploaded_by`** (3 routes assume it). |
| `discovery_boards` | 3 | seeded; covers derived live via search. Works. |
| `discovery_staging` | 3 | fed only by nail AI-gen; stock/TikTok importers never reach it. Stranded. |
| `discovery_search_events` | 24 | written by feed search. Live + working (drives trending). |
| `discovery_board_pins` | 0 | no writer , empty-forever (boards derive covers by search instead) |
| `discovery_{saves,likes,collections,comments}` | 0 | wired, unused |
| `discovery_interactions` | 0 | **broken writer** (`interaction_type` vs `action`) → empty-forever until fixed |
| `discovery_products` + `discovery_product_recommendations` | 0 | **no writer anywhere** , empty-forever placeholder; `ProductRecommendations.tsx` reads them |

### RPCs (real, SECURITY DEFINER where needed)
`discovery_feed`, `search_discovery` / `discovery_fts_doc`, `discovery_style_suggest`, `discovery_trending_terms`, `discovery_chip_terms`, `discovery_recent_searches`, `discovery_resolve_thumb`, `toggle_discovery_save`, `toggle_discovery_like`.

### Reusable upload primitives (exist, NOT wired to discovery)
`components-legacy/ui/ImageUpload.tsx`, `ImageUploader.tsx`, `components-legacy/nail/InspoUploader.tsx`, `dashboard/coiffeur/FormulaPhotoUpload.tsx`.

---

## 2. Front-end cohesion (section by section)

The tree is **two eras stitched together**: the feed surface was rebuilt 2026-05/06 and is mostly clean; the detail page + its 11 sub-cards + onboarding are pre-B&W-pivot legacy that never got swept. Owner's "beta-grade, not cohesive" read is accurate and **concentrated on the detail page**.

| Surface | State | Headline issue |
|---|---|---|
| Feed page `discover/page.tsx` | BETA | texture chip selected = `bg-s-ink` ink-fill (violates locked filter-pill = blue-border-no-fill, V3-D450); two chip shapes in one row |
| `ItemCard` / `VideoCard` | **POLISHED** | the reference card grammar; everything else should match it |
| `MasonryGrid` | **POLISHED** | clean |
| Look detail `DetailPage.tsx` | **INCOHERENT (worst)** | hardcoded `rounded-[16px]`, opacity text ladders `/30 /40 /80`, 3rd chip recipe |
| Detail sub-cards (Description/BookCTA/SalonScript/Products) | **INCOHERENT + STALE** | TWO competing card surfaces for one role; `text-violet-400` off-palette; English-only labels in a 4-locale app; `shadow-warm-sm` stale warm shadow; uppercase CTA |
| Board detail `board/[id]` | BETA | uppercase eyebrow; full-bleed hero grammar matches nothing else |
| Saved/collections | BETA | 3 different page-title sizes across sub-pages |
| Homepage `Entdecken.tsx` | BETA (LOCKED) | uses a **different heart** (`HeartButton`) than the feed (`LikeButton`); genre-shift vs destination |
| Pills/filters (Category/Tab/AISuggestion/InlinePrefs/ProfileSetup) | **INCOHERENT** | every selected pill = ink-fill (lock violation ×4); uppercase eyebrows; mixed radii |
| Search dropdown (SearchBar/Autocomplete/Recent) | BETA | **5 different eyebrow recipes**; opacity greys |
| ForYouSection | STALE | 3 radii in one component; yet another card grammar |
| Empty/loading/error states | **BROKEN** | `DiscoveryGridSkeleton` and `DiscoveryErrorState` both `return <div/>` (empty stubs); `loading.tsx` skeleton doesn't shape-match the masonry |

**Card grammar diverges:** radius named 3 ways (`rounded-2xl` / `rounded-[16px]` / `rounded-card`, all 16px), 3+ chip styles (white-on-photo / ink-fill / `bg-s-ink/5`), 5 eyebrow recipes, **2 heart components**, no shared meta recipe between feed (ink-2 12px) and detail (opacity ladder).

**Top 10 defects ranked by how much they cheapen the page:**
1. Empty-stub loading + error states (blank flash on every load, nothing on failure) , reads broken, not beta.
2. 30 uppercase-tracked eyebrows (the dominant "old" tell).
3. DescriptionCard English-only labels rendering untranslated in de/fr/it.
4. `text-violet-400` stray purple in a strict B&W+blue system.
5. Filter-pill lock violation (ink-fill instead of blue-border) ×4.
6. Two detail-card surface recipes for one role.
7. Opacity text ladders (`/30 /40 /70 /80`) → drifting muddy greys.
8. `shadow-warm-sm/md` stale warm shadows (pre-cool-pivot).
9. Two heart components (LikeButton vs HeartButton).
10. `loading.tsx` skeleton wrong shape → page jumps on hydration.

**Pinterest gaps:** no save-to-board from a feed tile (Pinterest's core gesture; the `SaveToBoardSheet` exists but isn't reachable from a tile), no hover quick-actions, inconsistent selected-state language.

Good news: **no** `s-coral` / `dark:` / `s-brand` stale color tokens and **no** dead clicks (`href="#"`, `onClick={()=>{}}`) in discovery. The rot is treatment-level, not dead-wiring.

---

## 3. Backend + upload pipeline

**Correction to assumptions:** RLS is **ON** on every discovery table (live query), but the migration-067 policy sets were **stripped** during the schema-drift cleanup , most tables have 0-2 policies; `discovery_items` has a single SELECT-only policy. So the risk is the inverse of "open door": **logged-in users and salons literally cannot write through the normal client** (only service-role / DEFINER RPCs function). (Note: the `npm run exists` snapshot labels these "RLS OFF" , the snapshot is stale vs the live DB; reverify before relying on either. Practical effect + the security item stand regardless.)

**The user "New Post" button is dead at 3 layers** (`discovery/post` + `PostFromDiscover.tsx`):
1. writes `content_type:'user_post'` → violates live CHECK `('curated','tiktok','salon','user')`;
2. TikTok mode sends `media_type:'video'` → violates CHECK `('photo','tiktok')`;
3. insert uses the user-context client but `discovery_items` has no INSERT policy → RLS blocks it.
Plus the photo path is half-built: the file `<input>` is never read, `discoveryPostSchema` has no `image_url`, so a photo post would write a NULL image (blank card).

**Salon-portfolio → discovery: MISSING entirely.** `PROOF_SALON_ITEMS` (`discover/page.tsx:32-44`) is a hardcoded picsum, frontend-only mock (self-documented "NO DB / NO sync"). The salon gallery (`salons.gallery_urls` + `salon-gallery` bucket) is **completely isolated** from `discovery_items` , `dashboard/gallery` has zero discovery references. The only DB-valid salon write is `nail-discovery/publish` (one nail design at a time, nail-only, no UI). `owner_salon_id` populated = 0.

**The upload story today (verbatim from the backend audit):** essentially one path works and it's admin-manual , `POST /api/admin/discovery/upload` (admin drags a single image, WebP'd to the `discovery-images` bucket, inserted `content_type:'curated'`). Everything else is broken against the live schema. The 18 TikTok items predate that drift (normalized by `backfill`). Users can't post; salons can't push portfolios at all.

**Missing for salons + users to upload at scale:** (1) schema/code reconcile (drop/define `uploaded_by`; fix `content_type` inspo→curated/tiktok + user_post→user; fix `media_type` video→tiktok/photo; fix `interactions.interaction_type`→`action`); (2) restore RLS INSERT policies (`owner_user_id = auth.uid()` / salon owners); (3) real user photo upload (reuse `ImageUpload`/`ImageUploader`, add `image_url`, route through `discovery_staging` for moderation); (4) a salon-portfolio→discovery sync (opted-in `gallery_urls` → `content_type:'salon'`, `owner_salon_id`-tagged); (5) feed the staging queue from the importers + fix interaction logging so `view_count`/personalization signals accumulate.

---

## 4. AI / Gemini / matching

| Capability | Verdict |
|---|---|
| **AI vision analysis** (`lib/ai-vision.ts`, Gemini 2.5-flash) | **WORKS** , the one real "Gemini stuff." Rich JSON (style, tags, per-texture advice, 4-locale descriptions, salon script, products, price). 3 entry points (on-demand SSR on first view, admin backfill, admin import). All 18 items populated by it. |
| **Feed search** (`search_discovery` FTS) | **WORKS** , real Postgres full-text, GIN-indexed, ranked. |
| **style-suggest / trending / chip-terms / similar / style-names** | **WORK** , honest frequency/overlap SQL. No AI, but they discriminate. |
| **Semantic embeddings for discovery** | **MISSING** , `gemini-embedding-001` (768d) works but only embeds **services/salons**. Discovery items are never embedded; no vector column on `discovery_items`. |
| **Look → salon matching ("find the right salon")** | **FAKE / COSMETIC** , `salons-for-style` is a naive category-equality stub that ignores the style and has **zero callers**. `BookCTA` is a cosmetic deep-link dumping the style name into generic category search. `PickStylistFlow` is real but gated on `owner_salon_id` (0/18) so it never renders. |

**The match story:** vision analysis is genuinely good and operating; search is real FTS; trending/chips are honest SQL. The headline "**Gemini auto-finds the right salon**" does not exist. To make "see a look → get the right salon" real you need three things that are all absent today: populate `owner_salon_id` (or a look↔service/tag map), embed discovery items into the existing 768d vector store, and replace `salons-for-style` with a tag/service/semantic match.

---

## 5. TikTok legal + content sourcing

**Owner's framing is right (keep attribution) but the implementation under-attributes, and a separate part of the code actively works against compliance.**

All 18 live items are `source='tiktok'`. Findings:
- **`author_url` = 0/18** , no creator-profile link is ever captured at import, so none can be shown.
- **`formatCreator` silently hides junk-symbol creators** (`format.ts:32-39`): names < 2 chars or with no letter return `null`. Items like `author_name='☆'` render with **no creator credit at all**.
- **Feed cards link back to nothing** , creator is plain text, card click goes to the internal detail page. Only the detail page has a real link back (`tiktok_url` via "Auf TikTok ansehen").
- **The AI overwrites TikTok's own title/caption** with Solen-generated `style_name` + tags + 4-locale descriptions and re-frames the still as a Solen "Discover" item , this cuts against "don't materially modify," and it is the opposite of preserving attribution. (The burned-in pixels in the image stay; it's the *text metadata* that gets replaced.)
- **Thumbnail bytes are persisted + memory-cached + re-served from Solen's own origin** (`/api/discovery/thumb`) , reads closer to re-hosting than live embedding.

**Compliance scorecard** (reasoned from code behavior; confirm exact obligations against TikTok's current Developer/Display terms):

| Requirement | Verdict |
|---|---|
| Attribute the creator (name/handle) | **PARTIAL** , hidden for junk names, never a creator link |
| Link back to the original video | **PARTIAL** , detail page only; feed cards none |
| Don't materially modify content | **RISK** , AI overwrites TikTok title/caption with Solen copy |
| Don't store/re-host thumbnails beyond allowance | **RISK** , bytes persisted + cached + re-served from Solen origin |
| Honor takedowns / deletions | **PARTIAL** , manual admin archive only, no auto-detection |
| Use official embed (no screenshots) | **MOSTLY COMPLY** , oEmbed + official iframe, but defaults to re-hosted still |
| Stock photo attribution (Unsplash/Pexels/Pixabay) | **PARTIAL (latent)** , paths unused live; `author_url` + Unsplash download-trigger dropped on import |
| `PROOF_SALON_ITEMS` picsum placeholder | **RISK** , placeholder images attributed to named real salons, live in code |

**Sourcing inventory:** only `tiktok` is populated. Stock paths (unsplash/pexels/pixabay via `search-stock`/`bulk-import`/`smart-import`) are wired but unused and drop `author_url` + the `source` column on insert (provenance lost even if used). `salon`/`user` enum values: 0 rows.

---

## 6. Cross-cutting , the 3 root problems (what the redesign must actually solve)

1. **Content is 18 dead-end TikToks.** A gallery needs volume + provenance. The legal-compliant TikTok path stays, but the salon-portfolio pipeline (the thing that makes a look *bookable*) does not exist, and the user/admin ingest is broken. **Without fixing content, any redesign is lipstick on 18 rows.**
2. **The front end is two eras.** Feed = clean; detail + onboarding + states = legacy beta (eyebrows, opacity greys, two card kits, broken state stubs). A cohesion sweep + detail rebuild fixes the "not cohesive" complaint.
3. **The marketplace link is fake.** "Find the right salon for this look" is the only thing that differentiates Solen's discovery from TikTok, and it's a cosmetic deep-link on items with no salon attached. Either make it real (owner_salon_id + embeddings + real match) or consciously defer it and keep discovery honestly inspiration-only for now.

---

## 7. Sections for the mockup phase (the section-by-section list)

Proposed order for "section by section, lots of variation" mockups (each gets multiple variants, drawn from Pinterest / Fresha / Mobbin / etc.):

1. **Feed page chrome** , header + search + filter/saved + chip row
2. **Feed card** (ItemCard/VideoCard) , incl. the Pinterest save-to-board gesture + attribution/link-back fix
3. **Boards / Kollektionen row + board detail**
4. **Look detail page** (the big rebuild , attribution, salon link, sub-cards into one card kit)
5. **Saved / collections**
6. **Search dropdown** (trending / autocomplete / recent)
7. **Filters** (sheet + pills, fix the lock violation)
8. **Empty / loading / error states** (replace the broken stubs)
9. **Upload / post flow** (user + salon , the missing pipeline's UI)
10. **Onboarding** (profile setup / inline prefs)
11. Home `Entdecken` section (LOCKED , only if owner unlocks by name)

---

## 8. Open decisions (for council + owner)

- **D1 , Content model + sequencing.** TikTok stays (legal/API). What's the spine going forward: salon-portfolio sync (makes looks bookable, solves cold-start with real local content) vs curated/admin uploads vs keep-TikTok-only? And do we build the salon pipeline before or after the visual redesign?
- **D2 , Booking bridge: real or deferred?** Build the real look→salon match (owner_salon_id + embeddings + tag/service match) now, or keep a soft honest "search salons for this style" and defer true matching?
- **D3 , Legal remediation priority.** Capture `author_url` + add creator + link-back on feed cards + stop hiding junk creators + revisit the thumbnail re-hosting/caching + the AI-caption-overwrite. Which of these are blockers vs later?
- **D4 , Scope.** Targeted cohesion sweep + detail rebuild + new upload pipeline (recommended, given the feed is already clean) vs ground-up rebuild?
- **D5 , Mockup order.** Confirm the section order in §7.

---

*Generated 2026-06-13. Evidence: 4 deep-dive agents (frontend/backend/AI/legal), live Supabase queries (project `tocfnsmxmdxkrcmjzzdw`), `npm run exists`. Next step per owner: run through council, then section-by-section mockups.*
