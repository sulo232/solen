/**
 * src/modules/dashboard.js — Salon owner (provider) dashboard data layer.
 *
 * Extracted from index.html: renderSalonDashboard ~8547, saveDashHours ~8689,
 * staff management ~10502-10559, vacation blocks ~10573-10626,
 * photo management ~5484-5632, services/addons ~8863-9036.
 *
 * All functions return { data?, error } and update the store where appropriate.
 * DOM rendering stays in legacy inline scripts during the migration phase.
 */

import { supabase } from '@/services/supabase.js';
import { store } from '@/store/index.js';

// ---------------------------------------------------------------------------
// Salon loading
// ---------------------------------------------------------------------------

/**
 * Load all salons owned by the current user.
 * @returns {object[]} salons
 */
export async function loadMySalons() {
  const user = store.get('currentUser');
  if (!user) return [];

  const [{ data: salons }, { data: stores }] = await Promise.all([
    supabase.from('salons').select('*').eq('owner_id', user.id).order('name'),
    supabase.from('stores').select('*').eq('user_id', user.id).order('name'),
  ]);

  const mySalons = [...(salons || []), ...(stores || [])];
  store.set('mySalons', mySalons);
  return mySalons;
}

/**
 * Fetch bookings for a specific store (owner view).
 * @param {string} storeId
 * @returns {{ data, error }}
 */
export async function loadDashboardBookings(storeId) {
  return supabase
    .from('bookings')
    .select('*')
    .eq('store_id', storeId)
    .order('booking_date', { ascending: false })
    .limit(100);
}

/**
 * Update a booking's status from the owner dashboard.
 * @param {string} bookingId
 * @param {'confirmed'|'cancelled'|'no_show'} status
 * @returns {{ error }}
 */
export async function updateBookingStatus(bookingId, status) {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  return { error };
}

// ---------------------------------------------------------------------------
// Opening hours
// ---------------------------------------------------------------------------

/**
 * Save opening hours for a salon.
 * @param {string} storeId
 * @param {object} hours — { mon: { open, close, closed }, ... }
 * @returns {{ error }}
 */
