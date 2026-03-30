# Roadmap R30: Dead File Cleanup + Image Performance + Duplicate Purge

> **Scope:** Delete 7 duplicate `page 2.tsx` files, add `priority` to above-fold images, add `sizes` to responsive `<Image>` components, add blur placeholders to hero images, clean up any orphaned imports.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Could break if wrong file is deleted | Verify `page.tsx` (without space) exists and is correct BEFORE deleting `page 2.tsx` |
| Phase 2 | 🟢 SAFE | Nothing — additive props | Only ADD `priority`/`sizes` — don't remove existing props |
| Phase 3 | 🟢 SAFE | Nothing — additive props | Only ADD `placeholder="blur"` + `blurDataURL` |
| Phase 4 | 🟢 SAFE | Nothing — orphan detection | Only delete confirmed unused files |

---

## 🤖 Phase 1: Delete Duplicate Files

> **Goal:** Remove 7 duplicate files that have spaces in filenames (remnants from copy-paste).

#### Files to `[DELETE]`
- `app/[locale]/coiffeur/page 2.tsx`
- `app/[locale]/barbershop/page 2.tsx`
- `app/[locale]/nails/page 2.tsx`
- `app/[locale]/spa/page 2.tsx`
- `app/[locale]/makeup/page 2.tsx`
- `app/[locale]/waxing/page 2.tsx`
- `components/ui/AddressAutocomplete 2.tsx`

#### Instructions (MANDATORY — follow in exact order)
1. For EACH duplicate, verify the primary file exists:
```bash
ls "app/[locale]/coiffeur/page.tsx"      # Must exist
ls "app/[locale]/coiffeur/page 2.tsx"    # Must exist (the duplicate)
# Compare: diff the two files
diff "app/[locale]/coiffeur/page.tsx" "app/[locale]/coiffeur/page 2.tsx"
```
2. If diff shows the primary file is the NEWER/CORRECT version → safe to delete the duplicate
3. If diff shows the duplicate has NEWER changes → STOP and ask the user which to keep
4. Delete the duplicate:
```bash
rm "app/[locale]/coiffeur/page 2.tsx"
```
5. Also check for any imports of the duplicate: `grep -rn "page 2" app/ components/`

#### ✅ DO
```bash
# Always verify before deleting
diff "app/[locale]/coiffeur/page.tsx" "app/[locale]/coiffeur/page 2.tsx"
# Then delete
rm "app/[locale]/coiffeur/page 2.tsx"
```

#### ❌ DON'T
```bash
# DON'T delete without checking — the "page 2" might be NEWER
rm "app/[locale]/coiffeur/page 2.tsx"  # ← BAD if you didn't diff first

# DON'T delete the PRIMARY file
rm "app/[locale]/coiffeur/page.tsx"  # ← CATASTROPHIC: deletes the real page
```

#### Verification
```bash
find . -name "* 2.*" -type f  # Should return 0 results
npm run build
git add -A && git commit -m "R30 phase 1: delete 7 duplicate 'page 2' files"
```

> ⚠️ **BE CAREFUL**:
> - Files with spaces in names need quotes in shell commands: `"page 2.tsx"`
> - ALWAYS diff before deleting — never assume the primary file is correct
> - Check for imports: `grep -rn "AddressAutocomplete 2" components/` — if any file imports the duplicate, update the import first
> - On Windows, use `del` or PowerShell `Remove-Item` instead of `rm`

---

## 🤖 Phase 2: Image Priority & Sizes Optimization

> **Goal:** Add `priority` to above-fold images and `sizes` to all responsive `<Image>` components for better LCP and bandwidth.

#### Files
Run these greps to find affected files:
```bash
# Hero/cover images (should get priority)
grep -rn "Image.*cover_photo\|Image.*hero\|Image.*banner" components/ --include="*.tsx" -l
# All Image components (need sizes)
grep -rn "<Image" components/ --include="*.tsx" -l
```

