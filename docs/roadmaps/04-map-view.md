# Roadmap 04 — Map View

> **Scope**: Split-screen map, interactive pins, card-pin sync, mobile map toggle
> **DB Status**: `salons.latitude`, `salons.longitude` exist for all salons. `mapbox-gl` is installed in `node_modules`.
> **Env needed**: `NEXT_PUBLIC_MAPBOX_TOKEN` — free tier gives 50,000 map loads/month.
> **Effort**: 🟡 Medium (~15 audit points)

---

## Phase 1: Map Component

### 1.1 Build MapView component

**WHY**: Visual discovery is fundamentally different from list-based discovery. A map lets users see spatial relationships — "oh, there are 3 salons near my office, and 2 near my apartment." This is especially powerful in Basel, which has distinct neighborhoods (Kleinbasel, Gundeli, St. Johann) with very different vibes. Users who prefer a specific area can immediately see all options there. Airbnb made maps a core navigation paradigm for this exact reason.

**BENCHMARK**:
- **Airbnb**: Full interactive Mapbox/Google Maps integration. Pins are custom HTML elements showing prices ("$150/night"). Map is the primary discovery tool for many users. "Search as I move the map" toggle auto-updates results.
- **Fresha**: Basic Google Maps with standard pins on search results page. Less interactive.

**HOW**:
- **File**: New `components/map/MapView.tsx`
- **Library**: `mapbox-gl` — already in `package.json` / `node_modules`. Import: `import mapboxgl from 'mapbox-gl'; import 'mapbox-gl/dist/mapbox-gl.css';`
- **Token**: `mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;`
- **Default center**: Basel `[7.5886, 47.5596]`, zoom level 13 (shows all of Basel)
- **Map style**: `mapbox://styles/mapbox/light-v11` — clean, modern, monochrome. Matches Solen's white aesthetic. Alternative: `streets-v12` for more detail.
- **Controls**:
  - Zoom buttons: bottom-right (`new mapboxgl.NavigationControl({ showCompass: false })`)
  - Geolocate button: top-right (`new mapboxgl.GeolocateControl()`) — centers map on user's location
  - No compass, no scale bar (keeps UI clean)
- **Responsiveness**: Map resizes with container. Use `ResizeObserver` or `map.resize()` on container change.
- **Touch**: Pinch-to-zoom on mobile, two-finger drag for map panning

**IMPACT**: Opens an entirely new way to discover salons. Location-conscious users (most people when choosing a salon) get a superior experience.

---

### 1.2 Add salon pins

**WHY**: Default Mapbox markers are generic red pins — they communicate nothing about the salons. Custom pins with price labels (Airbnb-style) give users instant information without clicking each pin. Users can scan the map and immediately see which area has affordable options.

**BENCHMARK**:
- **Airbnb**: Custom HTML markers showing price as text ("$150"). Hover/click state: darker, larger. Already-viewed markers are slightly faded.
- **Fresha**: Standard Google Maps pins, no custom data.

**HOW**:
- **Data**: All salons from current filtered results (same list as card view)
- **Custom marker design**: HTML markers via `new mapboxgl.Marker({ element: customEl })`
  - Default state: Coral circle (24px) or pill with `"CHF XX"` price text (white bg, dark text, rounded-full, subtle shadow)
  - Hover state: Larger (32px), elevated shadow, bold text
  - Active (clicked) state: Coral bg, white text
  - Viewed state: Slightly faded `opacity-0.7`
- **Clustering**: When zoom < 12: Use `mapboxgl.Supercluster` to group nearby pins into clusters showing count: "12 Salons"
- **Performance**: Use `GeoJSON` source with symbols layer for better performance with 100+ pins

**IMPACT**: Users can visually scan pricing and density across Basel. Makes the map functional, not just decorative.

---

### 1.3 Pin click → popup card

**WHY**: When a user clicks a pin, they need immediate context about that salon without leaving the map view. A mini card popup provides just enough info (photo, name, rating, price) to decide whether to click through to the full detail page.

**BENCHMARK**:
- **Airbnb**: Custom popup with mini listing card: photo carousel, title, price, rating. Click card → listing page.
- **Fresha**: Basic info window with name only.

**HOW**:
- **Popup style**: Mapbox popup with custom HTML content:
  - Salon photo (80×60, `rounded-lg object-cover`)
  - Name (`font-semibold text-[14px]`)
  - Rating (`"★ 4.9"`) + price (`"ab CHF 35"`)
  - "Ansehen →" link → navigates to salon detail page
- **Position**: Above pin, with arrow pointing down to pin location
- **Close**: Click outside, click X button, or click another pin
- **Animation**: Popup fades in with `opacity 0→1` transition

**IMPACT**: Users can browse the map and get instant context on each salon. Reduces pin-clicking fatigue.

---

## Phase 2: Split-Screen Layout

### 2.1 Desktop split view

