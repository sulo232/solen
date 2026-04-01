# PART 2 — SALON/LISTING CARDS (Points 81–180)

### A. Card Layout & Structure

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 81 | Card image aspect ratio | ~4:3 landscape | ~1:1 square | Variable | 🔄 Adapt — standardize to 4:3 for salons (shows interior better) |
| 82 | Image carousel on card | None (single image) | ✅ Dot-indicator carousel (5 images) | ❌ Single image | ✅ Adopt — multi-image carousel is huge for engagement |
| 83 | Carousel dot indicators | N/A | ✅ White dots centered below | ❌ N/A | ✅ Adopt — add when carousel is built |
| 84 | Carousel left/right arrows on hover | N/A | ✅ Semi-transparent circle buttons | ❌ N/A | ✅ Adopt — desktop hover arrows |
| 85 | Image border-radius | ~12px | ~12px all corners | ❓ Variable | 🔄 Adapt — standardize to `rounded-xl` (12px) |
| 86 | Image lazy loading | ✅ | ✅ | ✅ | ✅ Done |
| 87 | Image placeholder/skeleton | ✅ Gray shimmer | ✅ Gray shimmer | ❓ Need to verify | ✅ Adopt — add skeleton loading states |
| 88 | Card click area | Entire card | Entire card | Entire card | ✅ Done |
| 89 | Card hover effect | ✅ Subtle shadow | None (only on image) | ❓ Variable | 🔄 Adapt — subtle translateY(-2px) + shadow on hover |
| 90 | Card border | None / very subtle | None | ❓ Variable | ⏭️ Skip — borderless is modern |

### B. Card Image Overlays

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 91 | Heart/favorite icon on image | None on listing cards | ✅ Top-right, SVG heart, white with dark stroke | ❓ Partial | ✅ Adopt — Airbnb-style heart overlay |
| 92 | Heart animation on toggle | N/A | ✅ Red fill + scale pulse | ❓ | ✅ Adopt — spring animation on toggle |
| 93 | "Guest Favorite" / "Featured" badge | ✅ "Featured" badge on cards | ✅ "Guest favorite" shield badge | ❌ Missing on cards | ✅ Adopt — "Favorit" or "Top bewertet" badge |
| 94 | Badge position | Top-left of image | Top-left of image | N/A | ✅ Adopt — top-left overlay |
| 95 | Badge design | Green pill | Black/white shield with laurel | N/A | 🔄 Adapt — coral pill with "★ Top" |
| 96 | "Deals" / discount badge | ✅ "Deals" tag on some cards | None | ❌ Missing | ✅ Adopt — "Angebot" badge for discounted salons |
| 97 | "New" badge for new salons | None | ✅ "New" badge | ❌ Missing | ✅ Adopt — "Neu" badge for recently joined salons |
| 98 | Image gradient overlay (bottom) | None | None | None | ⏭️ Skip — clean is better |
| 99 | Salon photo count indicator | None | ✅ Shows total image count | ❌ Missing | 🔄 Adapt — show "1/5" on hover |
| 100 | Video thumbnail support | None | None | None | ⏭️ Skip — future feature |

### C. Card Metadata — Rating & Reviews

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 101 | Star rating display | ✅ Numeric "4.9" + star icon | ✅ "★ 4.92" | ❓ Variable | 🔄 Adapt — "★ 4.9" format like Airbnb |
| 102 | Review count in parentheses | ✅ "(2,961)" | ✅ "(128)" or no count | ❓ | ✅ Adopt — show "(123)" next to rating |
| 103 | Rating position | Below salon name | Top-right of text area | ❓ | 🔄 Adapt — Airbnb style: top-right aligned with name |
| 104 | Rating text size | ~14px | ~14px | ❓ | ✅ Adopt — 14px semibold |
| 105 | "No reviews yet" state | ✅ "New" label | ✅ "New" label | ❓ | ✅ Adopt — show "Neu" for unrated salons |
| 106 | Rating breakdown (5★/4★/3★) | ✅ On detail page | ✅ On detail page | ❌ Missing | ✅ Adopt — add to salon detail page |
| 107 | Average rating precision | 1 decimal (4.9) | 2 decimal (4.92) | ❓ | 🔄 Adapt — use 1 decimal like Fresha (cleaner) |
| 108 | Review highlight snippet on card | None | None | None | ⏭️ Skip — saves space |
| 109 | Verified review badge | None visible | None visible | None | ⏭️ Skip — all reviews are verified through booking |
| 110 | Total reviews linked to detail page | ✅ Clickable | ✅ Clickable | ❓ | ✅ Adopt — link to reviews section |

