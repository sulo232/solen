/**
 * src/modules/salons.js — Salon listing, search, and filter data layer.
 *
 * Extracted from index.html (loadStores ~5410, renderStores filter logic ~6037,
 * and supporting helpers).
 *
 * Exports:
 *  - loadStores()       fetch stores + services + photos from Supabase
 *  - fetchStoreDetail() fetch a single store with its services and reviews
 *  - applyFilters()     pure filter/sort function — takes state, returns sorted array
 *  - haversine()        distance calculator
 *
 * DOM rendering stays in legacy inline scripts during the migration phase.
 */

import { supabase } from '@/services/supabase.js';
import { store } from '@/store/index.js';

// ---------------------------------------------------------------------------
// Photo cache
// ---------------------------------------------------------------------------

const _salonPhotosCache = {};

/**
 * Preload all salon photos into the in-memory cache.
 */
export async function preloadAllSalonPhotos() {
  const { data } = await supabase.from('salon_photos').select('*');
  (data || []).forEach((p) => {
    if (!_salonPhotosCache[p.salon_id]) _salonPhotosCache[p.salon_id] = [];
    _salonPhotosCache[p.salon_id].push(p);
  });
  return _salonPhotosCache;
}

/**
 * Get cached photos for a salon.
 * @param {string} salonId
 * @returns {object[]}
 */
export function getSalonPhotos(salonId) {
  return _salonPhotosCache[salonId] || [];
}

/**
 * Get the primary photo URL for a store.
 * Falls back to store.photo_url, then null.
 */
export function getSalonMainPhotoUrl(storeObj) {
  const cached = _salonPhotosCache[storeObj?.id];
  if (cached?.length) {
    const cover = cached.find((p) => p.is_cover) || cached[0];
    return cover?.url || null;
  }
  return storeObj?.photo_url || null;
}

// ---------------------------------------------------------------------------
// Core data load
// ---------------------------------------------------------------------------

/**
 * Fetch all approved stores + services and update the store.
 * Mirrors loadStores() from index.html ~5410.
 * @returns {{ stores, services, error }}
 */
export async function loadStores() {
  let stores = [], services = [], error = null;

  try {
    const [storesRes, salonsRes, svcsRes] = await Promise.all([
      supabase.from('stores').select('*').neq('status', 'pending').neq('status', 'rejected').order('name'),
      supabase.from('salons').select('*').eq('status', 'approved').order('name'),
      supabase.from('services').select('*'),
    ]);

    error = storesRes.error;
    if (error && !storesRes.data) return { stores: [], services: [], error };

    const dbStores = (storesRes.data || []).concat(
      (salonsRes.data || []).map((s) => ({ ...s, store_id: s.id }))
    );

    stores = dbStores;
    services = svcsRes.data || [];

    // Assign default Basel coords to stores missing lat/lng
    stores.forEach((s) => {
      if (!s.lat || !s.lng) {
        s.lat = 47.5596 + (Math.random() - 0.5) * 0.02;
        s.lng = 7.5886 + (Math.random() - 0.5) * 0.02;
      }
    });
  } catch (e) {
    error = e;
    return { stores: [], services: [], error };
  }

  // Track which stores the current user has visited
  const user = store.get('currentUser');
  const userBookedStores = new Set();
  if (user) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('store_id,salon_id')
      .eq('user_id', user.id);
    (bookings || []).forEach((b) => {
      if (b.store_id) userBookedStores.add(b.store_id);
      if (b.salon_id) userBookedStores.add(b.salon_id);
    });
  }

  store.patch({
    allStores: stores,
    allServices: services,
    userBookedStores,
  });

  return { stores, services, error: null };
}

/**
 * Fetch a single store/salon by ID along with its services and reviews.
 * @param {string} id
 * @returns {{ store, services, reviews, error }}
 */
export async function fetchStoreDetail(id) {
  const [storeRes, svcsRes, reviewsRes] = await Promise.all([
    supabase.from('stores').select('*').eq('id', id).maybeSingle(),
    supabase.from('services').select('*').eq('store_id', id),
    supabase.from('reviews').select('*').eq('salon_id', id).order('created_at', { ascending: false }),
  ]);

  // Also try salons table if store not found
  let storeData = storeRes.data;
  if (!storeData) {
    const { data } = await supabase.from('salons').select('*').eq('id', id).maybeSingle();
    storeData = data;
  }

  return {
    store: storeData,
    services: svcsRes.data || [],
    reviews: reviewsRes.data || [],
    error: storeRes.error,
  };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/**
 * Fetch reviews for a salon.
 * @param {string} salonId
 * @returns {object[]}
 */
export async function loadReviews(salonId) {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false });
  return data || [];
}

/**
 * Submit a review.
 * @param {{ salonId, rating, text, bookingId }} params
 * @returns {{ error }}
 */
export async function submitReview({ salonId, rating, text, bookingId }) {
  const user = store.get('currentUser');
  if (!user) return { error: { message: 'not_authenticated' } };
  const { error } = await supabase.from('reviews').insert({
    salon_id: salonId,
    user_id: user.id,
    rating,
    text,
    booking_id: bookingId || null,
    created_at: new Date().toISOString(),
  });
  return { error };
}

/**
 * Submit owner reply to a review.
 * @param {string} reviewId
 * @param {string} reply
 * @returns {{ error }}
 */
