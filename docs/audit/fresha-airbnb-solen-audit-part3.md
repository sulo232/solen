# PART 3 — HOMEPAGE, DISCOVERY & CONTENT SECTIONS (Points 181–300)

### A. Hero Section

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 181 | Hero image/illustration | ✅ App store mockup + gradient | None (search bar IS the hero) | None (search bar IS hero) | ✅ Done — Airbnb pattern |
| 182 | Hero headline text | "Discover top-rated salons..." | None (implied by search) | None | ⏭️ Skip — search-first is correct |
| 183 | App download CTA in hero | ✅ "Get the app" + QR code | None | None | 🔄 Adapt — add later when native app exists |
| 184 | "Scan to download" QR code | ✅ | None | None | ⏭️ Skip — no native app yet |
| 185 | Hero background style | ✅ Gradient (green to dark) | Plain white | Plain white | ✅ Done — white is elegant |
| 186 | Hero animation | None | None | None | 🔄 Adapt — subtle fade-in on page load |

### B. Social Proof & Trust Signals

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 187 | Trust stats banner | ✅ "1 billion+ bookings, 130k+ businesses" | ✅ "8 million rentals" (in meta) | ❌ Missing | ✅ Adopt — "X Salons · Y Bewertungen · Z Buchungen" strip |
| 188 | Stats format | Large numbers with "+" suffix | In page description | ❌ | ✅ Adopt — prominent stat cards or strip |
| 189 | Customer review carousel | ✅ 20+ reviews with name+city+rating | None on homepage | ❌ Missing | ✅ Adopt — testimonial carousel from real users |
| 190 | Review card design | Name, city, country, 5-star, quote | N/A | ❌ | ✅ Adopt — clean review cards |
| 191 | Review carousel auto-scroll | ✅ | N/A | ❌ | 🔄 Adapt — auto-scroll with pause on hover |
| 192 | Capterra/Trustpilot badge | ✅ "Excellent 5/5 on Capterra" | None | ❌ | ⏭️ Skip — no external reviews yet |
| 193 | "Trusted by X professionals" | ✅ "130,000+ businesses" | "2 million Guest Favorites" | ❌ | ✅ Adopt — once we have real data |
| 194 | Countries/regions count | ✅ "120+ countries" | "220+ countries" | ❌ | ⏭️ Skip — Basel-focused for now |
| 195 | Professional count | ✅ "450,000+ professionals" | N/A | ❌ | 🔄 Adapt — "X Stylisten in Basel" |

### C. Category Sections / Carousels

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 196 | Category-grouped carousels on homepage | ❌ (Fresha homepage is landing page style) | ✅ Listings grid by category | ✅ `orderedSectionKeys` per category | ✅ Done |
| 197 | Section title style | N/A | `text-[22px] font-semibold` | ✅ Same style in FeaturedSalonCarousel | ✅ Done |
| 198 | "View all" / "Alle anzeigen" link | N/A | ✅ Right-aligned link | ✅ `viewAllHref` prop | ✅ Done |
| 199 | Section spacing | N/A | ~48-64px between sections | `space-y-16` (64px) | ✅ Done |
| 200 | Section border-top separator | N/A | ✅ `#EBEBEB` 1px | ✅ `border-t border-[#EBEBEB]` | ✅ Done |
| 201 | Carousel scroll snap | N/A | ✅ Snap to card edges | ❓ Need to verify | ✅ Adopt — `scroll-snap-type: x mandatory` |
| 202 | Carousel arrow buttons (desktop) | N/A | ✅ Circle arrow buttons | ❓ | ✅ Adopt — left/right arrow buttons |
| 203 | Carousel arrow visibility | N/A | ✅ Only when hovering section | ❓ | ✅ Adopt — hide until hover |
| 204 | Carousel progress indicator | N/A | None (arrows are enough) | ❓ | ⏭️ Skip — arrows sufficient |
| 205 | Carousel momentum/inertia scrolling | N/A | ✅ Natural momentum | ❓ | ✅ Adopt — CSS `scroll-behavior: smooth` |
| 206 | Category sections order personalized | N/A | None | ✅ `bubbleRank` based on recent visits | ✅ Done — ahead of both |
| 207 | Empty category section handling | N/A | Hidden if empty | ❓ | ✅ Adopt — hide sections with 0 salons |

