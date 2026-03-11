/**
 * src/modules/admin.js — Admin panel data layer.
 *
 * Extracted from index.html: loadPendingSalons ~12341, approveStore ~12342,
 * rejectStoreAdmin ~12343, loadAdminBookings ~8365, loadAdminUsers ~8384,
 * toggleBanUser ~8432, deleteProfile ~8438.
 *
 * All functions guard against non-admin callers via the store's currentUser.
 */

import { supabase } from '@/services/supabase.js';
import { store } from '@/store/index.js';
import { isAdmin } from '@/modules/auth.js';

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

function requireAdmin() {
  const user = store.get('currentUser');
  if (!isAdmin(user)) throw new Error('Unauthorized: admin only');
}

// ---------------------------------------------------------------------------
// Salon approval
// ---------------------------------------------------------------------------

/**
 * Load salons pending review.
 * @returns {{ data, error }}
 */
export async function loadPendingSalons() {
  requireAdmin();
  return supabase
    .from('stores')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
}

/**
 * Approve a salon.
 * @param {string} storeId
 * @returns {{ error }}
 */
export async function approveStore(storeId) {
  requireAdmin();
  const { error } = await supabase
    .from('stores')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', storeId);
  return { error };
}

/**
 * Reject a salon with an optional reason.
 * @param {string} storeId
 * @param {string} [reason]
 * @returns {{ error }}
 */
export async function rejectStore(storeId, reason = '') {
  requireAdmin();
  const { error } = await supabase
    .from('stores')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', storeId);
  return { error };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

/**
 * Load recent bookings for the admin view.
 * @param {number} [limit=100]
 * @returns {{ data, error }}
 */
export async function loadAdminBookings(limit = 100) {
  requireAdmin();
  return supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
}

/**
 * Admin cancel a booking.
 * @param {string} bookingId
 * @returns {{ error }}
 */
export async function adminCancelBooking(bookingId) {
  requireAdmin();
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);
  return { error };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/**
 * Load all users (from profiles table).
 * @returns {{ data, error }}
 */
export async function loadAdminUsers() {
  requireAdmin();
  const result = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return result;
}

/**
 * Ban or unban a user.
 * @param {string} userId
 * @param {boolean} banned
 * @returns {{ error }}
 */
export async function toggleBanUser(userId, banned) {
  requireAdmin();
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned })
    .eq('id', userId);
  return { error };
}

/**
 * Delete a user profile.
 * @param {string} userId
 * @returns {{ error }}
 */
export async function deleteProfile(userId) {
  requireAdmin();
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  return { error };
}