### D. Card Metadata — Location & Distance

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 111 | Full street address on card | ✅ "Aeschenvorstadt 55, Basel, 4051" | None (general area only) | ❓ Variable | 🔄 Adapt — show neighborhood + city, not full address |
| 112 | Distance from user | ❌ Not shown on cards | ❌ Not shown | ❌ Missing | ✅ Adopt — "1.2 km entfernt" when GPS available |
| 113 | Neighborhood/area name | ❌ Canton shown, not neighborhood | ✅ Area name like "Kleinbasel" | ❌ Missing | ✅ Adopt — show Basel neighborhood |
| 114 | Map pin preview on card | None | None | None | ⏭️ Skip — save for map view |
| 115 | "Get directions" link | ✅ On detail page | ✅ On detail page | ❓ | ✅ Adopt — Google Maps link on detail |

### E. Card Metadata — Price & Services

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 116 | Starting price on card | ✅ "From CHF 5" per service | ✅ "CHF 150 night" | ❌ Missing | ✅ Adopt — "ab CHF 35" is critical for conversion |
| 117 | Price format | "CHF 35" | "$150 night" | ❓ | ✅ Adopt — "ab CHF XX" |
| 118 | Service name on card | ✅ Shows 3-4 top services with price/duration | None (it's lodging) | ❌ Missing | ✅ Adopt — show top 2-3 services with price |
| 119 | Service duration on card | ✅ "45 min" next to each service | N/A | ❌ Missing | ✅ Adopt — show duration inline |
| 120 | "See all services" link on card | ✅ | N/A | ❌ Missing | ✅ Adopt — expandable services preview |
| 121 | "From" prefix for variable pricing | ✅ "From CHF 66" | None | ❌ Missing | ✅ Adopt — "ab" prefix |
| 122 | Currency symbol position | Before amount: "CHF 35" | Before: "$150" | Should match CH convention | ✅ Adopt — "CHF 35" format |
| 123 | Price per service vs per visit | Per service ✅ | Per night | Per service is correct for beauty | ✅ Adopt — per service |
| 124 | "Book now" CTA on card | ❌ Not on listing cards | ❌ Not on cards | ❌ Missing | ⏭️ Skip — card click is enough |
| 125 | Instant booking indicator | ✅ "Instant Confirmation" | ✅ Implied | ❌ Missing | 🔄 Adapt — add small ⚡ icon for instant-book salons |

### F. Card Metadata — Salon Info

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 126 | Salon/business name | ✅ Bold, prominent | ✅ Bold title | ✅ | ✅ Done |
| 127 | Name font weight | Bold/semibold | Regular to medium | ❓ | 🔄 Adapt — semibold for name |
| 128 | Name truncation | ✅ Single line, ellipsis | ✅ 2 lines max | ❓ | ✅ Adopt — max 1-2 lines with ellipsis |
| 129 | Business type label | ✅ e.g. "Beauty Salon", "Nail Salon" | ✅ "Entire home", etc. | ❌ Missing | ✅ Adopt — show "Nagelstudio", "Coiffeur" etc. |
| 130 | Open/closed status on card | ❌ Not on cards | None | ❌ Missing | 🔄 Adapt — show "Jetzt geöffnet" as green dot |
| 131 | Opening hours on card | ❌ Not on cards | None | ❌ Missing | ⏭️ Skip — save for detail page |
| 132 | Next available slot on card | ❌ Not visible | None | ❌ Missing | ✅ Adopt — "Nächster Termin: Heute 14:00" is high-conversion |
| 133 | Staff count / team size | ❌ Not on cards | N/A | ❌ Missing | ⏭️ Skip — detail page only |
| 134 | Service count on card | ❌ Not on listing cards | N/A | ❌ Missing | 🔄 Adapt — "15 Services" |
| 135 | Salon profile photo / logo | ❌ Uses salon photos | N/A | ❓ | 🔄 Adapt — optional salon logo overlay |

### G. Card Grid Layout

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 136 | Desktop grid columns | 1-column list with sidebar | 4-5 columns responsive grid | ❓ Carousel-based | 🔄 Adapt — use grid on category pages, carousel on home |
| 137 | Mobile grid columns | 1-column full-width | 1-column full-width | ❓ | ✅ Done — 1 column mobile |
| 138 | Tablet grid columns | 1-2 columns | 2-3 columns | ❓ | 🔄 Adapt — 2 columns on tablet |
| 139 | Card gap spacing | ~16px | ~24px | ❓ | 🔄 Adapt — 20-24px gap |
| 140 | Infinite scroll vs pagination | ✅ "See all" button | ✅ Pagination at bottom | ❓ | 🔄 Adapt — infinite scroll + "Show more" button |
| 141 | Grid animation on load | None | ✅ Fade-in stagger | ✅ `containerVariants` stagger | ✅ Done |
| 142 | Skeleton loading grid | ✅ Placeholder cards | ✅ Shimmer skeleton | ❓ | ✅ Adopt — add skeleton loading cards |
| 143 | Empty state design | ✅ "No results" with illustration | ✅ Map-based empty state | ❓ | ✅ Adopt — branded empty state illustration |
| 144 | Filter bar above grid | ✅ Sort dropdown | ✅ Price/Type/Filters bar | ❌ Missing | ✅ Adopt — critical: add sort/filter bar |
| 145 | Sort options | ✅ Recommended, Rating, Distance | ✅ Price, Rating | ❌ Missing | ✅ Adopt — Recommended/Rating/Distance/Price sorts |

### H. Card Interaction & Motion

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 146 | Card hover lift | ✅ Subtle shadow increase | None | ❓ | ✅ Adopt — `hover:translateY(-2px)` + shadow |
| 147 | Card press/active state | ✅ Slight scale down | None | ❓ | ✅ Adopt — `active:scale-[0.99]` |
| 148 | Image zoom on hover | ❌ | ❌ | ❌ | ⏭️ Skip — can be distracting |
| 149 | Favorite toggle haptic feedback | N/A (web) | N/A (web) | None | ⏭️ Skip — web limitation |
| 150 | Swipe to see more images (mobile) | None (single image) | ✅ Swipe carousel | ❌ Missing | ✅ Adopt — touch carousel on cards |

### I. Card Types & Variants

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 151 | Standard listing card | ✅ | ✅ | ✅ | ✅ Done |
| 152 | Featured/promoted card | ✅ "Featured" badge | ✅ "Guest favourite" | ❌ Missing badge | ✅ Adopt — add featured badge |
| 153 | "Deals" card variant | ✅ Tagged with special styling | None | ❌ Missing | ✅ Adopt — LastMinute/Deals tag |
| 154 | "New" salon card variant | None special | ✅ "New" badge | ❌ Missing | ✅ Adopt — "Neu bei Solen" badge |
| 155 | Horizontal card (for lists) | ✅ List view cards | None | ❌ Missing | ✅ Adopt — for search results list view |
| 156 | Map card (compact) | ✅ In map view | ✅ Map popup card | ❌ Missing | ✅ Adopt — when map view is built |
| 157 | Recently viewed card | None special | None special | ✅ RecentlyViewed component | ✅ Done |
| 158 | "Near you" card variant | None special | None special | ✅ nearbySalons | ✅ Done |
| 159 | Sponsored/ad card | None visible | None visible | None | ⏭️ Skip — future monetization |
| 160 | Collection/wishlists card | None | ✅ Wishlist grouped cards | ❌ Missing | 🔄 Adapt — add "Sammlungen" feature later |

### J. Card Content — Advanced

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 161 | Team member avatar on card | ❌ | N/A | ❌ | ⏭️ Skip — detail page only |
| 162 | Service category tags on card | ✅ "Manicure", "Gel Nails" chips | N/A | ❌ Missing | ✅ Adopt — show 2-3 service chips below name |
| 163 | "Pay by app" indicator | ✅ | N/A | ❌ Missing | 🔄 Adapt — "Online bezahlen" icon |
| 164 | Cancellation policy indicator | ✅ "Cancellation fee" in services | ✅ "Free cancellation" | ❌ Missing | ✅ Adopt — "Kostenlose Stornierung" badge |
| 165 | WiFi/Parking/Amenity icons | None on cards | ✅ Amenity icons on detail | ❌ Missing | 🔄 Adapt — save for detail page |
| 166 | Multi-location indicator | ✅ "Other locations" section | None | ❌ Missing | ✅ Adopt — "2 Standorte" chip |
| 167 | Salon chain/brand logo | ❌ | N/A | ❌ | ⏭️ Skip — not relevant |
| 168 | Walk-in availability | ❌ | N/A | ❌ | ✅ Adopt — "Walk-in möglich" badge |
| 169 | Male/Female/Unisex indicator | ❌ | N/A | ❌ | 🔄 Adapt — subtle icon for gender specialization |
| 170 | Language spoken | ✅ On team profiles | N/A | ❌ Missing | 🔄 Adapt — "DE/EN/FR" language tags |
| 171 | Eco/sustainability badge | None | None | None | ⏭️ Skip — future feature |
| 172 | Accessibility info | None | ✅ Accessibility features | None | 🔄 Adapt — ♿ icon for accessible salons |
| 173 | COVID safety protocols | Outdated | Removed | None | ⏭️ Skip — no longer relevant |
| 174 | Payment methods accepted | None on cards | None | None | ⏭️ Skip — detail page |
| 175 | Loyalty/reward indicator | None | None | None | ⏭️ Skip — future feature |
| 176 | Age restriction indicator | None | None | None | ⏭️ Skip — not relevant |
| 177 | Appointment required indicator | ✅ Implied by booking system | ✅ Implied | ❓ | ⏭️ Skip — all are appointment-based |
| 178 | Response time | None | ✅ "Usually responds within 1 hour" | None | 🔄 Adapt — future: show average response time |
| 179 | Social proof count | None | ✅ "Booked X times this week" | None | ✅ Adopt — "12× diese Woche gebucht" |
| 180 | Card accessibility (ARIA) | ❓ | ✅ Proper ARIA labels | ❓ | ✅ Adopt — ensure `aria-label`, `role="article"` |
