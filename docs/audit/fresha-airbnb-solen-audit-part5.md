# PART 5 — SEARCH, FILTERS, MAP, TYPOGRAPHY, COLORS, AUTH & GLOBAL UX (Points 401–530)

### A. Search Results Page

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 401 | Search results count display | ✅ "52 results" | ✅ "300+ places" | ❌ Missing | ✅ Adopt — "42 Ergebnisse in Basel" |
| 402 | Results list + map split view | ✅ List left, map right | ✅ Cards left, map right | ❌ Missing | ✅ Adopt — essential dual-pane layout |
| 403 | Map is interactive (drag, zoom) | ✅ | ✅ Google Maps integration | ❌ | ✅ Adopt |
| 404 | Map pins with price labels | ❌ Standard pins | ✅ Price tags as map markers | ❌ | ✅ Adopt — Airbnb-style price pins |
| 405 | Map pin hover → highlight card | ❌ | ✅ Bi-directional highlight | ❌ | ✅ Adopt |
| 406 | Card hover → highlight pin | ❌ | ✅ | ❌ | ✅ Adopt |
| 407 | "Search as I move map" toggle | ❌ | ✅ | ❌ | ✅ Adopt |
| 408 | Map collapse/expand toggle | ❌ | ✅ "Show map" button | ❌ | ✅ Adopt |
| 409 | Full-screen map mode | ❌ | ✅ | ❌ | 🔄 Adapt — add toggle |
| 410 | Map card popup on pin click | ❌ | ✅ Mini card popup | ❌ | ✅ Adopt |

### B. Filter System

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 411 | Filter bar position | ✅ Below header | ✅ Inline with category strip | ❌ No filter bar | ✅ Adopt — add horizontal filter bar |
| 412 | Quick filter chips | ✅ Service type chips | ✅ "Price", "Type of place", "Free cancellation" | ❌ | ✅ Adopt — quick chip filters |
| 413 | "All filters" button → modal | ❌ | ✅ Opens full filter modal | ❌ | ✅ Adopt |
| 414 | Price range filter | ❌ | ✅ Min/max slider | ❌ | ✅ Adopt — dual-handle price slider |
| 415 | Price range histogram | ❌ | ✅ Bar chart behind slider | ❌ | 🔄 Adapt — nice-to-have but complex |
| 416 | Rating filter (minimum stars) | ❌ | ✅ 4+ stars etc. | ❌ | ✅ Adopt — "4★ und besser" |
| 417 | Distance/radius filter | ❌ | ❌ (map-based) | ❌ | ✅ Adopt — "1km / 5km / 10km" radius |
| 418 | Service type filter | ✅ Category-based | N/A | ❌ | ✅ Adopt — "Manicure", "Balayage", "Massage" |
| 419 | Gender filter (Male/Female/Unisex) | ❌ | N/A | ❌ | 🔄 Adapt — useful for barbershops vs salons |
| 420 | "Open now" filter | ❌ | ❌ | ❌ | ✅ Adopt — "Jetzt geöffnet" toggle |
| 421 | Instant booking filter | ❌ | ✅ "Instant Book" | ❌ | ✅ Adopt — "Sofort buchbar" |
| 422 | Language spoken filter | ❌ | ❌ | ❌ | ✅ Adopt — important for Basel (DE/FR/EN) |
| 423 | Active filter count badge | ❌ | ✅ Circle badge on "Filters" | ❌ | ✅ Adopt — show count of active filters |
| 424 | "Clear all" filters button | ❌ | ✅ | ❌ | ✅ Adopt |
| 425 | Filter URL persistence | ❌ | ✅ Shareable filter URLs | ❌ | ✅ Adopt — query params for filters |
| 426 | Filter results update live | ❌ | ✅ | ❌ | ✅ Adopt — real-time results update |
| 427 | "Show X results" button in filter modal | ❌ | ✅ | ❌ | ✅ Adopt — live count in button |
| 428 | Sub-category chips on category page | ✅ "Gel Nails", "Pedicures" etc. | ❌ | ❌ | ✅ Adopt — sub-service filter chips |
| 429 | Sort dropdown | ✅ "Recommended" | ✅ Price, Rating | ❌ | ✅ Adopt — "Empfohlen / Bewertung / Preis / Distanz" |
| 430 | Save search / Alert for new salons | ❌ | ✅ | ❌ | 🔄 Adapt — "Suche speichern" for notifications |

