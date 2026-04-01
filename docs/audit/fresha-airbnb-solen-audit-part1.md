# Solen × Fresha × Airbnb — Complete UI/UX Parity Audit

> **Goal**: Solen = midpoint of Fresha (beauty-booking specialist) + Airbnb (marketplace UX gold standard).
> Each point has a **Verdict**: ✅ Adopt | 🔄 Adapt | ⏭️ Skip — with reasoning.

---

## PART 1 — HEADER & NAVIGATION (Points 1–80)

### A. Logo & Branding

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 1 | Logo SVG crisp at all sizes | ✅ Sharp vector | ✅ Sharp vector | ✅ `/logo.svg` | ✅ Done |
| 2 | Logo height desktop | ~28px | ~30px | 28-32px (`h-7 sm:h-8`) | ✅ Done |
| 3 | Logo links to homepage | ✅ | ✅ | ✅ | ✅ Done |
| 4 | Logo animation on hover | None | None | None | ⏭️ Skip — unnecessary |
| 5 | Favicon matches brand | ✅ Green "F" | ✅ Pink Airbnb icon | ❓ Need to verify | ✅ Adopt — ensure brand favicon |
| 6 | Logo in mobile bottom nav | None | None | None | ⏭️ Skip — standard pattern |
| 7 | Logo position consistency | Always top-left | Always top-left | Top-left ✅ | ✅ Done |

### B. Desktop Header Layout

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 8 | Three-column layout (logo / center / actions) | ✅ | ✅ | ✅ flex-1/flex-[850px]/flex-1 | ✅ Done |
| 9 | Sticky header on scroll | ✅ | ✅ | ✅ `sticky top-0 z-50` | ✅ Done |
| 10 | Background blur on scroll | None (solid white) | None (solid white) | None (solid white) | ⏭️ Skip — solid is correct |
| 11 | Border-bottom appears on scroll | ✅ subtle | ✅ `#EBEBEB` | ✅ `border-[#EBEBEB]` | ✅ Done |
| 12 | Shadow appears on scroll | None | ✅ very subtle | ✅ `shadow-sm` | ✅ Done |
| 13 | Header height transition on scroll | None | ✅ Compact mode | ✅ pt-6 → pt-4 | ✅ Done |
| 14 | Header max-width constraint | ✅ ~1440px | ✅ 2520px | ✅ `max-w-[2520px]` | ✅ Done |
| 15 | Horizontal padding responsive | ✅ | ✅ ~24px mobile, ~80px desktop | `px-4 sm:px-6` (16/24px) | 🔄 Adapt — add `lg:px-10 xl:px-20` for wide screens |

### C. Search Bar — Desktop

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 16 | Prominent search bar homepage | ✅ Hero-level multi-field | ✅ 3-panel pill (Where/When/Who) | ✅ AirbnbSearchBar component | ✅ Done |
| 17 | Search bar shrinks on scroll | N/A (static hero) | ✅ Collapses to compact pill | ✅ `scrolled` state → pill | ✅ Done |
| 18 | Compact pill click → expand | N/A | ✅ Expands inline | Scrolls to top | 🔄 Adapt — should expand inline like Airbnb |
| 19 | Multi-field search (What/Where/When) | ✅ Service/Location/Date/Time | ✅ Where/Check-in/Guests | ✅ AirbnbSearchBar has panels | ✅ Done |
| 20 | Search field dividers | ✅ Vertical lines | ✅ Thin vertical borders | ❓ Need to verify | 🔄 Adapt — ensure subtle dividers |
| 21 | Search button with icon | ✅ Green "Search" button | ✅ Pink circle with magnifying glass | ❓ Need to verify | 🔄 Adapt — use coral circle icon |
| 22 | Search pill shadow | N/A | ✅ `0_1px_4px_rgba(0,0,0,0.1)` | ✅ Same shadow | ✅ Done |
| 23 | Search pill border | N/A | ✅ 1px `#DDDDDD` | ✅ Same border | ✅ Done |
| 24 | Search pill border-radius | N/A | ✅ Full `rounded-full` | ✅ `rounded-full` | ✅ Done |
| 25 | "Lights out" overlay when search active | None | ✅ Semi-transparent black | ✅ `bg-black/25` overlay | ✅ Done |
| 26 | Service type dropdown in search | ✅ Dedicated field | None (location-only) | Should have category filter | ✅ Adopt — Fresha-style service picker in search |
| 27 | Location autocomplete | ✅ Google Places | ✅ Google Places | ✅ City detection | 🔄 Adapt — add Google Places autocomplete |
| 28 | Date picker in search | ✅ Calendar widget | ✅ Calendar range picker | ✅ via GuidedSearch | ✅ Done |
| 29 | Time picker in search | ✅ Time slots | None | ✅ via GuidedSearch | ✅ Done — Fresha pattern |
| 30 | Search placeholder text | "Search for a treatment or venue" | "Search destinations" | "Salon suchen..." | 🔄 Adapt — more descriptive: "Service, Salon oder Ort suchen..." |

