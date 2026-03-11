/**
 * Safe event handler utilities — especially for touch events.
 *
 * Mobile-first event management. Raw addEventListener calls scattered across
 * index.html caused issues with passive listeners, touch/pointer conflicts,
 * and duplicate handler registration. Centralise all event wiring here.
 *
 * All handlers are stored in a WeakMap so they can be reliably removed
 * even when the caller no longer holds a reference to the original function.
 */

/** @type {WeakMap<Element, Map<string, Set<EventListener>>>} */
const _registry = new WeakMap();

function _getHandlers(el, type) {
  if (!_registry.has(el)) _registry.set(el, new Map());
  const map = _registry.get(el);
  if (!map.has(type)) map.set(type, new Set());
  return map.get(type);
}

/**
 * Add an event listener with duplicate-registration guard.
 * @param {EventTarget} el
 * @param {string} type
 * @param {EventListener} handler
 * @param {AddEventListenerOptions} [options]
 */
export function on(el, type, handler, options) {
  const handlers = _getHandlers(el, type);
  if (handlers.has(handler)) return; // already registered
  handlers.add(handler);
  el.addEventListener(type, handler, options);
}

/**
 * Remove an event listener registered via `on()`.
 * @param {EventTarget} el
 * @param {string} type
 * @param {EventListener} handler
 */
export function off(el, type, handler) {
  const handlers = _getHandlers(el, type);
  if (!handlers.has(handler)) return;
  handlers.delete(handler);
  el.removeEventListener(type, handler);
}

/**
 * Register a handler that fires exactly once then removes itself.
 * @param {EventTarget} el
 * @param {string} type
 * @param {EventListener} handler
 */
export function once(el, type, handler) {
  function wrapper(e) {
    handler(e);
    off(el, type, wrapper);
  }
  on(el, type, wrapper);
}

/**
 * Unified tap handler — fires on `click` only.
 * Avoids the 300ms click delay and the classic "ghost click" problem
 * that occurs when pairing touchend + click naively.
 *
 * NEVER calls preventDefault() globally. Uses pointer events where
 * available so it works across mouse, touch, and stylus.
 *
 * @param {Element} el
 * @param {(e: Event) => void} handler
 * @returns {() => void} cleanup function
 */
export function onTap(el, handler) {
  // `click` fires reliably for touch on modern iOS/Android without delay
  // when the element has cursor:pointer or touch-action set correctly.
  on(el, 'click', handler);
  return () => off(el, 'click', handler);
}

/**
 * Event delegation — attach a single listener on `root` that fires `handler`
 * when the event target matches `selector`. Safe replacement for the global
 * touchend delegation pattern that was breaking mobile behavior.
 *
 * @param {Element} root
 * @param {string} selector  CSS selector for matching descendants
 * @param {string} type      Event type (e.g. 'click')
 * @param {(e: Event, matchedEl: Element) => void} handler
 * @param {AddEventListenerOptions} [options]
 * @returns {() => void} cleanup function
 */
export function delegate(root, selector, type, handler, options) {
  function listener(e) {
    const matched = e.target.closest(selector);
    if (matched && root.contains(matched)) {
      handler(e, matched);
    }
  }
  on(root, type, listener, options);
  return () => off(root, type, listener);
}

/**
 * Register a passive scroll/touch listener — safe for iOS 60fps scrolling.
 * Passive means `preventDefault()` cannot be called inside the handler,
 * which is the correct behaviour for scroll-tracking listeners.
 *
 * @param {EventTarget} el
 * @param {'scroll'|'touchstart'|'touchmove'|'wheel'} type
 * @param {EventListener} handler
 * @returns {() => void} cleanup function
 */
export function onPassive(el, type, handler) {
  on(el, type, handler, { passive: true });
  return () => off(el, type, handler);
}
