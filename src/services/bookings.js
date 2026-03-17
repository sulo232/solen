/**
 * Booking CRUD operations for the Solen beauty booking app.
 *
 * All functions are lifted verbatim from index.html.  The original code used
 * a module-level `sb` alias; here we import the shared `supabase` client.
 *
 * Tables covered:
 *   bookings   — all appointment records
 *   reminders  — scheduled email reminder rows created at booking time
 *
 * Source lines in index.html: 5437-5438, 6155-6165, 6875-6970, 7539,
 *                              8205-8219, 8365-8382, 8493-8497, 9043-9131,
 *                              9926, 12247, 12250-12251, 12391, 12394,
 *                              12420, 12460, 12489, 12552, 13154, 13191,
 *                              13287, 13309
 *
 * Usage:
 *   import { createBooking, fetchUserBookings, cancelUserBooking } from './bookings.js';
 */

import { supabase } from './supabase.js';

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetches all bookings for a user (My Bookings page).
 * Also joins the `stores` table for the salon name/type.
 * Source: index.html line 7539
 *
 * @param {string} userId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchUserBookings(userId) {
  return supabase
    .from('bookings')
    .select('*,stores(name,type)')
    .eq('user_id', userId)
    .order('booking_date', { ascending: false });
}

/**
 * Fetches the store_id and salon_id from all bookings for a user.
 * Used to build the "previously visited" set shown on salon cards.
 * Source: index.html line 5437
 *
 * @param {string} userId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchUserBookedStoreIds(userId) {
  return supabase.from('bookings').select('store_id,salon_id').eq('user_id', userId);
}

/**
 * Fetches all confirmed bookings for a salon (owner dashboard).
 * Source: index.html line 8605
 *
 * @param {string} salonId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchSalonBookings(salonId) {
  return supabase
    .from('bookings')
    .select('*')
    .eq('salon_id', salonId)
    .order('booking_date', { ascending: false });
}

/**
 * Fetches the booking_time slots already taken for a date (availability check).
 * Source: index.html line 6161
 *
 * @param {string} date   ISO date string, e.g. '2026-03-15'
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchBookedSlots(date) {
  return supabase
    .from('bookings')
    .select('store_id,time')
    .eq('date', date)
    .in('status', ['confirmed', 'pending']);
}

/**
 * Fetches booked time slots for a specific salon on a specific date.
 * Source: index.html line 9643
 *
 * @param {string} salonId
 * @param {string} dateStr  ISO date string
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchSalonBookedTimes(salonId, dateStr) {
  return supabase
    .from('bookings')
    .select('booking_time')
    .eq('salon_id', salonId)
    .eq('booking_date', dateStr)
    .neq('status', 'cancelled');
}

/**
 * Fetches all bookings for the admin panel (latest first, capped at 100).
 * Joins `stores` for salon name.
 * Source: index.html line 8368
 *
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchAllBookingsAdmin() {
  return supabase
    .from('bookings')
    .select('*,stores(name)')
    .order('booking_date', { ascending: false })
    .limit(100);
}

/**
 * Fetches confirmed bookings for a store (for iCal export).
 * Source: index.html line 12394
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchConfirmedBookingsForStore(storeId) {
  return supabase
    .from('bookings')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'confirmed');
}

/**
 * Fetches the next upcoming confirmed booking for a store (Google Calendar).
 * Source: index.html line 12420-12421
 *
 * @param {string} storeId
 * @param {string} fromDate  ISO date, e.g. today's date
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchNextConfirmedBooking(storeId, fromDate) {
  return supabase
    .from('bookings')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'confirmed')
    .gte('booking_date', fromDate)
    .order('booking_date')
    .limit(1);
}

/**
 * Fetches booking dates/times/services for a store (calendar widget).
 * Source: index.html line 12460
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchStoreCalendarBookings(storeId) {
  return supabase
    .from('bookings')
    .select('booking_date,booking_time,service_name,customer_name')
    .eq('store_id', storeId);
}

/**
 * Fetches CRM-relevant booking data for a store.
 * Source: index.html line 12489
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchBookingsForCRM(storeId) {
  return supabase
    .from('bookings')
    .select('id,customer_name,customer_phone,service_name,booking_date,booking_time,status')
    .eq('store_id', storeId)
    .order('booking_date', { ascending: false });
}

/**
 * Fetches bookings for a store's CRM photo panel.
 * Source: index.html line 12552
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchBookingsForCRMPhotos(storeId) {
  return supabase
    .from('bookings')
    .select('id,customer_name,customer_phone,service_name,booking_date,status,crm_photo_url')
    .eq('store_id', storeId)
    .order('booking_date', { ascending: false });
}

/**
 * Fetches CRM booking data keyed by customer_id (loadCRMFromBookings).
 * Source: index.html line 12247
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchCRMBookingCustomers(storeId) {
  return supabase
    .from('bookings')
    .select('customer_id,customer_name,customer_phone,created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
}

/**
 * Fetches staff commission data: staff records + confirmed booking prices.
 * Source: index.html line 12250
 *
 * @param {string} storeId
 * @returns {Promise<[{ data: unknown[], error: unknown }, { data: unknown[], error: unknown }]>}
 */
