# Solen Salon Cards — Airbnb UI Rules & Specs

This document defines the strict UI and data rules for the new Airbnb-style `SalonCard.tsx` implementation.

## 1. Badge Priority Logic
Badges must overlap the top-left corner of the image carousel. A salon can only display **one badge at a time** from this tier list, evaluated in exact order of priority:

1. **Guest Favorite ("Guest Favorite")**
   - **Condition:** `average_rating >= 4.9` AND `review_count > 50`
   - **Styling:** White background pill, text in dark ink. Must include a Leaf Wreath icon (or `LucideAward` / `LucideCrown` mapped to `text-s-coral` if wreath unavailable).

2. **Neu ("Neu auf Solen")**
   - **Condition:** `review_count === 0`
   - **Styling:** Solid `bg-s-coral` pill with white text for maximum visibility.

3. **Top Rated ("Top Rated")**
   - **Condition:** `average_rating >= 4.8` AND `review_count > 20`
   - **Styling:** White background pill, text in dark ink.

(Categories like 'Available today' or Solen-specific 'gold' tiers are deprioritized or moved to the bottom-right/bottom-left overlay areas to keep the top-left clean).

## 2. Dynamic Price Tiering
Exact price strings are no longer shown on the main discovery cards. Prices must be bucketed into the string symbols (`$`, `$$`, `$$$`).

- **Logic:** Calculate `priceToShow` (minimum price of services, or an aggregated average if available).
  - **`$` (Cheap):** `< 40 CHF`
  - **`$$` (Mid):** `>= 40 CHF` AND `<= 80 CHF`
  - **`$$$` (Max):** `> 80 CHF`
  
## 3. Metadata Structure & Typography 
The footer info content below the photo carousel must follow this exact horizontal row structure:

**Row 1: Title & Rating**
- Left: `salon.name` (Heading font, Semi-Bold, truncated, text size 15px).
- Right: Inline rating with a single solid dark star icon + rating number (e.g., `★ 4.95`).

**Row 2: Location**
- Left: Neighborhood/Postal Code + Distance (e.g., "8004 Zürich, 1.2 km entfernt"). Text is faded body font (`text-s-ink/60`).

**Row 3: Pricing & Category**
- Left: The price tier (`$$`), a center dot `·`, followed by the exact primary category name (e.g., "Nail Salon"). Faded body font.

## 4. Carousel Specifications
- Desktop users use left/right arrows or dots.
- Mobile users use horizontal swipe.
- Snap-scrolling is mandatory (`snap-x`, `snap-mandatory`).
- Provide an empty fallback placeholder showing a gradient background with the category icon if `allPhotos` length is 0.