#### Target files (expected):
- `[MODIFY]` `components/HomePage.tsx` — Hero section images: add `priority`
- `[MODIFY]` `components/SalonCard.tsx` — Cover photo: add `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`
- `[MODIFY]` `components/CategoryPage.tsx` — Hero image: add `priority`
- `[MODIFY]` `components/salon/SalonDetailHero.tsx` (or similar) — Cover photo: add `priority` + `sizes`
- `[MODIFY]` `components/discovery/ItemCard.tsx` — Image: add `sizes="(max-width: 640px) 50vw, 33vw"`
- `[MODIFY]` `components/discovery/VideoCard.tsx` — Thumbnail: add `sizes="(max-width: 640px) 50vw, 33vw"`
- `[MODIFY]` All avatar/small images — add `sizes="48px"` or `sizes="64px"` for fixed-size avatars

#### ✅ DO
```tsx
// Hero/cover — above fold, critical for LCP
<Image
  src={salon.cover_photo}
  alt={salon.name}
  fill
  priority  // ← ADD: tells Next.js to preload this image
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"  // ← ADD
  className="object-cover"
/>

// Card images — responsive
<Image
  src={salon.cover_photo}
  alt={salon.name}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"  // ← ADD
  className="object-cover"
/>

// Avatars — fixed size
<Image
  src={staff.avatar_url}
  alt={staff.name}
  width={48}
  height={48}
  sizes="48px"  // ← ADD: tells browser the exact display size
  className="rounded-full object-cover"
/>
```

#### ❌ DON'T
```tsx
// DON'T add priority to ALL images — only the first 1-2 above-fold images
<Image priority />  // ← BAD if this image is below the fold

// DON'T use vw-only sizes — always include breakpoint cascade
sizes="100vw"  // ← BAD: browser always downloads the largest image

// DON'T remove existing width/height/fill props — only ADD sizes/priority
```

#### Verification
```bash
npm run build
# Run Lighthouse: check LCP, "Properly size images", "Serve images in correct format"
git add -A && git commit -m "R30 phase 2: add priority to hero images, sizes to all responsive Images"
```

> ⚠️ **BE CAREFUL**:
> - Only add `priority` to images that appear in the initial viewport (above fold) — max 2-3 per page
> - `sizes` is ONLY useful when using `fill` prop — if `width`/`height` are set, `sizes` helps but isn't critical
> - Don't change `fill` vs `width/height` mode — only ADD `sizes` and `priority` where needed
> - Avatar images with explicit `width={48}` should use `sizes="48px"` not viewport-relative sizes

---

## 🤖 Phase 3: Blur Placeholders for Hero Images

> **Goal:** Add `placeholder="blur"` to critical images for better perceived performance.

#### Files (subset of Phase 2 — only hero/cover images)
- `[MODIFY]` `components/HomePage.tsx` — Hero images
- `[MODIFY]` `components/SalonCard.tsx` — Cover photo
- `[MODIFY]` Category page hero images

#### Instructions
For remote images (URL-based), use a tiny inline blur data URL:
```tsx
<Image
  src={salon.cover_photo}
  alt={salon.name}
  fill
  priority
  sizes="..."
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOCA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4="
/>
```

That base64 decodes to: `<svg width="8" height="5" viewBox="0 0 8 5" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="5" fill="#E8E4DF"/></svg>` — a warm cream rectangle matching `bg-s-bg-surface`.

#### ✅ DO
```tsx
// Create a constant for reuse
const BLUR_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOCA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";

<Image placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} ... />
```

#### ❌ DON'T
```tsx
// DON'T use placeholder="blur" on local/static imports without a blurDataURL
<Image src="/local-image.jpg" placeholder="blur" />  // ← only works for static imports

// DON'T add blur to small images (avatars, icons) — only hero/cover images
// DON'T generate dynamic blur hashes at runtime — use the static SVG placeholder
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R30 phase 3: blur placeholders for hero and cover images"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `placeholder="blur"` requires `blurDataURL` for remote images — without it, Next.js throws an error
> - The warm cream color `#E8E4DF` matches the V3 surface color — don't use grey or white
> - Only add to images ≥200px in display size — skip avatars and icons

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Delete 7 duplicate files | Nothing |
| Phase 2 | 🤖 | Add priority + sizes (~10 files) | Nothing |
| Phase 3 | 🤖 | Add blur placeholders (~5 files) | Phase 2 (same files) |