export async function saveDashHours(storeId, hours) {
  const { error } = await supabase
    .from('stores')
    .update({ opening_hours: hours })
    .eq('id', storeId);
  return { error };
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

/**
 * Save service settings for a salon.
 * Upserts service_settings JSON to salons table and syncs individual rows to services table.
 * @param {string} storeId
 * @param {object[]} services — [{ name, price, duration, category }]
 * @returns {{ error }}
 */
export async function saveServices(storeId, services) {
  // Update service_settings on the salon record
  const { error } = await supabase
    .from('salons')
    .update({ service_settings: services })
    .eq('id', storeId);
  if (error) return { error };

  // Sync individual services rows: delete old, insert new
  await supabase.from('services').delete().eq('store_id', storeId);
  if (services.length) {
    await supabase.from('services').insert(
      services.map((s) => ({ ...s, store_id: storeId }))
    );
  }
  return { error: null };
}

// ---------------------------------------------------------------------------
// Staff management
// ---------------------------------------------------------------------------

/**
 * Load active staff for a store.
 * @param {string} storeId
 * @returns {{ data, error }}
 */
export async function loadStaff(storeId) {
  return supabase
    .from('store_staff')
    .select('*')
    .eq('store_id', storeId)
    .eq('active', true)
    .order('name');
}

/**
 * Add a staff member.
 * @param {string} storeId
 * @param {{ name, role, selection_fee }} staffData
 * @returns {{ data, error }}
 */
export async function addStaff(storeId, staffData) {
  return supabase
    .from('store_staff')
    .insert({ store_id: storeId, active: true, ...staffData })
    .select()
    .single();
}

/**
 * Soft-delete a staff member (set active = false).
 * @param {string} staffId
 * @returns {{ error }}
 */
export async function deleteStaff(staffId) {
  const { error } = await supabase
    .from('store_staff')
    .update({ active: false })
    .eq('id', staffId);
  return { error };
}

/**
 * Toggle whether a staff member is bookable.
 * @param {string} staffId
 * @param {boolean} bookable
 * @returns {{ error }}
 */
export async function updateStaffBookable(staffId, bookable) {
  const { error } = await supabase
    .from('store_staff')
    .update({ bookable })
    .eq('id', staffId);
  return { error };
}

// ---------------------------------------------------------------------------
// Vacation / blocked dates
// ---------------------------------------------------------------------------

/**
 * Load blocked dates for a salon.
 * @param {string} storeId
 * @returns {{ data, error }}
 */
export async function loadBlockedDates(storeId) {
  return supabase
    .from('blocked_dates')
    .select('*')
    .eq('store_id', storeId)
    .order('start_date');
}

/**
 * Block a date range (vacation / closure).
 * @param {string} storeId
 * @param {{ start_date, end_date, reason }} blockData
 * @returns {{ data, error }}
 */
export async function addVacationBlock(storeId, blockData) {
  return supabase
    .from('blocked_dates')
    .insert({ store_id: storeId, ...blockData })
    .select()
    .single();
}

/**
 * Remove a blocked date entry.
 * @param {string} blockId
 * @returns {{ error }}
 */
export async function deleteVacationBlock(blockId) {
  const { error } = await supabase.from('blocked_dates').delete().eq('id', blockId);
  return { error };
}

// ---------------------------------------------------------------------------
// Add-ons / extras
// ---------------------------------------------------------------------------

/**
 * Load add-ons for a store.
 * @param {string} storeId
 * @returns {{ data, error }}
 */
export async function loadAddons(storeId) {
  return supabase.from('addons').select('*').eq('store_id', storeId);
}

/**
 * Toggle an add-on active/inactive.
 * @param {string} storeId
 * @param {string} addonName
 * @param {boolean} active
 * @returns {{ error }}
 */
export async function toggleAddon(storeId, addonName, active) {
  const { error } = await supabase
    .from('addons')
    .upsert({ store_id: storeId, name: addonName, active }, { onConflict: 'store_id,name' });
  return { error };
}

/**
 * Update an add-on's price.
 * @param {string} storeId
 * @param {string} addonName
 * @param {number} price
 * @returns {{ error }}
 */
export async function saveAddonPrice(storeId, addonName, price) {
  const { error } = await supabase
    .from('addons')
    .upsert({ store_id: storeId, name: addonName, price }, { onConflict: 'store_id,name' });
  return { error };
}

// ---------------------------------------------------------------------------
// Photo management
// ---------------------------------------------------------------------------

/**
 * Load photos for a salon.
 * @param {string} salonId
 * @returns {{ data, error }}
 */
export async function loadSalonPhotos(salonId) {
  return supabase
    .from('salon_photos')
    .select('*')
    .eq('salon_id', salonId)
    .order('sort_order');
}

/**
 * Upload a salon photo.
 * @param {string} salonId
 * @param {File} file
 * @param {{ isCover, type }} options
 * @returns {{ data, error }}
 */
export async function uploadSalonPhoto(salonId, file, { isCover = false, type = 'gallery' } = {}) {
  const ext = file.name.split('.').pop();
  const path = `salons/${salonId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('salon-photos')
    .upload(path, file, { upsert: false });
  if (uploadError) return { data: null, error: uploadError };

  const { data: { publicUrl } } = supabase.storage.from('salon-photos').getPublicUrl(path);

  const { data, error } = await supabase
    .from('salon_photos')
    .insert({ salon_id: salonId, url: publicUrl, path, is_cover: isCover, type })
    .select()
    .single();

  if (!error && isCover) {
    await supabase.from('stores').update({ photo_url: publicUrl }).eq('id', salonId);
  }

  return { data, error };
}

/**
 * Delete a salon photo.
 * @param {string} photoId
 * @param {string} storagePath
 * @returns {{ error }}
 */
export async function deleteSalonPhoto(photoId, storagePath) {
  if (storagePath) {
    await supabase.storage.from('salon-photos').remove([storagePath]);
  }
  const { error } = await supabase.from('salon_photos').delete().eq('id', photoId);
  return { error };
}

/**
 * Set a photo as the cover.
 * @param {string} salonId
 * @param {string} photoId
 * @param {string} photoUrl
 * @returns {{ error }}
 */
export async function setCoverPhoto(salonId, photoId, photoUrl) {
  await supabase.from('salon_photos').update({ is_cover: false }).eq('salon_id', salonId);
  const { error } = await supabase.from('salon_photos').update({ is_cover: true }).eq('id', photoId);
  if (!error) {
    await supabase.from('stores').update({ photo_url: photoUrl }).eq('id', salonId);
  }
  return { error };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * Load analytics data for a salon (revenue, top services, peak hours, no-show rate).
 * @param {string} storeId
 * @param {number} [days=30]  — lookback window
 * @returns {{ data, error }}
 */
export async function loadAnalytics(storeId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('store_id', storeId)
    .gte('booking_date', sinceStr)
    .order('booking_date', { ascending: false });

  if (error) return { data: null, error };

  const bookings = data || [];
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  const revenue = confirmed.reduce((sum, b) => sum + (b.service_price || 0), 0);
  const noShowRate = bookings.length ? (cancelled.length / bookings.length) * 100 : 0;

  // Top services
  const serviceCounts = {};
  confirmed.forEach((b) => {
    const name = b.service_name || 'Unbekannt';
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Peak hours
  const hourCounts = Array(24).fill(0);
  confirmed.forEach((b) => {
    const h = parseInt((b.booking_time || '00:00').split(':')[0], 10);
    if (!isNaN(h)) hourCounts[h]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  return {
    data: { revenue, bookings, confirmed, noShowRate, topServices, peakHour, hourCounts },
    error: null,
  };
}
