# 📱 Mobile UI Refinement & Bug Fix Plan (Claude Code Strategy)

This document provides a highly structured, agent-friendly plan to identify, document, and fix UI bugs across the Solen platform. The primary focus is **mobile UI**, ensuring text consistency, readability (especially within glassmorphism components), and maintaining a premium aesthetic.

---

## 🕵️ Phase 1: Bug Identification & UI Auditing (Agent Instructions)

**Prompt for Claude Code to start:**
*"Claude, please run a comprehensive mobile UI audit based on Phase 1 of `CLAUDE_MOBILE_UI_PLAN.md`."*

**Agents should scan the codebase (`index.html`, `index.css`, JS files) for:**

1. **Text & Typography Inconsistencies**:
   - Scan all heading (`h1`-`h6`) and paragraph tags for inconsistent font sizes, rogue inline styles, or incorrect font weights.
   - Detect missing usage of established tokens (e.g., `DM Serif Display` for headings vs. `DM Sans` for body).

2. **Glassmorphism Readability Flags**:
   - Locate every element using `backdrop-filter: blur(...)` combined with semi-transparent backgrounds.
   - Flag any child text elements inside these glass panels that do not explicitly define a high-contrast text color or lack sufficient text-shadow.

3. **Mobile Layout & Tap Target Issues**:
   - Identify interactive elements (buttons, links, chips) with a computed height/width of less than `44px` (Apple's minimum tap target standard).
   - Find CSS classes that might cause horizontal scrolling on mobile (e.g., elements wider than `100vw` without `box-sizing: border-box` or missing `overflow-x: hidden` on parent containers).

---

## 🛠️ Phase 2: Specific Known Issues & Resolution Guides

### 2.1 Glassmorphism Readability (CRITICAL)
**The Problem**: Text inside frosted glass components is difficult to read because the background opacity is too low, or the blur doesn't diffuse the underlying content enough, causing contrast failure.

**How to Fix:**
- **Increase Blur & Base Opacity**: Update CSS classes to use a stronger blur and a slightly more opaque background. 
  *Light Mode*: `background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px);`
  *Dark Mode*: `background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(16px);`
- **Text Enhancement**: Add a subtle text shadow to typography resting on glass to detach it from the background noise.
  `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);` (for dark text) or `rgba(0,0,0,0.5)` (for light text).
- **Enforce Contrast**: Ensure text inside the glass panel is strongly contrasted (`var(--c-text-main)` or pure `#FFF`/`#000`).

### 2.2 Text & Typography Consistency
**The Problem**: Various font sizes, line heights, and colors are mixed haphazardly across mobile views, breaking the premium feel.

**How to Fix:**
- **Standardize Variables**: Ensure all text utilizes standardized CSS variables (e.g., `font-size: var(--text-sm)`).
- **Cleanup Inline Styles**: Strip any hardcoded inline typography styles (`style="font-size: 14px"`) from HTML elements.
- **Line Heights**: Enforce `line-height: 1.5` for all body text to give it breathing room on small screens, and `line-height: 1.1` to `1.2` for headings.

### 2.3 Mobile-Specific Spacing & Sizing
**The Problem**: UI elements are cramped against screen edges, or cards don't scale correctly on smaller devices.

**How to Fix:**
- **Global Padding**: Ensure the root mobile container has a consistent edge padding: `padding-left: 16px; padding-right: 16px;`.
- **Flex & Grid Wrapping**: Check flex containers for `flex-wrap: wrap` to prevent items from squishing together or overflowing off-screen.

---

## 🚀 Phase 3: Claude Code Execution Workflow

To fix these systematically, ask Claude Code to spawn agents or handle tasks in the following sequential order:

1. **Task 1 (Design Tokens & Typo Cleanup)**: 
   *"Claude, standardize all text elements in the codebase to use our CSS variables. Remove any inline font styles and ensure line heights are optimized for mobile."*

2. **Task 2 (Glassmorphism Overhaul)**: 
   *"Claude, search the CSS for all glassmorphism effects (`backdrop-filter`). Apply the fixes from Section 2.1 of the UI plan to ensure all text inside these containers is 100% readable."*

3. **Task 3 (Mobile Layout & Tap Targets)**: 
   *"Claude, review all buttons and interactive elements for a minimum size of 44x44px. Fix any mobile padding issues and ensure no horizontal overflow exists on screen widths under 768px."*

4. **Task 4 (Aesthetic Polish)**:
   *"Claude, do a final review of the mobile view. Ensure the UI feels premium, consistent, and perfectly aligned."*