### D. Discovery / Entdecken Section

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 208 | Discovery/inspiration section | ❌ No equivalent | ✅ "Homes on Airbnb" tabs | ✅ `DiscoverCarousel` | ✅ Done |
| 209 | Discovery section title | N/A | Tabs: "Homes", "Experiences" | `t("discover.title")` | ✅ Done |
| 210 | Discovery CTA link | N/A | Tab navigation | `discover.catalogCta` → `/discover` | ✅ Done |
| 211 | Pinterest-style discovery grid | ❌ | ❌ | ✅ Referenced as "Pinterest-style" | ✅ Done — unique to Solen |
| 212 | Discovery content type | N/A | Listing cards | Curated content cards | ✅ Done |

### E. Re-booking & Personalization

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 213 | "Book again" / "Wieder buchen" prompt | ✅ In booking history | ✅ "Trips" section | ✅ `lastBookedSalon` + rebook CTA | ✅ Done |
| 214 | Rebook card design | ❓ | Minimal | ✅ Card with icon + salon name + CTA button | ✅ Done |
| 215 | Last booking salon name shown | ✅ | ✅ | ✅ `lastBookedSalon.name` | ✅ Done |
| 216 | Quick rebook button | ✅ "Book again" | ✅ "Book again" | ✅ Coral button → salon page | ✅ Done |
| 217 | Personalized greeting | None | None | ✅ `userName` state | ✅ Done — "Hallo, [Name]" |
| 218 | Recently viewed section | ❌ | ✅ (in search) | ✅ `RecentlyViewed` component | ✅ Done |
| 219 | Nearby salons with geo | ✅ Location-based results | ✅ "Near you" | ✅ `fetchNearby` with geolocation | ✅ Done |
| 220 | Location permission handling | ✅ Browser prompt | ✅ Browser prompt | ✅ Permission query before prompt | ✅ Done |
| 221 | Favorites/wishlist section on home | ❌ | ✅ Wishlists shortcut | ❌ Missing on homepage | 🔄 Adapt — add "Deine Favoriten" carousel |
| 222 | Booking history accessible | ✅ Account section | ✅ "Trips" | ✅ Profile section | ✅ Done |

### F. Partner/Business CTA Section

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 223 | "For business" CTA on homepage | ✅ "Supercharge your business" section | ✅ "Become a host" | ✅ Warm-toned Partner CTA section | ✅ Done |
| 224 | CTA design style | ✅ Dark section with review badge | ✅ Purple gradient | ✅ Warm coral gradient card | ✅ Done — better than both |
| 225 | CTA headline | "Supercharge your business" | "Airbnb it. You could earn..." | "Wachse mit Solen" | ✅ Done |
| 226 | Value proposition list | ✅ Features list | ✅ Earning calculator | ✅ 3 checkmarks | ✅ Done |
| 227 | CTA button style | ✅ Dark button | ✅ Pink "Learn more" | ✅ Coral pill button with shadow | ✅ Done |
| 228 | Decorative stats/graphics | ❌ | ✅ Earnings illustration | ✅ "+47%" and "120+" stat cards | ✅ Done |
| 229 | Social proof in CTA | ✅ Capterra badge | ❌ | ❌ Missing | 🔄 Adapt — add "Bereits X Salons auf Solen" |
| 230 | CTA position in page | Bottom section | Mid-page | Bottom (section 5) | ✅ Done |

### G. Browse by City / Location Section

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 231 | "Browse by city" section | ✅ Massive city list (80+ cities) | None on homepage | ❌ Missing | ✅ Adopt — "Salons in deiner Stadt" |
| 232 | City links per category | ✅ "Hair Salons in Basel", "Nail Salons in Basel" | N/A | ❌ Missing | ✅ Adopt — critical for SEO |
| 233 | City grid layout | ✅ Accordion by city | N/A | ❌ | 🔄 Adapt — card grid: Basel, Zürich, Bern, etc. |
| 234 | City images | ❌ Text only | N/A | ❌ | ✅ Adopt — city photo cards |
| 235 | City salon count | ❌ | N/A | ❌ | ✅ Adopt — "42 Salons in Basel" |
| 236 | Neighborhood-level browsing | ✅ "Vorstädte", "Gundeldingen" | N/A | ❌ Missing | ✅ Adopt — Basel neighborhood pages |
| 237 | SEO landing pages per city×category | ✅ Deep SEO pages | ✅ SEO pages | ❌ Missing | ✅ Adopt — critical for organic traffic |

