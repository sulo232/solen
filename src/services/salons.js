/**
 * Salon / store / service data fetching for the Solen beauty booking app.
 *
 * All functions are lifted verbatim from index.html.  The original code
 * used a module-level `sb` alias; here we import the shared `supabase` client.
 *
 * Tables covered:
 *   stores        — admin-managed salon records
 *   salons        — owner-registered salon records
 *   services      — individual bookable services per salon
 *   salon_photos  — photo gallery items per salon
 *   reviews       — customer reviews per salon
 *   staff         — staff members per salon
 *   inventory     — product stock per salon
 *
 * Source lines in index.html: 5410-5630, 8273-8544, 9803-9935, 10502-10573,
 *                              12252-12386, 12387-12391
 *
 * Usage:
 *   import { fetchStores, fetchApprovedSalons, fetchServices } from './salons.js';
 */

import { supabase } from './supabase.js';

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

/**
 * Fetches all non-pending, non-rejected stores (public listing).
 * Source: index.html line 5414
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchStores() {
  return supabase
    .from('stores')
    .select('*')
    .neq('status', 'pending')
    .neq('status', 'rejected')
    .order('name');
}

/**
 * Fetches all approved salons (owner-registered).
 * Source: index.html line 5421
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchApprovedSalons() {
  return supabase.from('salons').select('*').eq('status', 'approved').order('name');
}

/**
 * Fetches a single store by id.
 * Source: index.html line 8450
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchStoreById(storeId) {
  return supabase.from('stores').select('*').eq('id', storeId).single();
}

/**
 * Fetches all stores for the admin panel (unrestricted).
 * Source: index.html line 8276
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchAllStoresAdmin() {
  return supabase.from('stores').select('*').order('name');
}

/**
 * Fetches salons owned by the current user (owner dashboard).
 * Source: index.html line 8551
 *
 * @param {string} ownerId  — auth user id
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchSalonsByOwner(ownerId) {
  return supabase.from('salons').select('*').eq('owner_id', ownerId);
}

/**
 * Fetches stores registered by user (via user_id column, set during onboarding).
 * Source: index.html line 8554
 *
 * @param {string} userId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchStoresByUserId(userId) {
  return supabase.from('stores').select('*').eq('user_id', userId).limit(1);
}

/**
 * Inserts a new store record.
 * Source: index.html line 8481
 *
 * @param {object} storeData
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertStore(storeData) {
  return supabase.from('stores').insert(storeData);
}

/**
 * Updates an existing store record.
 * Source: index.html lines 8480, 5559, 5588, 5612
 *
 * @param {string} storeId
 * @param {object} patch
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateStore(storeId, patch) {
  return supabase.from('stores').update(patch).eq('id', storeId);
}

/**
 * Deletes a store record by id.
 * Source: index.html line 8488
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function deleteStore(storeId) {
  return supabase.from('stores').delete().eq('id', storeId);
}

// ---------------------------------------------------------------------------
// Salons (owner-registered)
// ---------------------------------------------------------------------------

/**
 * Fetches all salons for the admin panel (all statuses).
 * Source: index.html line 8277
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchAllSalonsAdmin() {
  return supabase.from('salons').select('*').order('created_at', { ascending: false });
}

/**
 * Fetches a salon record by id (owner-registered table).
 * Source: index.html line 8839 (implicit via owner dashboard flow)
 *
 * @param {string} salonId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchSalonById(salonId) {
  return supabase.from('salons').select('*').eq('id', salonId).single();
}

/**
 * Inserts a new salon record (owner registration flow).
 * Source: index.html line 5232-5235
 *
 * @param {object} salonData
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertSalon(salonData) {
  return supabase.from('salons').insert(salonData).select().single();
}

/**
 * Updates a salon record.
 * Source: index.html lines 8330, 8335
 *
 * @param {string} salonId
 * @param {object} patch
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateSalon(salonId, patch) {
  return supabase.from('salons').update(patch).eq('id', salonId);
}

/**
 * Deletes a salon record.
 * Source: index.html line 8341
 *
 * @param {string} salonId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function deleteSalon(salonId) {
  return supabase.from('salons').delete().eq('id', salonId);
}

/**
 * Checks whether the current user owns at least one salon record.
 * Source: index.html line 4839
 *
 * @param {string} userId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchUserSalonOwnership(userId) {
  return supabase.from('salons').select('id').eq('owner_id', userId).limit(1);
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

/**
 * Fetches all service records (public, used for the booking wizard).
 * Source: index.html line 5429
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchServices() {
  return supabase.from('services').select('*');
}

/**
 * Fetches services with their parent store names (admin panel).
 * Source: index.html line 8350
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchServicesWithStore() {
  return supabase.from('services').select('*,stores(name)').order('name');
}

/**
 * Inserts one or more service records.
 * Source: index.html lines 5248, 8534
 *
 * @param {object | object[]} serviceData
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertServices(serviceData) {
  return supabase.from('services').insert(serviceData);
}

/**
 * Deletes a service record by id.
 * Source: index.html line 8541
 *
 * @param {string} serviceId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function deleteService(serviceId) {
  return supabase.from('services').delete().eq('id', serviceId);
}

// ---------------------------------------------------------------------------
// Salon photos
// ---------------------------------------------------------------------------

/**
 * Fetches all photos for a salon ordered by sort_order.
 * Source: index.html lines 5487-5494, 12326
 *
 * @param {string} salonId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchSalonPhotos(salonId) {
  return supabase
    .from('salon_photos')
    .select('*')
    .eq('salon_id', salonId)
    .order('sort_order', { ascending: true });
}

/**
 * Fetches all salon photos for all salons (preload at app startup).
 * Source: index.html lines 5511-5519
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchAllSalonPhotos() {
  return supabase.from('salon_photos').select('*').order('sort_order', { ascending: true });
}

/**
 * Uploads a salon photo file to Supabase Storage (salon-photos bucket).
 * Source: index.html lines 5531-5533, 12358
 *
 * @param {string} path       Storage path, e.g. `salonId/timestamp.jpg`
 * @param {File} file
 * @param {object} [options]  e.g. { cacheControl: '3600', upsert: false }
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').StorageError | null }>}
 */