**WHY**: The most powerful pattern in location-based discovery is the split view — list on the left for detailed comparison, map on the right for spatial context. Users get the best of both worlds: they can scroll through cards AND see where each salon is on the map. This is Airbnb's signature desktop layout and the gold standard for marketplace search results.

**BENCHMARK**:
- **Airbnb**: `grid-cols-[1fr_1fr]` — left = scrollable card list, right = sticky map that fills viewport height. Card hover highlights corresponding pin.
- **Fresha**: Similar layout but simpler. List on left, map on right, less interactivity.

**HOW**:
- **File**: New `components/search/SplitMapView.tsx`
- **Layout**: `grid grid-cols-[1fr_1fr]` (50/50 split). Or `grid-cols-[55%_45%]` to give more space to cards.
- **Left panel**: Scrollable card list (single column). Use `SalonCard` component. Has its own scroll: `overflow-y-auto max-h-[calc(100vh-header-height)]`
- **Right panel**: Sticky map. `position: sticky; top: header-height; height: calc(100vh - header-height)`. Map fills the entire right side.
- **Results count**: Above card list: "42 Ergebnisse in Basel"
- **Toggle**: "Liste anzeigen" / "Mit Karte" toggle to switch between full grid and split view

**IMPACT**: The ultimate discovery experience. Users see everything at once — location, photos, prices, ratings. Used for search results and category pages.

---

### 2.2 Mobile map toggle

**WHY**: On mobile, there's no room for split view. Instead, we use a toggle pattern — users can switch between card list and full-screen map. A floating "Karte" button is always accessible without disrupting the list browsing experience.

**BENCHMARK**:
- **Airbnb**: Floating "Map" pill at bottom of list view. Tapping opens full-screen map with card carousel at bottom. "List" pill to go back.
- **Fresha**: "Map" tab toggle at top of results.

**HOW**:
- **"Karte" button**: Floating pill, centered horizontally, positioned 80px above BottomTabBar
  - Style: `bg-[#222] text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 text-sm font-semibold`
  - Icon: Lucide `Map` icon (16px) + "Karte" text
  - `backdrop-filter: blur(20px)` for premium glass feel
- **Map mode**: Full-screen map overlay. Bottom: horizontal card carousel (100px height, scrollable, shows mini salon cards). Swipe cards to pan map to corresponding pin.
- **"Liste" button**: Same style, replaces "Karte" button when in map mode. Returns to card list.
- **Transition**: Framer Motion: map slides up from bottom, cards slide down

**IMPACT**: Mobile users get spatial awareness without sacrificing list browsability. Key feature for "on the go" salon discovery.

---

### 2.3 Card ↔ Pin sync

**WHY**: The split view is only powerful if the two sides talk to each other. Hovering a card should light up the corresponding pin, and vice versa. This creates a connected, intuitive experience where the map and list feel like one unified interface, not two separate panels.

**BENCHMARK**:
- **Airbnb**: Full bi-directional sync. Hover card → pin enlarges and darkens. Hover pin → card gets a blue outline and scrolls into view. Click pin → scrolls to card.

**HOW**:
- **Shared state**: `const [hoveredSalonId, setHoveredSalonId] = useState<string | null>(null)`
- **Card → Pin**: Card `onMouseEnter` sets `hoveredSalonId` → pin with matching ID gets `scale(1.3)` transform + darker/coral background + z-index raise
- **Pin → Card**: Pin `onMouseEnter` sets `hoveredSalonId` → Card with matching ID gets `ring-2 ring-s-coral` outline + `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
- **Click pin**: Scrolls card list to that salon's card + opens popup
- **Click card**: Pans map to center on that salon's pin + opens popup

**IMPACT**: Creates a "magical" feeling of connection between list and map. Users discover salons faster by cross-referencing location and details.

---

## Phase 3: Map Search

### 3.1 "Search as I move the map" toggle

**WHY**: When users drag the map to a different area (e.g., from Gundeli to Kleinbasel), the results should update to show salons in the new visible area. This auto-refresh saves users from having to manually re-search. Airbnb pioneered this and it's now expected in any map-based search.

**HOW**:
- **Toggle**: Checkbox at top-left of map: ☑️ "Suche aktualisieren, wenn ich die Karte bewege"
- **On map `moveend` event**: Get visible bounds → `map.getBounds()` returns `{north, south, east, west}`
- **Re-query**: 
  ```sql
  SELECT * FROM salons 
  WHERE latitude BETWEEN $south AND $north 
  AND longitude BETWEEN $west AND $east 
  AND is_active = true
  ```
- **Debounce**: 500ms after map stops moving (prevents excessive queries during drag)
- **Loading indicator**: Brief spinner in card list while new results load

### 3.2 "Redo search here" button (alternative pattern)
**WHY**: Some users prefer manual control — they don't want results changing as they pan.
**HOW**: When map bounds change and auto-search is off, show a white pill button centered at top of map: "In diesem Bereich suchen". Click → re-queries with current bounds.

**IMPACT**: Users can explore any area and discover salons there. Makes the map a true discovery tool, not just a visualization.