### D. Search Bar — Mobile

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 31 | Mobile search always visible in header | ✅ Compact bar | ✅ Compact pill at top | ✅ `md:hidden` search pill | ✅ Done |
| 32 | Mobile search tap → full-screen sheet | ✅ Bottom sheet | ✅ Full-screen takeover | ✅ `openSearchSheet` event | ✅ Done |
| 33 | Mobile search pill width | ~100% of header center | ~280px centered | `max-w-[300px]` | ✅ Done |
| 34 | Mobile search icon + placeholder | ✅ Glass + text | ✅ Glass + text | ✅ Search icon + "Salon suchen..." | ✅ Done |
| 35 | Recent searches in mobile search | ✅ Shows history | ✅ Shows recent | ❓ Missing | ✅ Adopt — add recent search history |
| 36 | Popular/trending searches | ✅ Trending treatments | None | ❓ Missing | ✅ Adopt — show trending categories |
| 37 | Voice search | None | None | None | ⏭️ Skip — not standard yet |
| 38 | Search by photo/image | None | None | None | ⏭️ Skip — future feature |

### E. Category Navigation — Desktop

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 39 | Horizontal icon strip | None (dropdown only) | ✅ Icon + text scrollable row | ✅ Emoji + text tabs | 🔄 Adapt — replace emojis with proper SVG icons |
| 40 | Icon style | N/A | Line-art, uniform 24px, monochrome | Emojis (✂️💅💈) | 🔄 Adapt — use custom SVG icons (already have CoiffeurIcon etc.) |
| 41 | Active indicator style | N/A | ✅ Thick black underline below text | ✅ `border-b-2 border-[#222222]` | ✅ Done |
| 42 | Hover indicator | N/A | ✅ Light gray underline | ✅ `group-hover:border-[#DDDDDD]` | ✅ Done |
| 43 | Category text size | N/A | ~12px semibold | ✅ `text-[12px] font-semibold` | ✅ Done |
| 44 | Category text color active | N/A | `#222222` | ✅ `text-[#222222]` | ✅ Done |
| 45 | Category text color inactive | N/A | `#717171` | ✅ `text-[#717171]` | ✅ Done |
| 46 | Scroll arrows on category strip | N/A | ✅ Left/right arrow buttons at edges | ❌ Missing | ✅ Adopt — add scroll arrows for keyboard/desktop |
| 47 | Category strip gradient fade at edges | N/A | ✅ White fade on left/right | ❌ Missing | ✅ Adopt — add gradient masks |
| 48 | Category icons animate on scroll | N/A | None (static) | Emojis collapse on scroll | 🔄 Adapt — icons should collapse cleanly to text-only |
| 49 | Number of visible categories | N/A | 8-12 visible at once | 6 categories | 🔄 Adapt — add Spa, Lashes, Massage categories |
| 50 | "All" / "Entdecken" as first tab | N/A | None (all categories are equal) | ✅ "✨ Entdecken" first | ✅ Done — good for discovery |
| 51 | Service sub-category chips on category page | ✅ "Gel Nails", "Manicure", etc. chips | None | ❌ Missing | ✅ Adopt — Fresha shows sub-type chips below header |
| 52 | "See map" toggle on category page | ✅ "See map" link | ✅ Map toggle button | ❌ Missing | ✅ Adopt — critical for location-based discovery |