### H. App Download & Cross-Platform

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 238 | App download banner | ✅ Prominent hero section | ✅ Smart banner | ❌ No app | ⏭️ Skip — no native app yet |
| 239 | "Download the app" CTA | ✅ Multiple placements | ✅ Smart app banner | ❌ | ⏭️ Skip |
| 240 | App store badges (Apple/Google) | ✅ Both stores | ✅ Both stores | ❌ | ⏭️ Skip |
| 241 | QR code for app download | ✅ "Scan to download" | ❌ | ❌ | ⏭️ Skip |
| 242 | PWA install prompt | ❌ | ❌ | ❌ Missing | ✅ Adopt — add PWA install capability |
| 243 | "Continue in app" deep linking | ✅ | ✅ | ❌ | ⏭️ Skip — no app |

### I. Content & Blog/Guide Sections

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 244 | Blog/magazine section | ✅ Blog link in footer | ✅ "Experiences" | ❌ Missing | 🔄 Adapt — add beauty tips/guides section |
| 245 | Treatment guide pages | ❌ | N/A | ❌ | ✅ Adopt — "Was ist Balayage?" guide pages for SEO |
| 246 | Salon/stylist interview features | ❌ | ✅ Host stories | ❌ | 🔄 Adapt — "Stylist Spotlight" featured content |
| 247 | Before/after gallery | ❌ | N/A | ❌ | ✅ Adopt — massive engagement for beauty |
| 248 | Seasonal/trend content | ❌ | ✅ Seasonal categories | ❌ | ✅ Adopt — "Sommer Trends 2026" carousel |
| 249 | Gift card section | None on homepage | ✅ "Gift cards" link | ❌ | 🔄 Adapt — "Geschenkgutschein" feature |
| 250 | Voucher/gift buying | ✅ "Buy vouchers" on salon pages | N/A | ❌ | ✅ Adopt — gift voucher purchasing |

