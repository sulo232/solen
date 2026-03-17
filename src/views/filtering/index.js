/**
 * src/views/filtering/index.js — Advanced filtering view.
 *
 * Phase 3 feature: extends the existing salon listing with:
 *  1. MapView       — Leaflet map with interactive markers, synced to active filters
 *  2. FilterPresets — save/restore named filter configurations
 *
 * XSS safety: all user-supplied content is set via .textContent or
 * .setAttribute() (never innerHTML). Static structural HTML is written
 * inline only where no user data is interpolated.
 *
 * Depends on Leaflet being loaded globally (already in index.html via CDN).
 */

// ---------------------------------------------------------------------------
// DOM helpers — create elements without innerHTML for user content
// ---------------------------------------------------------------------------

/** Create an element with optional class names. */
function el(tag, ...classes) {
  const e = document.createElement(tag);
  if (classes.length) e.className = classes.join(' ');
  return e;
}

/** Set textContent safely. */
function setText(element, value) {
  element.textContent = String(value ?? '');
  return element;
}

// ---------------------------------------------------------------------------
// MapView
// ---------------------------------------------------------------------------

const BASEL_CENTER = [47.5596, 7.5886];
const DEFAULT_ZOOM = 13;

/**
 * Interactive Leaflet map view for salon listings.
 * Syncs with the active filter results — markers update when filters change.
 */
export class MapView {
  #container;
  #map = null;
  #markers = [];

  /** @param {HTMLElement} container */
  constructor(container) {
    this.#container = container;
  }

  /** Initialize the Leaflet map. Call once after the container is visible. */
  init() {
    if (this.#map) return;
    if (!window.L) {
      console.warn('[MapView] Leaflet not loaded');
      return;
    }

    this.#container.style.minHeight = '400px';

    this.#map = window.L.map(this.#container, {
      center: BASEL_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.#map);
  }

  /**
   * Update map markers to reflect a filtered list of stores.
   * @param {object[]} stores
   * @param {(store: object) => void} [onStoreClick]
   */
  updateMarkers(stores, onStoreClick) {
    if (!this.#map) return;

    this.#markers.forEach((m) => m.remove());
    this.#markers = [];

    const validStores = (stores || []).filter((s) => s.lat && s.lng);

    validStores.forEach((store) => {
      const icon = this.#createMarkerIcon(store);
      const marker = window.L.marker([store.lat, store.lng], { icon }).addTo(this.#map);

      // Build popup content using DOM methods — no user content in innerHTML
      const popup = el('div', 'map-popup');

      const nameEl = el('div', 'map-popup-name');
      setText(nameEl, store.name || '');
      popup.appendChild(nameEl);

      if (store.address) {
        const addrEl = el('div', 'map-popup-addr');
        setText(addrEl, store.address);
        popup.appendChild(addrEl);
      }

      if (store.avg_rating) {
        const ratingEl = el('div', 'map-popup-rating');
        const stars = '\u2605'.repeat(Math.round(Math.min(5, Math.max(0, Number(store.avg_rating)))));
        const score = Number(store.avg_rating).toFixed(1);
        setText(ratingEl, `${stars} ${score}`);
        popup.appendChild(ratingEl);
      }

      const btn = el('button', 'map-popup-btn');
      setText(btn, 'Salon ansehen');
      btn.type = 'button';
      btn.addEventListener('click', () => onStoreClick?.(store), { once: true });
      popup.appendChild(btn);

      marker.bindPopup(popup, { maxWidth: 220 });
      this.#markers.push(marker);
    });

    if (validStores.length > 0) {
      const latlngs = validStores.map((s) => [s.lat, s.lng]);
      try {
        this.#map.fitBounds(window.L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
      } catch { /* ignore if bounds are invalid */ }
    }
  }

  /** Force a map resize (call after the container becomes visible). */
  invalidateSize() {
    this.#map?.invalidateSize();
  }

  /** Destroy the map and clean up. */
  destroy() {
    this.#markers.forEach((m) => m.remove());
    this.#map?.remove();
    this.#map = null;
    this.#markers = [];
  }

  // ── Private ──────────────────────────────────────────────────────────────

  #createMarkerIcon(store) {
    const color = (Number(store.avg_rating) >= 4.5) ? '#9B1D30' : '#4A4A4A';
    // SVG is entirely static — no user data interpolated
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">',
      '<path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z" fill="',
      color,
      '"/>',
      '<circle cx="14" cy="14" r="6" fill="white"/>',
      '</svg>',
    ].join('');

    return window.L.divIcon({
      html: svg,
      className: 'map-custom-marker',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -36],
    });
  }
}

