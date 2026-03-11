/**
 * Barrel file — re-exports everything from the Solen service layer.
 *
 * Import from this file when you need multiple services in one module:
 *
 *   import { supabase, signIn, fetchStores, createBooking } from '@/services';
 *
 * Or import directly from individual files for tree-shaking:
 *
 *   import { signIn } from '@/services/auth.js';
 */

// Supabase client singleton
export { supabase } from './supabase.js';

// Auth: sign-in / sign-up / sign-out / session / profile helpers
export {
  getSession,
  getUser,
  onAuthStateChange,
  signInWithPassword,
  signUp,
  resendSignupEmail,
  signOut,
  signInWithGoogle,
  resetPasswordForEmail,
  updatePassword,
  sendSmsOtp,
  verifySmsOtp,
  upsertProfile,
  fetchProfile,
  fetchProfileByUserId,
  checkProfileByEmail,
  upsertProfileByUserId,
} from './auth.js';

// Salons: stores, salons, services, photos, reviews, staff, inventory, admin
export {
  fetchStores,
  fetchApprovedSalons,
  fetchStoreById,
  fetchAllStoresAdmin,
  fetchSalonsByOwner,
  fetchStoresByUserId,
  insertStore,
  updateStore,
  deleteStore,
  fetchAllSalonsAdmin,
  fetchSalonById,
  insertSalon,
  updateSalon,
  deleteSalon,
  fetchUserSalonOwnership,
  fetchServices,
  fetchServicesWithStore,
  insertServices,
  deleteService,
  fetchSalonPhotos,
  fetchAllSalonPhotos,
  uploadSalonPhotoFile,
  getSalonPhotoPublicUrl,
  removeSalonPhotoFiles,
  insertSalonPhoto,
  updateSalonPhoto,
  deleteSalonPhoto,
  fetchReviews,
  insertReview,
  updateReview,
  uploadReviewPhotoFile,
  getReviewPhotoPublicUrl,
  fetchStaff,
  fetchInventory,
  insertInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  fetchPendingStores,
  setStoreVerified,
  fetchUserProfiles,
  fetchProfiles,
  setUserBanned,
  deleteProfileById,
  trackAnalyticsEvent,
  insertErrorLog,
} from './salons.js';

// Bookings: CRUD, reminders, messaging / DM system
export {
  fetchUserBookings,
  fetchUserBookedStoreIds,
  fetchSalonBookings,
  fetchBookedSlots,
  fetchSalonBookedTimes,
  fetchAllBookingsAdmin,
  fetchConfirmedBookingsForStore,
  fetchNextConfirmedBooking,
  fetchStoreCalendarBookings,
  fetchBookingsForCRM,
  fetchBookingsForCRMPhotos,
  fetchCRMBookingCustomers,
  fetchStaffCommissionData,
  fetchCustomerEmailsForBlast,
  countConfirmedBookings,
  fetchStaffRevenueBookings,
  fetchBookingsForAnalytics,
  fetchStoreScheduleBookings,
  fetchCustomerContactData,
  createBooking,
  createRecurringBooking,
  createInlineBooking,
  updateBooking,
  cancelUserBooking,
  cancelBookingByAdmin,
  updateBookingCRMPhoto,
  insertReminders,
  fetchMessages,
  insertMessage,
  updateMessage,
  markMessagesRead,
  subscribeToBookingChannel,
  subscribeToTypingChannel,
  subscribeToInboxChannel,
  uploadChatAttachment,
  getChatAttachmentPublicUrl,
} from './bookings.js';
