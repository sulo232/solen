/**
 * DOM utility helpers.
 *
 * Thin wrappers around common DOM operations to reduce boilerplate and keep
 * UI code readable. Prefer these over raw querySelector calls so we have a
 * single place to add error handling or SSR guards later.
 *
 * Exports (to be implemented):
 *   qs(selector, root?)        — querySelector with a clear error on miss
 *   qsa(selector, root?)       — querySelectorAll returning a real Array
 *   show(el) / hide(el)        — toggle display visibility
 *   addClass / removeClass      — safe class manipulation
 *   setAttr / removeAttr        — attribute helpers
 *   createEl(tag, attrs, text) — createElement shorthand
 *
 * Usage:
 *   import { qs, qsa, show, hide } from '@/utils/dom.js';
 */

/**
 * Shorthand for document.getElementById with null safety.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export const byId = (id) => document.getElementById(id);

/**
 * Shorthand for querySelector with null safety.
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {Element|null}
 */
export const qs = (selector, root = document) => root.querySelector(selector);

/**
 * Shorthand for querySelectorAll, returns an Array (not NodeList).
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {Element[]}
 */
export const qsa = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

/**
 * Show an element by removing the 'hidden' class / clearing display.
 * @param {Element|null} el
 */
export function show(el) {
  if (!el) return;
  el.classList.remove('hidden');
  if (el.style.display === 'none') el.style.display = '';
}

/**
 * Hide an element by adding the 'hidden' class.
 * @param {Element|null} el
 */
export function hide(el) {
  if (!el) return;
  el.classList.add('hidden');
}

/**
 * Toggle visibility of an element.
 * @param {Element|null} el
 * @param {boolean} [force]
 */
export function toggle(el, force) {
  if (!el) return;
  const shouldShow = force !== undefined ? force : el.classList.contains('hidden');
  shouldShow ? show(el) : hide(el);
}

/**
 * Set inner text safely (no XSS risk).
 * @param {Element|null} el
 * @param {string} text
 */
export function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

/**
 * Create an element with optional classes and attributes.
 * @param {string} tag
 * @param {{ class?: string, [attr: string]: string }} [attrs]
 * @param {string} [innerHTML]
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, text = '') {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'class') element.className = val;
    else element.setAttribute(key, val);
  });
  if (text) element.textContent = text;
  return element;
}

/**
 * Scroll an element into view smoothly.
 * @param {Element|string} elOrSelector
 * @param {'start'|'center'|'end'|'nearest'} [block='start']
 */
export function scrollIntoView(elOrSelector, block = 'start') {
  const target =
    typeof elOrSelector === 'string' ? qs(elOrSelector) : elOrSelector;
  target?.scrollIntoView({ behavior: 'smooth', block });
}

/**
 * Add a CSS class temporarily (e.g. for animation triggers).
 * @param {Element|null} el
 * @param {string} cls
 * @param {number} [durationMs=300]
 */
export function flashClass(el, cls, durationMs = 300) {
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), durationMs);
}

/**
 * Wait for a CSS transition on an element to end.
 * @param {Element} el
 * @returns {Promise<void>}
 */
export function waitForTransition(el) {
  return new Promise((resolve) => {
    el.addEventListener('transitionend', resolve, { once: true });
  });
}