### J. Footer

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 251 | Footer columns layout | ✅ 4 columns | ✅ 3 columns | ✅ Footer component | ✅ Done |
| 252 | "About" section links | ✅ Careers, Blog, Sitemap | ✅ Newsroom, Careers | ❓ | ✅ Adopt — ensure all standard links present |
| 253 | "For Business" section | ✅ Partners, Pricing, Support | ✅ Host resources | ❓ | ✅ Adopt — Partner links in footer |
| 254 | Legal section | ✅ Privacy, ToS, ToU | ✅ Privacy, Terms | ❓ | ✅ Done |
| 255 | Social media links | ✅ Facebook, Twitter, LinkedIn, Instagram | ✅ Same set | ❓ | ✅ Adopt — add social icons |
| 256 | App store links in footer | ✅ | ✅ | ❌ | ⏭️ Skip — no app |
| 257 | Language/region selector in footer | ✅ Implicit | ✅ Globe + currency | ❓ | ✅ Adopt — language selector in footer too |
| 258 | Copyright notice | ✅ "© 2026 Fresha.com SV Ltd" | ✅ "© 2026 Airbnb, Inc." | ❓ | ✅ Done |
| 259 | Footer background color | White | Light gray (#F7F7F7) | ❓ | 🔄 Adapt — very subtle gray background |
| 260 | Footer border-top | ✅ | ✅ `#EBEBEB` | ❓ | ✅ Done |
| 261 | Footer responsive collapse | ✅ Accordion on mobile | ✅ Accordion on mobile | ❓ | ✅ Adopt — accordion columns on mobile |
| 262 | "Help & Support" link | ✅ Prominent | ✅ Prominent | ❓ | ✅ Done |
| 263 | Sitemap link | ✅ | ✅ | ❓ | ✅ Adopt — critical for SEO |
| 264 | Cookie settings link | ✅ Implied | ✅ | ❓ | ✅ Adopt — GDPR requirement |

### K. Homepage Section Order

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 265 | Section 1 | Hero + app download | Search + category strip | Category carousels | 🔄 Adapt — search is correct first focus |
| 266 | Section 2 | App download CTA | Listing grid | Discover carousel | ✅ Done |
| 267 | Section 3 | Reviews carousel | More listings | Rebook prompt | ✅ Done |
| 268 | Section 4 | Trust stats | Footer SEO cities | Recently viewed | ✅ Done |
| 269 | Section 5 | For business CTA | Footer | Partner CTA | ✅ Done |
| 270 | Section 6 | Browse by city | N/A | Footer | 🔄 Adapt — add Browse by City before footer |
| 271 | Total sections count | 7 | 3-4 | 5 | 🔄 Adapt — add 2-3 more sections |
| 272 | Page height feel | Long, content-rich | Short, grid-focused | Medium | ✅ Done — good balance |

### L. Homepage Loading & Performance

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 273 | Initial load skeleton | ✅ Placeholder UI | ✅ Shimmer cards | ❓ | ✅ Adopt — add shimmer skeletons |
| 274 | Above-fold content priority | ✅ | ✅ | ✅ Carousels load first | ✅ Done |
| 275 | Image optimization (WebP/AVIF) | ✅ | ✅ | ❓ | ✅ Adopt — ensure Next.js Image optimization |
| 276 | Lazy loading below-fold sections | ✅ | ✅ | ❓ | ✅ Adopt — intersection observer lazy loading |
| 277 | Time to interactive | Fast | Fast | ❓ Supabase errors may slow | 🔄 Adapt — fix Supabase env vars |
| 278 | Core Web Vitals optimized | ✅ | ✅ | ❓ | ✅ Adopt — run Lighthouse audit |
| 279 | Service worker / offline support | ✅ (app) | ✅ (app) | ❌ | 🔄 Adapt — add basic service worker |
| 280 | Preload critical assets | ✅ | ✅ | ❓ | ✅ Adopt — preload fonts, logo |

### M. Animations & Motion Design

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 281 | Page transition animation | None | None | None | 🔄 Adapt — subtle page fade transitions |
| 282 | Scroll-triggered animations | None | Minimal | ✅ `animate-in` classes | ✅ Done |
| 283 | Stagger animation on card grid | None | ✅ Subtle fade-in | ✅ `staggerChildren: 0.06` | ✅ Done |
| 284 | Spring physics in UI | None | None | ✅ Framer Motion springs in BottomTabBar | ✅ Done — ahead of both |
| 285 | Dropdown/popover animations | ✅ Basic fade | ✅ Scale + fade | ✅ `airbnbPopoverVariants` | ✅ Done |
| 286 | Sheet/modal slide-up animation | ✅ Basic | ✅ Smooth slide | ✅ Framer Motion `y: "100%"` → 0 | ✅ Done |
| 287 | Loading spinner design | ✅ Custom | ✅ Custom | ❓ | 🔄 Adapt — branded coral spinner |
| 288 | Skeleton shimmer animation | ✅ | ✅ Left-to-right shimmer | ❌ | ✅ Adopt — add CSS shimmer keyframes |
| 289 | Button press animation | None | None | ✅ `solen-press-effect` | ✅ Done |
| 290 | Toast/notification animation | ❓ | ✅ Slide in from top | ❓ | ✅ Adopt — slide-in toasts |
| 291 | Micro-interaction on favorite toggle | None | ✅ Heart fills red | ✅ Spring animation | ✅ Done |
| 292 | Scroll-to-top animation | None | None | ✅ `window.scrollTo({ behavior: 'smooth' })` | ✅ Done |
| 293 | Image fade-in on load | ✅ | ✅ | ❓ | ✅ Adopt — opacity 0→1 on image load |
| 294 | Category tab transition animation | None | None | ✅ Collapse emoji icons on scroll | ✅ Done |
| 295 | Counter/number animation | None | None | None | 🔄 Adapt — animate trust stats counting up |
| 296 | Parallax effects | None | None | None | ⏭️ Skip — can feel gimmicky |
| 297 | Reduced motion support | ❓ | ✅ `prefers-reduced-motion` | ❓ | ✅ Adopt — respect user preference |
| 298 | 60fps animation guarantee | ✅ | ✅ | ❓ | ✅ Adopt — use `will-change` and `transform` only |
| 299 | AnimatePresence for route changes | None | None | Partial (modals only) | 🔄 Adapt — add route-level AnimatePresence |
| 300 | Gesture-based interactions | None | None | ✅ Tap spring in BottomTabBar | ✅ Done |
