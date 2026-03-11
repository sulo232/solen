/**
 * Supabase client singleton for the Solen beauty booking app.
 *
 * This file is the single source of truth for the Supabase client.
 * All other service files import `supabase` from here.
 *
 * The credentials below were lifted verbatim from index.html lines 4097-4100.
 *
 * Usage:
 *   import { supabase } from './supabase.js';
 */

import { createClient } from '@supabase/supabase-js';

// TODO: move to import.meta.env.VITE_SUPABASE_URL
const SUPABASE_URL = 'https://tocfnsmxmdxkrcmjzzdw.supabase.co';

// TODO: move to import.meta.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_ANON_KEY = 'sb_publishable_WG19p7vPb3bULi-kbaWo1g_cdW28SCu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
