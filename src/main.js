/**
 * src/main.js — Application entry point.
 *
 * Module structure:
 *
 *   src/
 *   ├── main.js                        ← you are here
 *   ├── store/
 *   │   └── index.js                   — reactive state store + getLocale()
 *   ├── modules/
 *   │   ├── auth.js                    — login, signup, session, profile
 *   │   ├── booking.js                 — confirm/insert booking, reminders, cancel
 *   │   ├── salons.js                  — load stores, filter/sort, favourites, reviews
 *   │   ├── dashboard.js               — salon owner: staff, hours, photos, analytics
 *   │   ├── admin.js                   — admin: approve/reject salons, users
 *   │   ├── crm.js                     — CRM: customer notes, tags, visit history
 *   │   └── analytics.js               — event tracking, scroll depth, page views
 *   ├── services/
 *   │   ├── supabase.js                — shared Supabase client singleton
 *   │   ├── auth.js                    — raw Supabase auth helpers
 *   │   ├── bookings.js                — raw booking CRUD
 *   │   └── salons.js                  — raw salon data fetching
 *   └── styles/
 *       ├── main.css                   — CSS entry point
 *       ├── variables.css              — design tokens
 *       └── components.css             — per-component styles
 *
 * Bootstrap sequence:
 *   1. Import CSS so Vite processes and injects it.
 *   2. Restore auth session and update the store.
 *   3. Initialize analytics (scroll depth tracking).
 *   4. Expose module functions globally as window.solenModules so the
 *      legacy inline scripts in index.html can call them during the
 *      incremental migration.
 *
 * NOTE: index.html still contains the full legacy inline app. This module
 * coexists without interfering. As each inline function is migrated,
 * the corresponding window.solenModules call replaces it.
 */

import './styles/main.css';

import { store, getLocale } from '@/store/index.js';

import { initAuth, onAuthStateChange, login, loginWithGoogle, signOut,
         signupCustomer, signupSalon, resetPassword, resendPasswordReset,
         updatePassword, sendSmsOtp, verifyPhoneOtp,
         loadProfile, saveProfile, isAdmin, isSalonOwner } from '@/modules/auth.js';

import { confirmBooking, insertBooking, joinWaitingList,
         cancelBooking, fetchUserBookings, scheduleReminders,
         checkAndSetVerifiedAfterBooking } from '@/modules/booking.js';

import { loadStores, fetchStoreDetail, loadReviews, submitReview,
         submitReviewReply, applyFilters, haversine,
         preloadAllSalonPhotos, getSalonPhotos, getSalonMainPhotoUrl,
         fetchLastMinuteSlots, toggleFav, isFav } from '@/modules/salons.js';

import { loadMySalons, loadDashboardBookings, updateBookingStatus,
         saveDashHours, saveServices, loadStaff, addStaff, deleteStaff,
         updateStaffBookable, loadBlockedDates, addVacationBlock,
         deleteVacationBlock, loadAddons, toggleAddon, saveAddonPrice,
         loadSalonPhotos, uploadSalonPhoto, deleteSalonPhoto, setCoverPhoto,
         loadAnalytics } from '@/modules/dashboard.js';

import { loadPendingSalons, approveStore, rejectStore, loadAdminBookings,
         adminCancelBooking, loadAdminUsers, toggleBanUser,
         deleteProfile } from '@/modules/admin.js';

import { loadCRMFromBookings, saveCRMNote, saveCRMAllergy,
         toggleCRMTag, getLocalCRM } from '@/modules/crm.js';

import { track, persistEvent, initScrollDepthTracking,
         trackPageView, getSessionEvents } from '@/modules/analytics.js';

// Phase 3 view components
import { DashboardCalendar } from '@/views/dashboard/calendar.js';
import { NotificationCenter } from '@/views/dashboard/notifications.js';
import { renderRevenueChart, renderTopServicesChart, renderPeakHoursChart } from '@/views/dashboard/revenue-chart.js';
import { MapView, FilterPresets } from '@/views/filtering/index.js';
import { ReviewForm, ReviewList, submitReviewWithPhoto, uploadReviewPhoto, hasVerifiedVisit } from '@/views/reviews/index.js';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function init() {
  // Start analytics immediately
  initScrollDepthTracking();

  // Restore session (updates store.currentUser + store.currentProfile)
  await initAuth();
}

document.addEventListener('DOMContentLoaded', init);

// ---------------------------------------------------------------------------
// Global bridge — lets legacy inline scripts call module functions
// during the incremental migration from index.html
// ---------------------------------------------------------------------------

window.solenModules = {
  // Store
  store,
  getLocale,

  // Auth
  initAuth, onAuthStateChange,
  login, loginWithGoogle, signOut,
  signupCustomer, signupSalon,
  resetPassword, resendPasswordReset, updatePassword,
  sendSmsOtp, verifyPhoneOtp,
  loadProfile, saveProfile,
  isAdmin, isSalonOwner,

  // Booking
  confirmBooking, insertBooking, joinWaitingList,
  cancelBooking, fetchUserBookings, scheduleReminders,
  checkAndSetVerifiedAfterBooking,

  // Salons
  loadStores, fetchStoreDetail, loadReviews, submitReview, submitReviewReply,
  applyFilters, haversine,
  preloadAllSalonPhotos, getSalonPhotos, getSalonMainPhotoUrl,
  fetchLastMinuteSlots, toggleFav, isFav,

  // Dashboard
  loadMySalons, loadDashboardBookings, updateBookingStatus,
  saveDashHours, saveServices,
  loadStaff, addStaff, deleteStaff, updateStaffBookable,
  loadBlockedDates, addVacationBlock, deleteVacationBlock,
  loadAddons, toggleAddon, saveAddonPrice,
  loadSalonPhotos, uploadSalonPhoto, deleteSalonPhoto, setCoverPhoto,
  loadAnalytics,

  // Admin
  loadPendingSalons, approveStore, rejectStore,
  loadAdminBookings, adminCancelBooking,
  loadAdminUsers, toggleBanUser, deleteProfile,

  // CRM
  loadCRMFromBookings, saveCRMNote, saveCRMAllergy, toggleCRMTag, getLocalCRM,

  // Analytics
  track, persistEvent, trackPageView, getSessionEvents,

  // Phase 3 — Dashboard views
  DashboardCalendar,
  NotificationCenter,
  renderRevenueChart,
  renderTopServicesChart,
  renderPeakHoursChart,

  // Phase 3 — Advanced filtering
  MapView,
  FilterPresets,

  // Phase 3 — Reviews
  ReviewForm,
  ReviewList,
  submitReviewWithPhoto,
  uploadReviewPhoto,
  hasVerifiedVisit,
};