export async function uploadSalonPhotoFile(path, file, options = {}) {
  return supabase.storage.from('salon-photos').upload(path, file, options);
}

/**
 * Returns the public URL for a salon photo in storage.
 * Source: index.html lines 5537, 12360
 *
 * @param {string} path
 * @returns {{ data: { publicUrl: string } }}
 */
export function getSalonPhotoPublicUrl(path) {
  return supabase.storage.from('salon-photos').getPublicUrl(path);
}

/**
 * Removes one or more photos from the salon-photos storage bucket.
 * Source: index.html lines 5574, 12376
 *
 * @param {string[]} paths
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').StorageError | null }>}
 */
export async function removeSalonPhotoFiles(paths) {
  return supabase.storage.from('salon-photos').remove(paths);
}

/**
 * Inserts a salon_photos record after a successful file upload.
 * Source: index.html lines 5546-5549, 12361
 *
 * @param {object} photoRecord
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertSalonPhoto(photoRecord) {
  return supabase.from('salon_photos').insert(photoRecord).select().single();
}

/**
 * Updates a salon_photos record (e.g. set is_cover, sort_order).
 * Source: index.html lines 5602, 5610, 5586, 5626
 *
 * @param {string} photoId
 * @param {object} patch
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateSalonPhoto(photoId, patch) {
  return supabase.from('salon_photos').update(patch).eq('id', photoId);
}

/**
 * Deletes a salon_photos record by id.
 * Source: index.html lines 5578, 12377
 *
 * @param {string} photoId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function deleteSalonPhoto(photoId) {
  return supabase.from('salon_photos').delete().eq('id', photoId);
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/**
 * Fetches all reviews for a salon, newest first.
 * Source: index.html line 9804
 *
 * @param {string} salonId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchReviews(salonId) {
  return supabase
    .from('reviews')
    .select('*')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false });
}

/**
 * Inserts a new review row.
 * Source: index.html lines 9887, 9912
 *
 * @param {object} reviewRow
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertReview(reviewRow) {
  return supabase.from('reviews').insert(reviewRow);
}

/**
 * Updates a review row (owner reply, or admin actions).
 * Source: index.html lines 9821, 12390
 *
 * @param {string} reviewId
 * @param {object} patch
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateReview(reviewId, patch) {
  return supabase.from('reviews').update(patch).eq('id', reviewId);
}

/**
 * Uploads a review photo file to the review-photos storage bucket.
 * Source: index.html line 9857
 *
 * @param {string} path
 * @param {File} file
 * @param {{ contentType: string, upsert: boolean }} [options]
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').StorageError | null }>}
 */
