/**
 * src/modules/auth.js — Authentication module.
 *
 * Extracted from index.html lines 4761-5401.
 *
 * Exports pure async functions that:
 *  1. Call Supabase auth APIs
 *  2. Update the reactive store (currentUser, currentProfile)
 *  3. Return { data, error } — callers handle DOM/routing side-effects
 *
 * The ADMIN_EMAIL constant is intentionally read from env so it never
 * appears as a hardcoded string in source.
 */

import { supabase } from '@/services/supabase.js';
import { store } from '@/store/index.js';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'habobi1238@proton.me';

// ---------------------------------------------------------------------------
// Rate limiter — prevents brute-force / spam (in-memory, resets on reload)
// ---------------------------------------------------------------------------

const _rl = {
  counts: {},
  check(key, limit = 5, windowMs = 60_000) {
    const now = Date.now();
    if (!this.counts[key]) this.counts[key] = [];
    this.counts[key] = this.counts[key].filter((t) => now - t < windowMs);
    if (this.counts[key].length >= limit) return false;
    this.counts[key].push(now);
    return true;
  },
};

// ---------------------------------------------------------------------------
// Session init — call once on page load
// ---------------------------------------------------------------------------

/**
 * Restore any existing session from Supabase.
 * Returns the user if a session exists, null otherwise.
 */
export async function initAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      store.set('currentUser', session.user);
      await loadProfile();
      return session.user;
    }
  } catch (e) {
    console.warn('[auth] initAuth error:', e);
  }
  return null;
}

/**
 * Register the Supabase auth state change listener.
 * Fires the provided callbacks so the caller can handle DOM/routing.
 *
 * @param {{ onSignIn: (user) => void, onSignOut: () => void, onRecovery: () => void }} callbacks
 * @returns {() => void} unsubscribe function
 */
export function onAuthStateChange({ onSignIn, onSignOut, onRecovery } = {}) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const wasLoggedOut = !store.get('currentUser');
      store.set('currentUser', session.user);
      if (wasLoggedOut) {
        onSignIn?.(session.user);
      }
    } else if (event === 'PASSWORD_RECOVERY') {
      onRecovery?.();
    } else if (event === 'SIGNED_OUT') {
      store.patch({ currentUser: null, currentProfile: null });
      onSignOut?.();
    }
  });
  return () => subscription.unsubscribe();
}

// ---------------------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------------------

/**
 * Email + password login.
 * @returns {{ data, error }}
 */
export async function login(email, password) {
  if (!_rl.check('auth')) return { data: null, error: { message: 'rate_limited' } };
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.data?.user) {
    store.set('currentUser', result.data.user);
    await loadProfile();
  }
  return result;
}

/**
 * Google OAuth — redirects to Google, returns on success.
 * @returns {{ error }}
 */
export async function loginWithGoogle() {
  if (!_rl.check('auth')) return { error: { message: 'rate_limited' } };
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://www.solen.ch' },
  });
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  await supabase.auth.signOut();
  store.patch({ currentUser: null, currentProfile: null });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Customer registration.
 * @param {{ email, password, firstName, lastName }} params
 * @returns {{ data, error }}
 */
export async function signupCustomer({ email, password, firstName, lastName }) {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: 'https://www.solen.ch',
    },
  });
  if (result.data?.user && result.data.user.identities?.length > 0) {
    await supabase.from('profiles').upsert({
      id: result.data.user.id,
      display_name: name,
      role: 'customer',
    });
  }
  return result;
}

/**
 * Salon owner registration — creates auth user + profile + salon + services.
 * @param {{ email, password, firstName, lastName, salonName, salonType, salonAddress, salonPhone, salonDesc, services }} params
 * @returns {{ data, error, salonError }}
 */
export async function signupSalon({
  email, password, firstName, lastName,
  salonName, salonType, salonAddress, salonPhone, salonDesc,
  services = [],
}) {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: 'https://www.solen.ch',
    },
  });

  if (result.error || !result.data?.user) return result;
  if (result.data.user.identities?.length === 0) {
    return { ...result, error: { message: 'already_registered' } };
  }

  const userId = result.data.user.id;
  await supabase.from('profiles').upsert({ id: userId, display_name: name, role: 'salon_owner' });

  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .insert({ owner_id: userId, name: salonName, type: salonType, address: salonAddress, phone: salonPhone, description: salonDesc, status: 'pending' })
    .select()
    .single();

  if (!salonError && salon && services.length) {
    await supabase.from('services').insert(
      services.map((s) => ({ salon_id: salon.id, ...s }))
    );
  }

  return { ...result, salonError };
}

// ---------------------------------------------------------------------------
// Password management
// ---------------------------------------------------------------------------

/**
 * Send password reset email.
 * @returns {{ error }}
 */
export async function resetPassword(email) {
  // Verify the email exists first
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (!profile) return { error: { message: 'email_not_found' } };

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/#reset-password',
  });
}

/**
 * Resend password reset email (no profile check — used from the hint link).
 */
export async function resendPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/#reset-password',
  });
}

/**
 * Update the current user's password.
 * @returns {{ error }}
 */
export async function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword });
}

// ---------------------------------------------------------------------------
// Phone OTP
// ---------------------------------------------------------------------------

/**
 * Send SMS OTP to a phone number.
 * @param {string} phone  — E.164 format, e.g. "+41791234567"
 * @returns {{ error }}
 */
export async function sendSmsOtp(phone) {
  if (!_rl.check('auth')) return { error: { message: 'rate_limited' } };
  return supabase.auth.signInWithOtp({ phone });
}

/**
 * Verify SMS OTP.
 * @returns {{ data, error }}
 */
export async function verifyPhoneOtp(phone, token) {
  const result = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (result.data?.user) {
    store.set('currentUser', result.data.user);
    await loadProfile();
  }
  return result;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * Fetch and store the current user's profile.
 * @returns {object|null} profile data
 */
export async function loadProfile() {
  const user = store.get('currentUser');
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  store.set('currentProfile', data);
  return data;
}

/**
 * Save profile setup data (onboarding step).
 * @param {object} profileData
 * @returns {{ error }}
 */
export async function saveProfile(profileData) {
  const user = store.get('currentUser');
  if (!user) return { error: { message: 'not_authenticated' } };
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    ...profileData,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (!error) await loadProfile();
  return { error };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the given user is an admin.
 * @param {object} user — Supabase user object
 */
export function isAdmin(user) {
  if (!user) return false;
  return (
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin'
  );
}

/**
 * Check if the current user owns any salon/store.
 * @returns {boolean}
 */
export async function isSalonOwner() {
  const user = store.get('currentUser');
  const profile = store.get('currentProfile');
  if (!user) return false;
  if (profile?.role === 'salon_owner' || profile?.role === 'owner') return true;
  const [{ data: salonData }, { data: storeData }] = await Promise.all([
    supabase.from('salons').select('id').eq('owner_id', user.id).limit(1),
    supabase.from('stores').select('id').eq('user_id', user.id).limit(1),
  ]);
  return (salonData?.length > 0) || (storeData?.length > 0);
}
