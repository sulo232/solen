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

// TODO: implement DOM helpers
