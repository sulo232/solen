/**
 * src/modules/booking.js — Booking data layer.
 *
 * Extracted from index.html (confirmBooking ~6875, insertBooking ~9734,
 * scheduleReminders ~6961, userCancelBooking ~8205, joinWaitingList ~9781).
 *
 * Exports pure async functions for Supabase calls.
 * UI state (bookingState / bmState) is managed via the store.
 * DOM rendering stays in legacy inline scripts during the migration phase.
 */

import { supabase } from '@/services/supabase.js';
import { store } from '@/store/index.js';

// ---------------------------------------------------------------------------
// Reference generator
// ---------------------------------------------------------------------------

function generateReference() {
  return 'SOLEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

/**
 * Schedule 48h and 2h email reminders for a booking.
 */
export async function scheduleReminders({
  bookingId, userId, salonId, salonName,
  serviceName, bookingDate, bookingTime,
  customerName, customerEmail,
}) {
  if (!customerEmail || !bookingDate || !bookingTime) return;
  const bookingTs = new Date(`${bookingDate}T${bookingTime}:00`);
  if (isNaN(bookingTs.getTime())) return;

  const base = {
    booking_id: bookingId || null,
    user_id: userId || null,
    salon_name: salonName || '',
    service_name: serviceName || '',
    booking_time: bookingTs.toISOString(),
    customer_name: customerName || '',
    customer_email: customerEmail,
    type: 'email',
    sent: false,
  };

  await supabase.from('reminders').insert([
    { ...base, reminder_time: new Date(bookingTs.getTime() - 48 * 60 * 60 * 1000).toISOString() },
    { ...base, reminder_time: new Date(bookingTs.getTime() - 2 * 60 * 60 * 1000).toISOString() },
  ]);
}

// ---------------------------------------------------------------------------
// Wizard booking flow (bookingState — legacy "startBooking" flow)
// ---------------------------------------------------------------------------

/**
 * Submit a booking from the wizard flow.
 * @param {object} params — all required booking fields
 * @returns {{ reference, bookingId, error }}
 */
export async function confirmBooking({
  userId, storeId, store: salonStore,
  service, date, time,
  firstName, lastName, phone, email,
  note, wantsBleaching, selectedAddons,
  wantsReminder, isFirstVisit,
  staffId, staffName,
  isRecurring, recurrenceWeeks, recurrenceCount,
}) {
  const reference = generateReference();
  const recurGroupId = isRecurring ? crypto.randomUUID() : null;

  let noteText = note || '';
  if (wantsBleaching) {
    const addonNames = (selectedAddons || []).map((a) => a.name).join(', ');
    const extrasLine = '[Bleaching/Farbe gewünscht' + (addonNames ? '; Extras: ' + addonNames : '') + ']';
    noteText = noteText ? noteText + '\n' + extrasLine : extrasLine;
  }

  const { data: bkData, error } = await supabase.from('bookings').insert({
    user_id: userId,
    store_id: storeId,
    salon_id: storeId,
    salon_name: salonStore?.name || '',
    service_name: service?.name || '',
    service_price: service?.price || 0,
    service_duration: service?.duration || 0,
    booking_date: date,
    booking_time: time,
    customer_first: firstName,
    customer_last: lastName,
    customer_email: email,
    customer_phone: phone,
    note: noteText,
    extras_bleaching: wantsBleaching || false,
    extras_addons: selectedAddons?.length ? JSON.stringify(selectedAddons) : null,
    status: 'confirmed',
    reference,
    staff_id: staffId || null,
    staff_name: staffName || null,
    is_first_visit: isFirstVisit !== false,
    recurrence_group_id: recurGroupId,
    recurrence_index: 0,
    recurrence_interval_weeks: isRecurring ? recurrenceWeeks : 0,
  }).select('id').single();

  if (error) return { reference: null, bookingId: null, error };

  // Update store state
  const userBookedStores = store.get('userBookedStores');
  userBookedStores.add(storeId);
  store.set('userBookedStores', userBookedStores);

  if (wantsReminder !== false) {
    await scheduleReminders({
      bookingId: bkData?.id, userId, salonId: storeId,
      salonName: salonStore?.name, serviceName: service?.name,
      bookingDate: date, bookingTime: time,
      customerName: [firstName, lastName].filter(Boolean).join(' '),
      customerEmail: email,
    });
  }

  // Handle recurring bookings
  if (isRecurring && recurrenceCount > 1) {
    const baseDate = new Date(date);
    for (let i = 1; i < recurrenceCount; i++) {
      const recurDate = new Date(baseDate.getTime());
      recurDate.setDate(recurDate.getDate() + i * recurrenceWeeks * 7);
      const { error: recErr } = await supabase.from('bookings').insert({
        user_id: userId, store_id: storeId, salon_id: storeId,
        salon_name: salonStore?.name || '',
        service_name: service?.name || '',
        service_price: service?.price || 0,
        service_duration: service?.duration || 0,
        booking_date: recurDate.toISOString().slice(0, 10),
        booking_time: time,
        customer_first: firstName, customer_last: lastName,
        customer_email: email, customer_phone: phone,
        note, status: 'confirmed',
        reference: reference + '-R' + i,
        staff_id: staffId || null, staff_name: staffName || null,
        is_first_visit: isFirstVisit !== false,
        recurrence_group_id: recurGroupId,
        recurrence_index: i,
        recurrence_interval_weeks: recurrenceWeeks,
      });
      if (recErr) break;
    }
  }

  return { reference, bookingId: bkData?.id, error: null };
}

// ---------------------------------------------------------------------------
// Modal booking flow (bmState — newer "openBookingModal" flow)
// ---------------------------------------------------------------------------

/**
 * Submit a booking from the modal/book-page flow.
 * @param {object} bmState — the current bmState object from the store
 * @returns {{ bookingId, error, slotConflict }}
 */
export async function insertBooking(bmState) {
  const user = store.get('currentUser');
  const svc = bmState.service;
  const isDemo = typeof bmState.store?.id === 'string' && bmState.store.id.startsWith('d');

  const { data: bkData, error } = await supabase.from('bookings').insert({
    salon_id: isDemo ? null : bmState.store?.id,
    user_id: user?.id || null,
    guest_name: bmState.guestName,
    guest_phone: bmState.guestPhone,
    guest_email: bmState.guestEmail,
    service_name: svc?.name || bmState.customSvc || '',
    service_price: (svc?.price || parseFloat(bmState.customPrice) || 0) + (bmState.haircutStyle ? 15 : 0),
    service_duration: (svc?.duration || 0) + (bmState.haircutStyle ? 20 : 0),
    booking_date: bmState.date,
    booking_time: bmState.time,
    status: 'pending',
    notes: [
      bmState.notes,
      bmState.haircutStyle ? `Stil: ${bmState.haircutStyleName || ''}` : null,
    ].filter(Boolean).join('\n') || null,
    is_first_visit: bmState.isFirstVisit !== false,
    staff_id: bmState.staffId || null,
    staff_name: bmState.staffName || null,
    stylist_selection_fee: bmState.staffId ? (parseFloat(bmState.stylistFee) || 0) : 0,
  }).select('id').single();

  if (error) return { bookingId: null, error, slotConflict: true };

  if (bmState.wantsReminder !== false) {
    await scheduleReminders({
      bookingId: bkData?.id,
      userId: user?.id,
      salonId: isDemo ? null : bmState.store?.id,
      salonName: bmState.store?.name,
      serviceName: svc?.name || bmState.customSvc,
      bookingDate: bmState.date,
      bookingTime: bmState.time,
      customerName: bmState.guestName,
      customerEmail: bmState.guestEmail || user?.email || '',
    });
  }

  return { bookingId: bkData?.id, error: null, slotConflict: false };
}

// ---------------------------------------------------------------------------
// Waiting list
// ---------------------------------------------------------------------------

/**
 * Add the current user to the waiting list for a slot.
 * @returns {{ error }}
 */
export async function joinWaitingList(bmState) {
  const user = store.get('currentUser');
  const svc = bmState.service;
  const isDemo = typeof bmState.store?.id === 'string' && bmState.store.id.startsWith('d');
  const slotDt = bmState.date && bmState.time
    ? bmState.date + 'T' + bmState.time + ':00'
    : null;

  const { error } = await supabase.from('waiting_list').insert({
    store_id: isDemo ? null : bmState.store?.id,
    service: svc?.name || bmState.customSvc || null,
    slot_datetime: slotDt,
    user_id: user?.id || null,
    user_email: bmState.guestEmail || user?.email || null,
  });

  return { error };
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

/**
 * Cancel a booking (user-initiated).
 * @param {string} bookingId
 * @returns {{ error }}
 */
export async function cancelBooking(bookingId) {
  const user = store.get('currentUser');
  if (!user) return { error: { message: 'not_authenticated' } };
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId)
    .eq('user_id', user.id);
  return { error };
}

// ---------------------------------------------------------------------------
// User bookings list
// ---------------------------------------------------------------------------

/**
 * Fetch all bookings for the current user.
 * @returns {object[]}
 */
export async function fetchUserBookings() {
  const user = store.get('currentUser');
  if (!user) return [];
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('booking_date', { ascending: false });
  return data || [];
}

// ---------------------------------------------------------------------------
// Post-booking
// ---------------------------------------------------------------------------

/**
 * Auto-grant verified badge once a salon has 10+ confirmed bookings.
 * @param {string} storeId
 */
export async function checkAndSetVerifiedAfterBooking(storeId) {
  if (!storeId) return;
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact' })
    .eq('store_id', storeId)
    .eq('status', 'confirmed');
  if ((count || 0) >= 10) {
    await supabase.from('stores').update({ is_verified: true }).eq('id', storeId);
  }
}