### F. Category Navigation — Mobile

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 53 | Mobile category strip | ✅ Horizontal scroll | ✅ Same as desktop but smaller | ✅ Pill-style chips | ✅ Done |
| 54 | Mobile chip style (pill vs underline) | Pill/rounded | Underline | Pill (`rounded-full bg-[#1A1A1A]`) | ✅ Done — pill is better for touch |
| 55 | Active chip style | Highlighted/filled | Black underline | Black bg + white text | ✅ Done |
| 56 | Chip gap spacing | ~8px | ~12-16px | `gap-1` (4px) | 🔄 Adapt — increase to `gap-2` (8px) |
| 57 | Category strip border-bottom | ✅ Subtle | ✅ `#EBEBEB` | ✅ `border-[#F0F0F0]` | ✅ Done |
| 58 | Mobile strip disappears on scroll | N/A | Stays visible (sticky) | Hides when scrolled (`!scrolled`) | 🔄 Adapt — should stay sticky like Airbnb |

### G. User Menu & Actions — Desktop

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 59 | Hamburger + avatar button | None (text links) | ✅ Bordered pill with ☰ + avatar | ✅ Same pattern | ✅ Done |
| 60 | Avatar shows user initial when logged in | None | ✅ User photo or initial | Generic User icon | 🔄 Adapt — show user initial or photo |
| 61 | Dropdown menu on click | ✅ Simple dropdown | ✅ Animated popover | ✅ Framer Motion popover | ✅ Done |
| 62 | Dropdown shadow | ✅ | ✅ `0_8px_28px_rgba(0,0,0,0.15)` | ✅ Same shadow | ✅ Done |
| 63 | Dropdown border-radius | ✅ | ✅ 16px | ✅ `rounded-2xl` | ✅ Done |
| 64 | Menu items: Konto, Buchungen, Favoriten, Nachrichten | ✅ Account, Bookings | ✅ Messages, Trips, Wishlists | ✅ All four present | ✅ Done |
| 65 | Divider before logout | ✅ | ✅ | ✅ `border-t border-[#dddddd]` | ✅ Done |
| 66 | "Partner werden" / "Become a Host" link in menu | ✅ "For business" | ✅ "Become a host" | ❌ Not in dropdown | ✅ Adopt — add "Partner werden" to dropdown |
| 67 | Help Center link in menu | ✅ "Customer support" | ✅ "Help Center" | ❌ Missing | ✅ Adopt — add Hilfe link |
| 68 | Gift cards link | None | ✅ "Gift cards" | None | ⏭️ Skip — future feature |
| 69 | Language/currency switcher in header | ✅ (implicit by region) | ✅ Globe icon → modal | ✅ LanguageSwitcher component | ✅ Done |
| 70 | Notification bell | None visible | None visible | ✅ NotificationBell component | ✅ Done — ahead of both |

### H. Bottom Tab Bar — Mobile

| # | Feature | Fresha | Airbnb | Solen Now | Verdict |
|---|---------|--------|--------|-----------|---------|
| 71 | Fixed bottom navigation | ✅ 4-5 tabs | ✅ 5 tabs | ✅ 4 tabs (Home/Discover/Search/Profile) | ✅ Done |
| 72 | Tab bar background | ✅ Solid white | ✅ Solid white | ✅ Glassmorphism (rgba+blur) | 🔄 Adapt — keep glass but ensure readability |
| 73 | Tab bar height | ~56px | ~56px | 60px | ✅ Done |
| 74 | Tab icon size | ~22px | ~24px | 22px | ✅ Done |
| 75 | Tab label font size | ~10px | ~10px | 10px | ✅ Done |
| 76 | Active tab color | Green | Pink/coral | ✅ `s-coral` | ✅ Done |
| 77 | Inactive tab color | Gray | Gray #717171 | `#8A8A8A` | ✅ Done |
| 78 | Active indicator (dot/bar) | None | None | ✅ Animated dot below label | ✅ Done — exceeds both |
| 79 | Tap animation | None | None | ✅ Spring scale animation | ✅ Done — exceeds both |
| 80 | Safe area padding | ✅ | ✅ | ✅ `env(safe-area-inset-bottom)` | ✅ Done |