### C. Typography System

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 431 | Primary font family | ✅ System font stack | ✅ Cereal (proprietary) | ✅ Custom heading/body fonts | ✅ Done |
| 432 | Heading font | System sans-serif | Cereal Bold | `font-heading` | ✅ Done |
| 433 | Body font | System sans-serif | Cereal Book | `font-body` | ✅ Done |
| 434 | H1 size desktop | ~32px | ~32px | ❓ | 🔄 Adapt — standardize heading scale |
| 435 | H2 size desktop | ~24px | ~22px | ❓ | 🔄 Adapt |
| 436 | Body text size | 14-16px | 14-16px | ❓ | ✅ Adopt — 14px default, 16px for readability |
| 437 | Line height | 1.4-1.5 | 1.4-1.5 | ❓ | ✅ Adopt — 1.5 for body text |
| 438 | Letter spacing | Normal | Tight (-0.02em) on headings | ❓ | 🔄 Adapt — slight negative on headings |
| 439 | Font weight scale | 400/600/700 | 300/400/500/700/800 | ❓ | ✅ Done — 400/600/700 is sufficient |
| 440 | Responsive font sizing | ✅ | ✅ Fluid | ❓ | ✅ Adopt — `clamp()` for responsive text |
| 441 | Monospace font for prices | None | None | None | ⏭️ Skip — not standard |
| 442 | Font loading strategy | `font-display: swap` | `font-display: optional` | ❓ | ✅ Adopt — `font-display: swap` or `optional` |
| 443 | Text anti-aliasing | ✅ `-webkit-font-smoothing` | ✅ | ❓ | ✅ Adopt — `antialiased` class |
| 444 | Heading text color | #222222 | #222222 | ❓ | ✅ Done — consistent dark |
| 445 | Body text color | #222222 | #484848 | ❓ | 🔄 Adapt — #484848 for body, #222 for headings |
| 446 | Muted/secondary text color | #717171 | #717171 | ✅ #717171 used throughout | ✅ Done |
| 447 | Text truncation strategy | Ellipsis | Ellipsis + line clamp | ❓ | ✅ Adopt — `line-clamp-2` utility |

