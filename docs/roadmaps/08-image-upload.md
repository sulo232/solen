# Roadmap 08 — Image Upload System

> **Scope**: Replace URL-based images with proper Supabase Storage upload everywhere
> **DB Status**: `gallery_urls text[]` and `cover_photo_url text` exist on `salons`. Gallery API already fully built at `app/api/salons/[slug]/gallery/route.ts` (handles POST upload, DELETE, PUT reorder). Supabase Storage needs verification.
> **Effort**: 🟢 Small (~10 audit points)

---

## Phase 1: Audit Current Image Infrastructure

### 1.1 Check Supabase Storage buckets

**WHY**: The entire image system depends on having a properly configured Supabase Storage bucket. Without one, images have nowhere to be stored. The gallery API route already exists — it might already upload to Storage, or it might accept external URLs. We need to know the current state before building anything.

**HOW**:
- Use Supabase MCP tools or dashboard to check: Does a `salon-photos` or `gallery` bucket exist?
- If exists: What are the policies? (Should be: public read for anyone, authenticated write for salon owners only)
- If not exists: Create via Supabase dashboard or SQL:
  ```sql
  INSERT INTO storage.buckets (id, name, public) VALUES ('salon-photos', 'salon-photos', true);
  -- RLS policy: anyone can read, only salon owners can insert/delete
  ```

### 1.2 Audit existing gallery route

**WHY**: `app/api/salons/[slug]/gallery/route.ts` already handles POST (upload), DELETE, and PUT (reorder). We need to understand the current implementation before duplicating effort. If it already uploads to Supabase Storage and returns URLs, we just need to build a better UI on top of it.

**HOW**:
- Read the file to understand: Does POST receive a File upload and store it in Supabase Storage? Or does it accept a URL string?
- Test with a request if possible
- Document the API contract: `POST /api/salons/{slug}/gallery` → `{ url: string }` or `{ urls: string[] }`?

---

## Phase 2: Upload Component

### 2.1 Build universal image upload component

**WHY**: Multiple places in the app need image upload — salon gallery, profile photo, review photos, staff avatars. Building a reusable upload component means we implement the complex upload logic once (file validation, compression, progress tracking, error handling) and reuse it everywhere. Without this, each upload point gets its own buggy implementation.

**BENCHMARK**:
- **Fresha**: Drag-and-drop upload zone for salon gallery. Preview thumbnails, reorder, delete.
- **Airbnb**: Multi-step photo upload with drag-and-drop, reorder, cover photo selection, and captions.

**HOW**:
- **File**: New `components/ui/ImageUpload.tsx`
- **Features**:
  1. **Drag-and-drop zone**: Dashed border area (200px height), camera icon, "Fotos hierher ziehen oder klicken zum Hochladen" text
  2. **Click to browse**: Falls back to `<input type="file" accept="image/*" multiple>` with hidden input
  3. **Preview thumbnails**: Before upload, show selected images as a grid of 80×80 thumbnails with delete (X) button per image
  4. **Client-side resize**: Use `canvas` API to resize images to max 2000px width before upload — reduces upload time by 5-10× for phone photos (which are typically 4000-8000px wide)
  5. **Progress bar**: Per-image progress bar during upload (use `XMLHttpRequest` with `upload.onprogress` or Supabase Storage `uploadToSignedUrl` with progress)
  6. **Validation**: Max 10MB per file. Only JPEG, PNG, WebP. Show error toast for invalid files.
  7. **Upload to Supabase Storage**: `supabase.storage.from('salon-photos').upload(path, file)` → returns public URL
  8. **Return public URLs**: Callback `onUpload(urls: string[])` to parent component
- **Props**: `onUpload`, `maxFiles` (default 20), `existingUrls` (for edit mode — shows existing images with option to delete)
- **Design**: Coral accent on active/drag-over state. Coral progress bar. Smooth fade-in for uploaded thumbnails.

**IMPACT**: One component serves the entire platform's image upload needs. Clean, reliable, user-friendly.

---

### 2.2 Wire up to salon dashboard gallery page

**WHY**: The dashboard is where salon owners manage their photos. The gallery API exists but the upload UX might be basic (raw URL input instead of drag-and-drop). Wiring the new `ImageUpload` component creates a professional salon management experience.

**HOW**:
- **File**: `app/[locale]/dashboard/gallery/page.tsx` (check if exists)
- Replace any existing upload UI with `ImageUpload` component
- Add features:
  - **Reorder**: Drag-and-drop reorder of gallery images (use `dnd-kit` or `@hello-pangea/dnd`)
  - **Set cover photo**: Click "Als Titelbild festlegen" on any gallery image → sets `cover_photo_url`
  - **Delete**: X button per image → DELETE API call → update `gallery_urls[]`
- Saving reorder: PUT request to `/api/salons/{slug}/gallery` with new URL order

### 2.3 Wire up to onboarding flow

**WHY**: New salons signing up need to upload photos during onboarding. A clean upload step in the onboarding wizard ensures salons have photos from day one (photos are the #1 conversion factor for listings).

**HOW**:
- **File**: Check `components/onboarding/steps/` for photo step
- If exists: replace with `ImageUpload` component
- If missing: add a "Fotos hochladen" step to the onboarding flow
- Require at least 1 photo (cover photo mandatory), recommend 5+

---

## Phase 3: Image Optimization Pipeline

### 3.1 Supabase Storage transforms

**WHY**: Serving a 3000×2000 photo to a 400×300 card thumbnail wastes bandwidth and slows load time. Supabase Storage Image Transformation generates resized versions on-the-fly — the same uploaded image can be served at different sizes depending on context. This is how Airbnb serves optimized images across cards, mosaics, and fullscreen lightboxes from a single upload.

**HOW**:
- **Configure**: Enable Supabase Image Transformation (Pro plan feature)
- **Sizes needed**:
  1. Card thumbnail: `width=400&height=300&resize=cover` (4:3, ~30KB)
  2. Gallery medium: `width=800&height=600&resize=cover` (~80KB)
  3. Full-size lightbox: `width=1600&height=1200&resize=cover` (~200KB)
  4. Avatar: `width=200&height=200&resize=cover` (~15KB)
- **URL format**: `{storage_url}/render/image/public/salon-photos/{path}?width=400&height=300&resize=cover`
- **Fallback**: If Image Transformation is not available (free tier), serve original images with Next.js `<Image>` component which does its own optimization

### 3.2 Use Next.js Image component everywhere

**WHY**: Even without Supabase transforms, Next.js `<Image>` provides: automatic WebP conversion, responsive `srcset`, lazy loading, and LQIP blur placeholder. This is the minimum standard for any production Next.js app.

**HOW**:
- Replace all 8 `<img>` tags identified in Roadmap 07 audit with `<Image>`
- Add Supabase Storage domain to `next.config.js`:
  ```js
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tocfnsmxmdxkrcmjzzdw.supabase.co' }
    ]
  }
  ```
- Use `priority={true}` for above-fold images (cover photos, hero images), lazy for rest

**IMPACT**: Significant performance improvement. Faster page loads, better Core Web Vitals, better SEO. Images are the heaviest assets on any page.
