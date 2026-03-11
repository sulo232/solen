/**
 * src/modules/analytics.js — Client-side event tracking.
 *
 * Extracted from index.html: solenTrack ~4076, trackEvent ~12483,
 * scroll depth IIFE ~4086.
 *
 * Two-tier tracking:
 *  1. In-memory buffer (`_events`) — always available, zero latency
 *  2. Supabase `analytics_events` table — persisted for owner dashboards
 *
 * Google Analytics (gtag) is also fired if present on the page.
 */

import { supabase } from '@/services/supabase.js';
import { store } from '@/store/index.js';

// ---------------------------------------------------------------------------
// In-memory event buffer (mirrors window._solenEvents)
// ---------------------------------------------------------------------------

const _events = [];

// ---------------------------------------------------------------------------
// Core tracker
// ---------------------------------------------------------------------------

/**
 * Track a client-side event.
 * Fires gtag if available; always buffers in memory.
 * Does NOT write to Supabase — use `persistEvent` for that.
 *
 * @param {string} name   — snake_case event name
 * @param {object} [props]
 */
export function track(name, props = {}) {
  const entry = { name, props, ts: Date.now() };
  _events.push(entry);

  if (import.meta.env.DEV) {
    console.debug('[analytics]', name, props);
  }

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, props);
  }
}

/**
 * Track AND persist an event to the `analytics_events` Supabase table.
 * Only fires when a user is logged in (avoids noise from anonymous sessions).
 *
 * @param {string} name
 * @param {object} [props]
 */
export async function persistEvent(name, props = {}) {
  track(name, props);

  const user = store.get('currentUser');
  if (!user) return;

  try {
    await supabase.from('analytics_events').insert({
      event: name,
      props: JSON.stringify(props),
      ts: new Date().toISOString(),
    });
  } catch (e) {
    // Non-critical — swallow silently
  }
}

// ---------------------------------------------------------------------------
// Scroll depth tracking
// ---------------------------------------------------------------------------

/**
 * Attach scroll depth tracking to the page.
 * Fires track('scroll_depth', { pct }) at 25 / 50 / 75 / 100 %.
 * Call once after DOMContentLoaded.
 */
export function initScrollDepthTracking() {
  if (typeof window === 'undefined') return;

  let maxDepth = 0;
  const milestones = new Set();

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.body.scrollHeight;
    if (!total) return;

    const depth = Math.round((scrolled / total) * 100);
    if (depth > maxDepth) {
      maxDepth = depth;
      for (const pct of [25, 50, 75, 100]) {
        if (depth >= pct && !milestones.has(pct)) {
          milestones.add(pct);
          track('scroll_depth', { pct });
        }
      }
    }
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// Page view
// ---------------------------------------------------------------------------

/**
 * Track a page view.
 * @param {string} page — page identifier, e.g. 'home', 'book/abc123'
 */
export function trackPageView(page) {
  track('page_view', { page });
}

// ---------------------------------------------------------------------------
// Event log accessor (useful for debugging / owner reporting)
// ---------------------------------------------------------------------------

/**
 * Return a copy of all in-memory tracked events for this session.
 * @returns {object[]}
 */
export function getSessionEvents() {
  return [..._events];
}