export async function fetchStaffCommissionData(storeId) {
  return Promise.all([
    supabase.from('staff').select('*').eq('store_id', storeId),
    supabase
      .from('bookings')
      .select('staff_id,price,status')
      .eq('store_id', storeId)
      .eq('status', 'confirmed'),
  ]);
}

/**
 * Fetches customer emails for a marketing blast.
 * Source: index.html line 12251
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchCustomerEmailsForBlast(storeId) {
  return supabase
    .from('bookings')
    .select('customer_email,customer_name')
    .eq('store_id', storeId);
}

/**
 * Counts confirmed bookings for a store (verified badge check).
 * Source: index.html lines 9926, 12391
 *
 * @param {string} salonId
 * @returns {Promise<{ count: number | null, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function countConfirmedBookings(salonId) {
  return supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('salon_id', salonId)
    .eq('status', 'confirmed');
}

/**
 * Fetches staff revenue data for dashboard earnings analytics.
 * Source: index.html line 13154
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchStaffRevenueBookings(storeId) {
  return supabase
    .from('bookings')
    .select('staff_name,service_price')
    .eq('store_id', storeId)
    .eq('status', 'confirmed');
}

/**
 * Fetches booking history for a store within a date range (analytics).
 * Source: index.html line 11699
 *
 * @param {string} salonId
 * @param {string} sinceStr  ISO datetime string
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchBookingsForAnalytics(salonId, sinceStr) {
  return supabase
    .from('bookings')
    .select('*')
    .eq('salon_id', salonId)
    .gte('created_at', sinceStr);
}

/**
 * Fetches booking date/time/service/status for a store (owner schedule tab).
 * Source: index.html line 13191
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchStoreScheduleBookings(storeId) {
  return supabase
    .from('bookings')
    .select('booking_date,booking_time,service_name,status')
    .eq('store_id', storeId);
}

/**
 * Fetches customer contact data for a store (messaging / export).
 * Source: index.html lines 13287, 13309
 *
 * @param {string} storeId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchCustomerContactData(storeId) {
  return supabase
    .from('bookings')
    .select('customer_name,customer_phone,customer_email,booking_date')
    .eq('store_id', storeId);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Inserts a new booking row (booking wizard confirmation).
 * Returns the new booking id via .select('id').single().
 * Source: index.html line 6891-6916
 *
 * @param {object} bookingPayload  — all booking fields
 * @returns {Promise<{ data: { id: string }, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function createBooking(bookingPayload) {
  return supabase.from('bookings').insert(bookingPayload).select('id').single();
}

/**
 * Inserts a recurring follow-up booking row (no select needed).
 * Source: index.html line 6937
 *
 * @param {object} bookingPayload
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function createRecurringBooking(bookingPayload) {
  return supabase.from('bookings').insert(bookingPayload);
}

/**
 * Inserts a booking from the inline booking form (alternative flow).
 * Source: index.html line 9747
 *
 * @param {object} bookingPayload
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function createInlineBooking(bookingPayload) {
  return supabase.from('bookings').insert(bookingPayload);
}

/**
 * Updates a booking row (status change, reviewed flag, CRM photo URL, etc.).
 * Source: index.html lines 8495, 9131, 9889, 9914, 12601
 *
 * @param {string} bookingId
 * @param {object} patch
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateBooking(bookingId, patch) {
  return supabase.from('bookings').update(patch).eq('id', bookingId);
}

/**
 * Deletes a booking row (user-initiated cancellation from My Bookings).
 * The query also filters by user_id for row-level security.
 * Source: index.html line 8210
 *
 * @param {string} bookingId
 * @param {string} userId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function cancelUserBooking(bookingId, userId) {
  return supabase.from('bookings').delete().eq('id', bookingId).eq('user_id', userId);
}

/**
 * Sets a booking's status to 'cancelled' (admin / owner cancellation).
 * Source: index.html line 8495
 *
 * @param {string} bookingId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function cancelBookingByAdmin(bookingId) {
  return supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
}

/**
 * Updates a booking's CRM photo URL.
 * Source: index.html line 12601
 *
 * @param {string} bookingId
 * @param {string} photoUrl
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateBookingCRMPhoto(bookingId, photoUrl) {
  return supabase.from('bookings').update({ crm_photo_url: photoUrl }).eq('id', bookingId);
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

/**
 * Inserts email reminder rows for a booking (sent 48h and 2h before).
 * Source: index.html lines 6965-6969
 *
 * @param {object[]} reminderRows
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertReminders(reminderRows) {
  return supabase.from('reminders').insert(reminderRows);
}

// ---------------------------------------------------------------------------
// Messaging (DM system)
// ---------------------------------------------------------------------------

/**
 * Fetches messages for a booking chat thread.
 * Source: index.html lines 7666-7668, 7792
 *
 * @param {string} bookingId
 * @returns {Promise<{ data: unknown[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchMessages(bookingId) {
  return supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
}

/**
 * Inserts a new message row.
 * Source: index.html lines 7887, 7927, 7949, 8009
 *
 * @param {object} messageRow
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function insertMessage(messageRow) {
  return supabase.from('messages').insert(messageRow);
}

/**
 * Updates a message row (mark as read, set reaction).
 * Source: index.html lines 7800, 7967, 8071
 *
 * @param {string} messageId
 * @param {object} patch
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function updateMessage(messageId, patch) {
  return supabase.from('messages').update(patch).eq('id', messageId);
}

/**
 * Marks multiple messages as read (batch update).
 * Source: index.html line 7800
 *
 * @param {string[]} messageIds
 * @param {string} readAt  ISO datetime string
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function markMessagesRead(messageIds, readAt) {
  return supabase.from('messages').update({ read_at: readAt }).in('id', messageIds);
}

/**
 * Subscribes to realtime messages for a booking channel.
 * Source: index.html line 8046
 *
 * @param {string} bookingId
 * @returns {import('@supabase/supabase-js').RealtimeChannel}
 */
