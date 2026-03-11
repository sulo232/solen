# Solen.ch Roadmap (Claude Code Hand-off)

## Phase 4: iOS Safari WebKit Hit-Testing Bug Fix

### The Problem
While Phase 1 removed the destructive global JS `touchend` delegation script which fixed Android taps, taps on specific mobile elements are still failing exclusively on iOS Safari. 
The affected areas are:
- The Hamburger Menu
- The Bottom Navigation Links (`Entdecken`, `Login`, etc.)
- The Hero `Mein Standort` and `Karte` utility buttons

### Root Cause Analysis
All of the unresponsive elements share a common styling feature: they are situated inside or above a container that uses the CSS `backdrop-filter: blur(...)` property.

There is a known, long-standing bug in iOS Safari / WebKit where **interactive elements nested within or overlaying a `backdrop-filter` lose their ability to be tapped/clicked**. The browser engine fails to calculate the hit-box correctly because of how compositing layers are rendered.

### The Solution: Hardware Acceleration Layering
To fix this, we must force iOS Safari to render these specific clickable controls onto their own hardware-accelerated 3D layer, which breaks them out of the broken `backdrop-filter` hit-testing context.

### Instructions for Claude Code
Please implement the following CSS fix in the global stylesheet (`index.html` or the extracted CSS file for Phase 2):

1. **Create an explicit mobile media query** (e.g., `@media(max-width:768px)`).
2. **Target the affected UI elements**: `button, a, [role="button"], [onclick], .bottom-nav-item, .close-btn, .fav-btn, .hamburger, .theme-toggle`.
3. **Apply the 3D-transform layer hack**: Apply `position: relative; z-index: 1; transform: translateZ(0);` to those elements. The `translateZ(0)` is the critical part that forces the hardware acceleration.

```css
/* Add this logic to the CSS */
@media(max-width:768px) {
  button, a, [role="button"], [onclick], .bottom-nav-item, .close-btn, .fav-btn, .hamburger, .theme-toggle {
    position: relative;
    z-index: 1;
    transform: translateZ(0);
  }
}
```

Implement this change and test the build to confirm that taps over frosted glass containers are now fully registering on iOS devices.
