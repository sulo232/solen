// editor-bridge.js — Injected into iframe by the visual editor
// Only activates when receiving EDITOR_ACTIVATE from parent
// ZERO impact on normal site visitors
(function() {
  'use strict';

  let active = false;
  let hoveredEl = null;
  const PARENT_ORIGIN = window.location.origin;

  // ── Security: only accept messages from same origin ──
  window.addEventListener('message', (e) => {
    if (e.origin !== PARENT_ORIGIN) return;
    if (e.data?.type === 'EDITOR_ACTIVATE') {
      active = true;
      document.body.style.cursor = 'crosshair';
    }
    if (e.data?.type === 'EDITOR_DEACTIVATE') {
      active = false;
      document.body.style.cursor = '';
      removeHighlight();
    }
    if (e.data?.type === 'EDITOR_NAVIGATE') {
      window.location.href = e.data.url;
    }
  });

  // ── CSS selector path builder ──
  function getCssPath(el) {
    const parts = [];
    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();
      if (el.id) selector += '#' + el.id;
      else if (el.className && typeof el.className === 'string') {
        const cls = el.className.split(' ')
          .filter(c => c && !c.startsWith('__') && !c.startsWith('css-'))
          .slice(0, 2).join('.');
        if (cls) selector += '.' + cls;
      }
      parts.unshift(selector);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  // ── Component hint: walk up to find data-component attr ──
  function getComponentHint(el) {
    let current = el;
    while (current && current !== document.body) {
      if (current.dataset?.component) return current.dataset.component;
      current = current.parentElement;
    }
    return null;
  }

  // ── Highlight overlay ──
  const overlay = document.createElement('div');
  overlay.id = '__editor-highlight';
  overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #6BA3C8;' +
    'background:rgba(107,163,200,0.08);z-index:99999;transition:all 0.15s ease;' +
    'display:none;border-radius:4px;';
  document.body.appendChild(overlay);

  // Label tooltip showing tag/class
  const label = document.createElement('div');
  label.id = '__editor-label';
  label.style.cssText = 'position:fixed;pointer-events:none;z-index:100000;' +
    'background:#1A1209;color:#FAF6EF;font-size:11px;font-family:monospace;' +
    'padding:2px 6px;border-radius:3px;display:none;white-space:nowrap;';
  document.body.appendChild(label);

  function showHighlight(rect, el) {
    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    // Show label above element
    const tagInfo = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
      ? '.' + el.className.split(' ').filter(c => c).slice(0, 1).join('')
      : '');
    label.textContent = tagInfo;
    label.style.display = 'block';
    label.style.left = rect.left + 'px';
    label.style.top = Math.max(0, rect.top - 22) + 'px';
  }

  function removeHighlight() {
    overlay.style.display = 'none';
    label.style.display = 'none';
  }

  // ── Hover ──
  document.addEventListener('mousemove', (e) => {
    if (!active) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === overlay || el === label || el === hoveredEl) return;
    hoveredEl = el;
    const rect = el.getBoundingClientRect();
    showHighlight(rect, el);

    window.parent.postMessage({
      type: 'EDITOR_ELEMENT_HOVERED',
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 100),
    }, PARENT_ORIGIN);
  });

  // ── Click ──
  document.addEventListener('click', (e) => {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    const rect = el.getBoundingClientRect();

    // Switch highlight to coral (selected state)
    overlay.style.borderColor = '#E8624A';
    overlay.style.background = 'rgba(232,98,74,0.08)';
    label.style.background = '#E8624A';

    window.parent.postMessage({
      type: 'EDITOR_ELEMENT_SELECTED',
      selector: getCssPath(el),
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className || null,
      text: (el.textContent || '').trim().slice(0, 200),
      componentHint: getComponentHint(el),
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      pageUrl: window.location.pathname,
    }, PARENT_ORIGIN);
  }, true);

  // ── Intercept fetch() — block mutating API calls ──
  const originalFetch = window.fetch;
  window.fetch = function(url, opts) {
    const method = (opts?.method || 'GET').toUpperCase();
    if (typeof url === 'string' && url.startsWith('/api/') && method !== 'GET') {
      console.log('[editor-bridge] Blocked mutating fetch:', method, url);
      return Promise.resolve(new Response(
        JSON.stringify({ blocked: true, reason: 'editor-preview-mode' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));
    }
    return originalFetch.apply(this, arguments);
  };

  // ── Intercept XMLHttpRequest — block mutating XHR to /api/ only ──
  // Note: Does NOT block XHR to external URLs (analytics/PostHog, CDNs, etc.)
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._editorMethod = method;
    this._editorUrl = typeof url === 'string' ? url : String(url);
    return originalXhrOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    const method = (this._editorMethod || 'GET').toUpperCase();
    const url = this._editorUrl || '';
    // Only block mutating calls to OUR /api/ routes — never block external URLs
    const isInternalApi = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
    if (isInternalApi && method !== 'GET') {
      console.log('[editor-bridge] Blocked mutating XHR:', method, url);
      // Fire readystatechange + load events with fake success
      Object.defineProperty(this, 'readyState', { value: 4, writable: false });
      Object.defineProperty(this, 'status', { value: 200, writable: false });
      Object.defineProperty(this, 'responseText', { value: '{"blocked":true,"reason":"editor-preview"}', writable: false });
      this.dispatchEvent(new Event('readystatechange'));
      this.dispatchEvent(new Event('load'));
      return;
    }
    return originalXhrSend.apply(this, arguments);
  };

  // ── Notify parent that bridge is ready ──
  window.parent.postMessage({ type: 'EDITOR_BRIDGE_READY' }, PARENT_ORIGIN);
})();