export function subscribeToBookingChannel(bookingId) {
  return supabase.channel('dm-' + bookingId);
}

/**
 * Subscribes to typing broadcasts for a booking.
 * Source: index.html lines 8036, 8095
 *
 * @param {string} bookingId
 * @returns {import('@supabase/supabase-js').RealtimeChannel}
 */
export function subscribeToTypingChannel(bookingId) {
  return supabase.channel('typing-' + bookingId);
}

/**
 * Subscribes to the inbox realtime channel for a user (unread badge).
 * Source: index.html line 8114
 *
 * @param {string} userId
 * @returns {import('@supabase/supabase-js').RealtimeChannel}
 */
export function subscribeToInboxChannel(userId) {
  return supabase.channel('dm-inbox-' + userId);
}

/**
 * Uploads a chat attachment file to the chat-attachments storage bucket.
 * Source: index.html line 8004
 *
 * @param {string} path
 * @param {File} file
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').StorageError | null }>}
 */
export async function uploadChatAttachment(path, file) {
  return supabase.storage.from('chat-attachments').upload(path, file);
}

/**
 * Returns the public URL for a chat attachment.
 * Source: index.html line 8006
 *
 * @param {string} path
 * @returns {{ data: { publicUrl: string } }}
 */
export function getChatAttachmentPublicUrl(path) {
  return supabase.storage.from('chat-attachments').getPublicUrl(path);
}