export async function submitReviewReply(reviewId, reply) {
  const { error } = await supabase
    .from('reviews')
    .update({ owner_reply: reply, reply_at: new Date().toISOString() })
    .eq('id', reviewId);
  return { error };
}

// ---------------------------------------------------------------------------
// Filter / sort — pure function, no side effects
// ---------------------------------------------------------------------------

/**
 * Apply all active filters and sort to an array of stores.
 *
 * @param {object[]} stores        — full allStores array
 * @param {object[]} services      — full allServices array
 * @param {object}   filters       — filter state from the store
 * @param {object}   [geo]         — { lat, lng } for distance sort
 * @returns {object[]}             — filtered and sorted stores
 */
export function applyFilters(stores, services, filters = {}, geo = null) {
  const {
    activeCategories = new Set(),
    activeNeighbourhood = '',
    minRatingFilter = 0,
    maxPriceFilter = 0,
    currentSort = 'default',
    searchQuery = '',
    favSalons = new Set(),
    showOnlyFavs = false,
    onlyEmpfohlen = false,
  } = filters;

  let result = [...stores];

  // Favourites
  if (showOnlyFavs) {
    result = result.filter((s) => favSalons.has(s.id));
  }

  // Category filter
  if (activeCategories.size > 0) {
    result = result.filter((s) => {
      const storeType = s.type || s.category || '';
      if (activeCategories.has(storeType)) return true;
      // Also match if any service belongs to this category
      const storeServices = services.filter(
        (sv) => sv.store_id === s.id || sv.salon_id === s.id
      );
      return storeServices.some((sv) => activeCategories.has(sv.category));
    });
  }

  // Neighbourhood filter
  if (activeNeighbourhood) {
    result = result.filter((s) => {
      const addr = (s.address || s.location || '').toLowerCase();
      return addr.includes(activeNeighbourhood.toLowerCase());
    });
  }

  // Rating filter
  if (minRatingFilter > 0) {
    result = result.filter((s) => (s.avg_rating || 0) >= minRatingFilter);
  }

  // Price filter
  if (maxPriceFilter > 0) {
    result = result.filter((s) => {
      const storeServices = services.filter(
        (sv) => sv.store_id === s.id || sv.salon_id === s.id
      );
      if (!storeServices.length) return true;
      const minPrice = Math.min(...storeServices.map((sv) => sv.price || 0));
      return minPrice <= maxPriceFilter;
    });
  }

  // Empfohlen (recommended) filter
  if (onlyEmpfohlen) {
    result = result.filter((s) => (s.avg_rating || 0) >= 4.5 && (s.review_count || 0) >= 10);
  }

  // Text search
  if (searchQuery && searchQuery.length >= 2) {
    const q = searchQuery.toLowerCase();
    result = result.filter((s) => {
      if ((s.name || '').toLowerCase().includes(q)) return true;
      if ((s.description || '').toLowerCase().includes(q)) return true;
      const storeServices = services.filter(
        (sv) => sv.store_id === s.id || sv.salon_id === s.id
      );
      return storeServices.some((sv) => (sv.name || '').toLowerCase().includes(q));
    });
  }

  // Sort
  switch (currentSort) {
    case 'popular':
      result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      break;
    case 'price_asc': {
      result.sort((a, b) => {
        const minA = Math.min(
          ...services.filter((sv) => sv.store_id === a.id || sv.salon_id === a.id).map((sv) => sv.price || 9999),
          9999
        );
        const minB = Math.min(
          ...services.filter((sv) => sv.store_id === b.id || sv.salon_id === b.id).map((sv) => sv.price || 9999),
          9999
        );
        return minA - minB;
      });
      break;
    }
    case 'rating':
      result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      break;
    case 'distance':
      if (geo?.lat && geo?.lng) {
        result.sort(
          (a, b) =>
            haversine(geo.lat, geo.lng, a.lat, a.lng) -
            haversine(geo.lat, geo.lng, b.lat, b.lng)
        );
      }
      break;
    default:
      break;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Geo utility
// ---------------------------------------------------------------------------

/**
 * Haversine distance in km between two lat/lng points.
 */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Last-minute availability
// ---------------------------------------------------------------------------

/**
 * Find stores with available slots today.
 * @returns {{ storeId: string, time: string }[]}
 */
export async function fetchLastMinuteSlots() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: bookings } = await supabase
    .from('bookings')
    .select('store_id,booking_time')
    .eq('booking_date', today)
    .eq('status', 'confirmed');

  // Return all booked store/time pairs — the caller decides what "available" means
  return (bookings || []).map((b) => ({ storeId: b.store_id, time: b.booking_time }));
}

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------

/**
 * Toggle a store in/out of favourites and persist to localStorage.
 * @param {string} storeId
 * @returns {boolean} — new isFav state
 */
export function toggleFav(storeId) {
  const favs = store.get('favSalons');
  const isFav = favs.has(storeId);
  if (isFav) favs.delete(storeId); else favs.add(storeId);
  store.set('favSalons', favs);
  try {
    localStorage.setItem('solen_favs', JSON.stringify([...favs]));
  } catch (e) { /* storage full */ }
  return !isFav;
}

/**
 * Check if a store is in favourites.
 */
export function isFav(storeId) {
  return store.get('favSalons').has(storeId);
}