// ---------------------------------------------------------------------------
// FilterPresets
// ---------------------------------------------------------------------------

const PRESETS_KEY = 'solen_filter_presets';

/**
 * Save and restore named filter configurations.
 * Persisted to localStorage.
 */
export class FilterPresets {
  #presets;

  constructor() {
    this.#presets = this.#load();
  }

  /**
   * Save the current filter state under a name.
   * @param {string} name
   * @param {object} filterState
   * @returns {string} id
   */
  save(name, filterState) {
    const id = `preset_${Date.now()}`;
    this.#presets[id] = {
      id,
      name: String(name).slice(0, 50),
      filters: this.#serialise(filterState),
      createdAt: new Date().toISOString(),
    };
    this.#persist();
    return id;
  }

  /**
   * List all saved presets.
   * @returns {{ id, name, createdAt }[]}
   */
  list() {
    return Object.values(this.#presets).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  /**
   * Restore a preset by id.
   * @returns {object|null}
   */
  get(id) {
    const preset = this.#presets[id];
    return preset ? this.#deserialise(preset.filters) : null;
  }

  /** Delete a preset by id. */
  delete(id) {
    delete this.#presets[id];
    this.#persist();
  }

  /**
   * Render a preset picker into a container using DOM methods only.
   * @param {HTMLElement} container
   * @param {(filterState: object) => void} onSelect
   */
  renderPicker(container, onSelect) {
    // Clear container
    while (container.firstChild) container.removeChild(container.firstChild);

    const presets = this.list();

    if (!presets.length) {
      const empty = el('p', 'filter-preset-empty');
      setText(empty, 'Keine gespeicherten Filter');
      container.appendChild(empty);
      return;
    }

    const list = el('div', 'filter-preset-list');

    presets.forEach((p) => {
      const row = el('div', 'filter-preset-item');

      const applyBtn = el('button', 'filter-preset-apply');
      setText(applyBtn, p.name);
      applyBtn.type = 'button';
      applyBtn.addEventListener('click', () => {
        const state = this.get(p.id);
        if (state) onSelect(state);
      });

      const deleteBtn = el('button', 'filter-preset-delete');
      setText(deleteBtn, '\u00d7'); // × — static Unicode, not user data
      deleteBtn.type = 'button';
      deleteBtn.setAttribute('aria-label', 'L\u00f6schen');
      deleteBtn.addEventListener('click', () => {
        this.delete(p.id);
        this.renderPicker(container, onSelect);
      });

      row.appendChild(applyBtn);
      row.appendChild(deleteBtn);
      list.appendChild(row);
    });

    container.appendChild(list);
  }

  // ── Private ──────────────────────────────────────────────────────────────

  #load() {
    try {
      return JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  #persist() {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(this.#presets));
    } catch { /* storage full */ }
  }

  #serialise(state) {
    const out = { ...state };
    if (out.activeCategories instanceof Set) out.activeCategories = [...out.activeCategories];
    if (out.favSalons instanceof Set) out.favSalons = [...out.favSalons];
    if (out.userBookedStores instanceof Set) out.userBookedStores = [...out.userBookedStores];
    return out;
  }

  #deserialise(state) {
    const out = { ...state };
    if (Array.isArray(out.activeCategories)) out.activeCategories = new Set(out.activeCategories);
    if (Array.isArray(out.favSalons)) out.favSalons = new Set(out.favSalons);
    if (Array.isArray(out.userBookedStores)) out.userBookedStores = new Set(out.userBookedStores);
    return out;
  }
}
