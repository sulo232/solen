/**
 * Authentication helpers for the Solen beauty booking app.
 *
 * All functions are lifted verbatim from index.html and re-exported as named
 * ES module exports.  No logic has been changed — this is a pure lift-and-shift.
 *
 * Covered auth flows (source lines in index.html):
 *   - Email / password sign-in  (line 5124)
 *   - Email / password sign-up  (line 5148, 5216)
 *   - Google OAuth              (line 5258)
 *   - Sign-out                  (line 5263)
 *   - Password reset email      (line 5281, 5345)
 *   - Password update           (line 5356)
 *   - SMS OTP send / verify     (line 5309, 5327)
 *   - Resend signup confirmation (line 5179)
 *   - Get current session       (line 4763, 5367, 6590, 7256)
 *   - Get current user          (line 9956, 9962, 9964)
 *   - Auth state change         (line 4768)
 *   - Profile upsert on signup  (line 5166, 5230)
 *
 * Usage:
 *   import { getSession, signInWithPassword, signOut, onAuthStateChange } from './auth.js';
 */

import { supabase } from './supabase.js';

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current active session (or null if unauthenticated).
 * Source: index.html lines 4763, 5367, 6590, 7256
 *
 * @returns {Promise<{ data: { session: import('@supabase/supabase-js').Session | null }, error: Error | null }>}
 */
export async function getSession() {
  return supabase.auth.getSession();
}

/**
 * Returns the currently authenticated user object (or null).
 * Source: index.html lines 9956, 9962, 9964
 *
 * @returns {Promise<{ data: { user: import('@supabase/supabase-js').User | null }, error: Error | null }>}
 */
export async function getUser() {
  return supabase.auth.getUser();
}

/**
 * Subscribes to auth state changes (SIGNED_IN, SIGNED_OUT, PASSWORD_RECOVERY, etc.).
 * Source: index.html line 4768
 *
 * @param {(event: string, session: import('@supabase/supabase-js').Session | null) => void} callback
 * @returns {{ data: { subscription: import('@supabase/supabase-js').Subscription } }}
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ---------------------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------------------

/**
 * Signs in an existing user with email and password.
 * Source: index.html line 5124
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ data: import('@supabase/supabase-js').AuthResponse['data'], error: import('@supabase/supabase-js').AuthError | null }>}
 */
export async function signInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Creates a new user account with email and password.
 * Also accepts optional metadata (full_name) and an email-redirect URL.
 * Source: index.html lines 5148, 5216
 *
 * @param {{ email: string, password: string, options?: object }} params
 * @returns {Promise<import('@supabase/supabase-js').AuthResponse>}
 */
export async function signUp({ email, password, options }) {
  return supabase.auth.signUp({
    email,
    password,
    options: options ?? { emailRedirectTo: 'https://www.solen.ch' },
  });
}

/**
 * Re-sends the signup confirmation email.
 * Source: index.html line 5179
 *
 * @param {{ type: 'signup', email: string }} params
 * @returns {Promise<{ data: {}, error: import('@supabase/supabase-js').AuthError | null }>}
 */
export async function resendSignupEmail({ email }) {
  return supabase.auth.resend({ type: 'signup', email });
}

/**
 * Signs the current user out and invalidates their session.
 * Source: index.html line 5263
 *
 * @returns {Promise<{ error: import('@supabase/supabase-js').AuthError | null }>}
 */
export async function signOut() {
  return supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

/**
 * Initiates Google OAuth sign-in / sign-up flow.
 * Source: index.html line 5258
 *
 * @returns {Promise<{ data: { provider: string, url: string }, error: import('@supabase/supabase-js').AuthError | null }>}
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://www.solen.ch' },
  });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/**
 * Sends a password-reset email to the given address.
 * Source: index.html lines 5281, 5345
 *
 * @param {{ email: string, redirectTo?: string }} params
 * @returns {Promise<{ data: {}, error: import('@supabase/supabase-js').AuthError | null }>}
 */
export async function resetPasswordForEmail({ email, redirectTo }) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? (window.location.origin + '/#reset-password'),
  });
}

/**
 * Sets a new password for the currently authenticated user (called after
 * arriving via a password-recovery link).
 * Source: index.html line 5356
 *
 * @param {{ password: string }} params
 * @returns {Promise<{ data: import('@supabase/supabase-js').UserResponse['data'], error: import('@supabase/supabase-js').AuthError | null }>}
 */
export async function updatePassword({ password }) {
  return supabase.auth.updateUser({ password });
}

// ---------------------------------------------------------------------------
// Phone / OTP
// ---------------------------------------------------------------------------

/**
 * Sends an SMS one-time-password to the given phone number.
 * Source: index.html line 5309
 *
 * @param {{ phone: string }} params
 * @returns {Promise<{ data: {}, error: import('@supabase/supabase-js').AuthError | null }>}
 */
export async function sendSmsOtp({ phone }) {
  return supabase.auth.signInWithOtp({ phone });
}

/**
 * Verifies the SMS OTP code entered by the user.
 * Source: index.html line 5327
 *
 * @param {{ phone: string, token: string }} params
 * @returns {Promise<import('@supabase/supabase-js').AuthResponse>}
 */
export async function verifySmsOtp({ phone, token }) {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
}

// ---------------------------------------------------------------------------
// Profile helpers (auth-adjacent — used immediately after sign-up/sign-in)
// ---------------------------------------------------------------------------

/**
 * Upserts a row in the `profiles` table for the given auth user.
 * Called right after successful sign-up to record display_name and role.
 * Source: index.html lines 5166, 5230, 4818
 *
 * @param {{ id: string, display_name?: string, role?: string, is_admin?: boolean, [key: string]: unknown }} profileData
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function upsertProfile(profileData) {
  return supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
}

/**
 * Fetches the profile row for the currently authenticated user.
 * Source: index.html line 4872
 *
 * @param {string} userId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single();
}

/**
 * Fetches a profile by user_id column (used by profile slide-in and modal).
 * Source: index.html line 9962
 *
 * @param {string} userId
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchProfileByUserId(userId) {
  return supabase.from('profiles').select('*').eq('user_id', userId).single();
}

/**
 * Checks whether an email address already has a profile record.
 * Used by the password-reset flow to show a friendlier error.
 * Source: index.html line 5279
 *
 * @param {string} email
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function checkProfileByEmail(email) {
  return supabase.from('profiles').select('id').eq('email', email).maybeSingle();
}

/**
 * Upserts a profile row keyed by `user_id` (as opposed to `id`).
 * Used by saveProfileSlideIn and saveProfileModal.
 * Source: index.html lines 9956, 9964
 *
 * @param {object} profileData  Must include user_id field.
 * @returns {Promise<{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function upsertProfileByUserId(profileData) {
  return supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });
}
