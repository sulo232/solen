/**
 * src/store/index.js — Reactive application store.
 *
 * A lightweight pub/sub store that mirrors the global state variables
 * previously scattered across index.html.
 *
 * Usage:
 *   import { store } from '@/store/index.js';
 *
 *   // Read
 *   const user = store.get('currentUser');
 *
 *   // Write (fires all subscribers for that key)
 *   store.set('currentUser', user);
 *
 *   // Subscribe to a single key
 *   const unsub = store.subscribe('currentUser', (newVal) => { ... });
 *   unsub(); // remove listener
 *
 *   // Subscribe to any change
 *   store.subscribeAll((key, newVal) => { ... });
 */

// ---------------------------------------------------------------------------
// Initial state — mirrors the legacy globals from index.html lines 4102-4113
// ---------------------------------------------------------------------------

const _initialState = {
  // Auth
  currentUser: null,
  currentProfile: null,

  // Data
  allStores: [],
  allServices: [],
  mySalons: [],

  // Booking
  bookingState: {},
  bmState: {},
  pendingBookingStoreId: null,
  editingStore: null,

  // UI / filters
  activeCategories: new Set(),
  currentSort: 'default',
  userBookedStores: new Set(),
  favSalons: new Set(JSON.parse(localStorage.getItem('solen_favs') || '[]')),
  showOnlyFavs: false,
  recentViews: JSON.parse(localStorage.getItem('solen_recent') || '[]'),

  // Calendar
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),

  // i18n
  currentLang: localStorage.getItem('solen_lang') || 'de',

  // Geo / search filters
  userLat: null,
  userLng: null,
  activeNeighbourhood: '',
  minRatingFilter: 0,
  maxPriceFilter: 0,

  // Dashboard
  _dashActiveSalonIdx: 0,
};

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

class Store {
  #state;
  #listeners = new Map(); // key → Set<fn>
  #globalListeners = new Set(); // fn(key, value)

  constructor(initial) {
    this.#state = { ...initial };
  }

  /** Read a value. */
  get(key) {
    return this.#state[key];
  }

  /** Write a value and notify subscribers. */
  set(key, value) {
    this.#state[key] = value;
    this.#listeners.get(key)?.forEach((fn) => fn(value));
    this.#globalListeners.forEach((fn) => fn(key, value));
  }

  /** Patch multiple keys at once. */
  patch(partial) {
    Object.entries(partial).forEach(([key, value]) => this.set(key, value));
  }

  /**
   * Subscribe to changes on a single key.
   * Returns an unsubscribe function.
   */
  subscribe(key, fn) {
    if (!this.#listeners.has(key)) this.#listeners.set(key, new Set());
    this.#listeners.get(key).add(fn);
    return () => this.#listeners.get(key).delete(fn);
  }

  /**
   * Subscribe to every change.
   * Returns an unsubscribe function.
   */
  subscribeAll(fn) {
    this.#globalListeners.add(fn);
    return () => this.#globalListeners.delete(fn);
  }

  /** Snapshot of the whole state (read-only copy). */
  snapshot() {
    return { ...this.#state };
  }
}

export const store = new Store(_initialState);

// ---------------------------------------------------------------------------
// Derived helpers (read-only convenience)
// ---------------------------------------------------------------------------

/** Returns the locale string for the current language. */
export function getLocale() {
  const lang = store.get('currentLang');
  if (lang === 'en') return 'en-GB';
  if (lang === 'fr') return 'fr-CH';
  return 'de-CH';
}