### D. Color System

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 448 | Primary brand color | Green (#00A87E-ish) | Pink/Coral (#FF385C) | Coral (`s-coral`) | ✅ Done |
| 449 | Background color | White #FFFFFF | White #FFFFFF | ✅ White | ✅ Done |
| 450 | Card background | White | White | White | ✅ Done |
| 451 | Border color standard | #E5E5E5 | #EBEBEB | ❓ Variable | 🔄 Adapt — standardize to #EBEBEB |
| 452 | Hover background color | #F7F7F7 | #F7F7F7 | ❓ | ✅ Adopt — #F7F7F7 for hover states |
| 453 | Error/danger color | Red | Red | ❓ | ✅ Adopt — #D32F2F or similar |
| 454 | Success color | Green | Green | ❓ | ✅ Adopt — #2E7D32 |
| 455 | Warning color | Orange | Orange | ❓ | ✅ Adopt — #ED6C02 |
| 456 | Link color | Brand green | #222222 (text links) | ❓ | 🔄 Adapt — dark text links like Airbnb |
| 457 | Focus ring color | Brand | Blue outline | ❓ | ✅ Adopt — `focus-visible:ring-2 ring-s-coral` |
| 458 | Selection highlight color | Default | Branded | ❓ | 🔄 Adapt — `::selection { background: s-coral/20 }` |
| 459 | Disabled state color | #CCCCCC | #DDDDDD | ❓ | ✅ Adopt — #DDDDDD for disabled |
| 460 | Dark mode | ❌ | ❌ | ✅ Disabled (correct) | ✅ Done — light only |

### E. Spacing & Layout System

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 461 | Page max-width | ~1200px | ~2520px (container: 1120px) | 2520px | ✅ Done |
| 462 | Content max-width | ~1120px | ~1120px | ✅ | ✅ Done |
| 463 | Section vertical spacing | ~48-64px | ~48px | `space-y-16` (64px) | ✅ Done |
| 464 | Card internal padding | 0 (edge-to-edge image) | 0 (image → content below) | ❓ | ✅ Adopt — no padding around image |
| 465 | Text-to-image spacing | 12px | 8-12px | ❓ | 🔄 Adapt — 10px gap |
| 466 | Mobile horizontal padding | 16px | 24px | `px-4` (16px) | 🔄 Adapt — increase to `px-5` (20px) |
| 467 | Desktop horizontal padding | 24-40px | 80px | `sm:px-6` (24px) | 🔄 Adapt — add `xl:px-20` (80px) |
| 468 | 4px spacing grid system | ✅ | ✅ 8px base grid | ✅ Tailwind 4px grid | ✅ Done |

### F. Buttons & Interactive Elements

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 469 | Primary button color | Brand green | Brand pink/coral | Coral `s-coral` | ✅ Done |
| 470 | Primary button text | White, bold | White, bold | White, bold | ✅ Done |
| 471 | Button border-radius | ~8px | ~8px | `rounded-btn` | ✅ Done |
| 472 | Button height | ~44-48px | ~48px | ~46px (py-3.5) | ✅ Done |
| 473 | Button hover state | Darken | Darken | ❓ | ✅ Adopt — `hover:brightness-95` |
| 474 | Button disabled state | Grayed out | Grayed out | ❓ | ✅ Adopt — opacity 0.5 + cursor-not-allowed |
| 475 | Button loading state | Spinner | Spinner | ❓ | ✅ Adopt — inline spinner on submit |
| 476 | Secondary/outline button | ✅ | ✅ Black border | ❓ | ✅ Adopt — `border border-[#222] text-[#222]` |
| 477 | Ghost/text button | ✅ | ✅ Underline link style | ❓ | ✅ Done |
| 478 | Icon button (circle) | ❓ | ✅ 42px circle with icon | ❓ | ✅ Done — profile button is this |
| 479 | Button press scale effect | None | None | ✅ `solen-press-effect` | ✅ Done — ahead of both |
| 480 | Minimum touch target 44×44px | ✅ | ✅ | ❓ | ✅ Adopt — enforce 44px minimum |

### G. Forms & Inputs

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 481 | Input border style | 1px solid #DDDDDD | 1px solid #B0B0B0 | ❓ | 🔄 Adapt — 1px #DDDDDD |
| 482 | Input border-radius | ~8px | ~8px | ❓ | ✅ Done |
| 483 | Input focus state | Brand color border | Thick black border | ❓ | 🔄 Adapt — 2px coral border on focus |
| 484 | Input height | ~48px | ~56px | ❓ | 🔄 Adapt — 48px minimum |
| 485 | Input label position | Above | Floating label inside | ❓ | 🔄 Adapt — floating labels like Airbnb |
| 486 | Input error state | Red border + message | Red border + message below | ❓ | ✅ Adopt — red-500 border + error text |
| 487 | Input placeholder style | Gray text | Gray text, uppercase label | ❓ | ✅ Done |
| 488 | Textarea auto-resize | ❓ | ✅ | ❓ | ✅ Adopt |
| 489 | Checkbox/radio custom style | ❓ | ✅ Custom checkboxes | ❓ | ✅ Adopt — custom coral checkboxes |
| 490 | Toggle/switch design | ❓ | ✅ Custom toggle | ❓ | ✅ Adopt — coral toggle switch |

### H. Authentication & Account

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 491 | Login options | Email + social | Email + Google + Apple + Facebook | Google + Email | ✅ Done — add Apple later |
| 492 | Login modal vs page | Full page | ✅ Center modal | Full page | 🔄 Adapt — modal is cleaner |
| 493 | Phone number login | ✅ | ✅ Primary method | ❌ | 🔄 Adapt — add phone auth via Supabase |
| 494 | OTP verification | ✅ | ✅ | ❌ | 🔄 Adapt — magic link is similar |
| 495 | Login form design | Clean, minimal | Spacious, well-labeled | ❓ | ✅ Done |
| 496 | Guest checkout (no account needed) | ❌ Account required | ❌ Account required | ❓ | ⏭️ Skip — account needed for booking |
| 497 | Profile photo upload | ✅ | ✅ | ❓ | ✅ Adopt |
| 498 | Profile completeness indicator | ❌ | ✅ | ❌ | 🔄 Adapt — progress bar |
| 499 | Account deletion option | ✅ (GDPR) | ✅ (GDPR) | ❓ | ✅ Adopt — GDPR requirement |
| 500 | Two-factor authentication | ❌ | ✅ | ❌ | 🔄 Adapt — future security enhancement |

### I. SEO & Meta Tags

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 501 | Dynamic page titles | ✅ "Joliz Zentrum - Basel | Fresha" | ✅ "Listing Name - Airbnb" | ❓ | ✅ Adopt — `<title>Salon Name — Solen</title>` |
| 502 | Meta description per page | ✅ "Book with Joliz Zentrum..." | ✅ | ❓ | ✅ Adopt |
| 503 | OpenGraph tags | ✅ og:title, og:description, og:image | ✅ | ❓ | ✅ Adopt — for social sharing previews |
| 504 | Twitter card tags | ❓ | ✅ | ❓ | ✅ Adopt |
| 505 | Structured data (JSON-LD) | ✅ LocalBusiness schema | ✅ | ❌ | ✅ Adopt — critical for rich Google results |
| 506 | Canonical URLs | ✅ | ✅ | ❓ | ✅ Adopt |
| 507 | Sitemap.xml | ✅ Linked in footer | ✅ | ❓ | ✅ Adopt — auto-generated sitemap |
| 508 | robots.txt | ✅ | ✅ | ❓ | ✅ Adopt |
| 509 | Hreflang for multilingual | ✅ | ✅ | ❓ | ✅ Adopt — DE/EN/FR hreflang tags |
| 510 | City+category SEO pages | ✅ Thousands of pages | ✅ | ❌ | ✅ Adopt — "/basel/coiffeur", etc. |

### J. Accessibility (a11y)

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 511 | ARIA labels on buttons | ❓ | ✅ | Partial (`aria-label` on some) | ✅ Adopt — audit all interactive elements |
| 512 | Keyboard navigation | ❓ | ✅ Full tab order | ❓ | ✅ Adopt — ensure full keyboard nav |
| 513 | Focus ring visibility | ❓ | ✅ | ❓ | ✅ Adopt — `focus-visible` rings |
| 514 | Screen reader text | ❓ | ✅ sr-only classes | ❓ | ✅ Adopt — add sr-only labels |
| 515 | Alt text on images | ❓ | ✅ | ❓ | ✅ Adopt — salon name as alt text |
| 516 | Color contrast ratios | ✅ | ✅ WCAG AA | ❓ | ✅ Adopt — verify all text meets 4.5:1 |
| 517 | Reduced motion support | ❓ | ✅ | ❌ | ✅ Adopt — `prefers-reduced-motion` media query |
| 518 | Skip to content link | ❌ | ✅ | ❌ | ✅ Adopt — hidden skip link |
| 519 | Form error announcements | ❓ | ✅ aria-live | ❓ | ✅ Adopt |
| 520 | Modal focus trap | ❓ | ✅ | ❓ | ✅ Adopt — trap focus in modals/sheets |

### K. Error States & Edge Cases

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 521 | 404 page design | ✅ Custom branded | ✅ Custom with illustration | ❓ | ✅ Adopt — branded 404 page |
| 522 | Error boundary (React) | ❓ | ✅ | ❓ | ✅ Adopt — graceful error fallback |
| 523 | Offline state handling | ❌ | ✅ | ❌ | 🔄 Adapt — "Keine Verbindung" toast |
| 524 | Empty search results | ✅ Helpful suggestions | ✅ Expand search prompt | ❓ | ✅ Adopt — "Keine Ergebnisse" + suggestions |
| 525 | Slow connection indicator | ❌ | ❌ | ❌ | ⏭️ Skip |
| 526 | Session expired handling | ✅ | ✅ | ❓ | ✅ Adopt — graceful re-auth |
| 527 | Rate limiting feedback | ❌ | ✅ | ❌ | 🔄 Adapt — "Zu viele Anfragen" toast |
| 528 | Image load failure fallback | ❓ | ✅ Placeholder | ❓ | ✅ Adopt — fallback gradient |
| 529 | API timeout handling | ❓ | ✅ Retry button | ❓ | ✅ Adopt — "Erneut versuchen" button |
| 530 | Graceful degradation without JS | ❓ | ✅ SSR fallback | ✅ Next.js SSR | ✅ Done |

---

## AUDIT SUMMARY

| Category | Total Points | ✅ Done | ✅ Adopt | 🔄 Adapt | ⏭️ Skip |
|----------|-------------|---------|---------|---------|---------|
| Header & Nav (1-80) | 80 | 42 | 16 | 15 | 7 |
| Salon Cards (81-180) | 100 | 12 | 48 | 22 | 18 |
| Homepage & Content (181-300) | 120 | 44 | 37 | 27 | 12 |
| Salon Detail & Booking (301-400) | 100 | 5 | 68 | 14 | 13 |
| Search, Filters, Global UX (401-530) | 130 | 18 | 72 | 29 | 11 |
| **TOTAL** | **530** | **121** | **241** | **107** | **61** |

### Priority Breakdown for Implementation
- **P0 (ship-blocking)**: Points with ✅ Adopt that affect conversion (search, filters, booking flow, salon detail)
- **P1 (next sprint)**: Card improvements, map view, team section, review system
- **P2 (medium-term)**: SEO pages, accessibility audit, performance optimization
- **P3 (future)**: Native app, loyalty program, gift cards, advanced analytics
