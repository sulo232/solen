/**
 * Safe event handler utilities — especially for touch events.
 *
 * This project targets mobile-first. Raw addEventListener calls scattered
 * across the codebase have caused issues with passive listeners, touch vs.
 * pointer conflicts, and duplicate handler registration. Centralise them here.
 *
 * Exports (to be implemented):
 *   on(el, type, handler, options?)  — addEventListener with dedup guard
 *   off(el, type, handler)           — paired removeEventListener
 *   once(el, type, handler)          — fires exactly once then cleans up
 *   onTap(el, handler)               — unified click + touchend handler
 *                                      with 300ms click-delay prevention
 *   delegate(root, selector, type, handler) — event delegation helper
 *
 * All handlers registered through this module are stored in a WeakMap so they
 * can be reliably removed even when the caller no longer holds a reference to
 * the original function.
 *
 * Usage:
 *   import { onTap, delegate } from '@/utils/events.js';
 */

// TODO: implement safe event handler utilities