export async function uploadReviewPhotoFile(path, file, options = {}) {
  return supabase.storage.from('review-photos').upload(path, file, options);
}

/**
 * Returns the public URL for a review photo in storage.
 * Source: index.html line 9859
 *
 * @param {string} path
 * @returns {{ data: { publicUrl: string } }}
 */
export function getReviewPhotoPublicUrl(path) {
  return supabase.storage.from('review-photos').getPublicUrl(path);
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/**
 * Fetches all staff members for a salon.
 * Source: index.html line 12250
 *
 * @param {string} salonId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchStaff(salonId) {
  return supabase.from('staff').select('*').eq('store_id', salonId);
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

/**
 * Fetches all inventory items for a salon, ordered by name.
 * Source: index.html line 12277
 *
 * @param {string} salonId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchInventory(salonId) {
  return supabase.from('inventory').select('*').eq('salon_id', salonId).order('name');
}

/**
 * Inserts a new inventory item.
 * Source: index.html line 12299
 *
 * @param {object} itemData
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertInventoryItem(itemData) {
  return supabase.from('inventory').insert(itemData);
}

/**
 * Updates an inventory item (e.g. reorder stock level).
 * Source: index.html line 12311
 *
 * @param {string} itemId
 * @param {object} patch
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateInventoryItem(itemId, patch) {
  return supabase.from('inventory').update(patch).eq('id', itemId);
}

/**
 * Deletes an inventory item.
 * Source: index.html line 12318
 *
 * @param {string} itemId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function deleteInventoryItem(itemId) {
  return supabase.from('inventory').delete().eq('id', itemId);
}

// ---------------------------------------------------------------------------
// Admin: stores approval queue
// ---------------------------------------------------------------------------

/**
 * Fetches stores with status = 'pending' for the admin approval queue.
 * Source: index.html line 12387
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchPendingStores() {
  return supabase
    .from('stores')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
}

/**
 * Marks a store as verified once it accumulates enough confirmed bookings.
 * Source: index.html line 12391, 13417
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function setStoreVerified(storeId) {
  return supabase
    .from('stores')
    .update({ is_verified: true })
    .eq('id', storeId);
}

// ---------------------------------------------------------------------------
// User management (admin panel)
// ---------------------------------------------------------------------------

/**
 * Fetches all user_profiles (admin-only panel).
 * Source: index.html line 8389
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchUserProfiles() {
  return supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
}

/**
 * Fetches all profiles (fallback when user_profiles table doesn't exist).
 * Source: index.html line 8391
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchProfiles() {
  return supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
}

/**
 * Bans or unbans a user in user_profiles.
 * Source: index.html line 8433
 *
 * @param {string} userId
 * @param {boolean} isBanned
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function setUserBanned(userId, isBanned) {
  return supabase.from('user_profiles').update({ is_banned: isBanned }).eq('id', userId);
}

/**
 * Deletes a profile record (profile data only, not the auth user).
 * Source: index.html line 8440
 *
 * @param {string} profileId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function deleteProfileById(profileId) {
  return supabase.from('profiles').delete().eq('id', profileId);
}

// ---------------------------------------------------------------------------
// Analytics events
// ---------------------------------------------------------------------------

/**
 * Inserts an analytics event row.
 * Source: index.html line 12529
 *
 * @param {{ event: string, props: string, ts: string }} eventRow
 * @returns {Promise<void>}  — fire-and-forget; errors are swallowed by caller
 */
export function trackAnalyticsEvent(eventRow) {
  return supabase.from('analytics_events').insert(eventRow);
}

// ---------------------------------------------------------------------------
// Error logs
// ---------------------------------------------------------------------------

/**
 * Inserts a client-side error log record.
 * Source: index.html line 2830
 *
 * @param {object} errorData
 * @returns {Promise<void>}  — fire-and-forget
 */
export function insertErrorLog(errorData) {
  return supabase.from('error_logs').insert(errorData);
}
