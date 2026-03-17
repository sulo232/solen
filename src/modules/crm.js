/**
 * src/modules/crm.js — Salon owner CRM (customer relationship management).
 *
 * Extracted from index.html: loadCRMFromBookings ~12201, saveCRM ~12198,
 * renderCRM ~12498.
 *
 * CRM data is built from the bookings table and cached in localStorage.
 * The store holds a `crmData` map keyed by storeId → { [clientId]: client }.
 */

import { supabase } from '@/services/supabase.js';

const STORAGE_KEY = 'solen_crm';

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function readLocalCRM() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLocalCRM(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full */ }
}

// ---------------------------------------------------------------------------
// Load & hydrate
// ---------------------------------------------------------------------------

/**
 * Build CRM data for a store by reading its bookings.
 * Merges with any locally saved notes/tags.
 *
 * @param {string} storeId
 * @returns {Object.<string, CRMClient>} — map of clientId → client object
 */
export async function loadCRMFromBookings(storeId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('customer_id,customer_name,customer_phone,customer_email,created_at,service_name,service_price')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) return {};

  const localCRM = readLocalCRM();
  const existing = localCRM[storeId] || {};
  const visitCounts = {};
  const clients = {};

  (data || []).forEach((b) => {
    const id = b.customer_id || b.customer_phone || 'anon';
    if (!clients[id]) {
      clients[id] = {
        id,
        name: b.customer_name || 'Unbekannt',
        phone: b.customer_phone || '',
        email: b.customer_email || '',
        visits: 0,
        totalSpend: 0,
        lastVisit: null,
        // Merge locally saved notes / tags
        notes: existing[id]?.notes || '',
        tags: existing[id]?.tags || [],
        allergies: existing[id]?.allergies || '',
      };
    }
    visitCounts[id] = (visitCounts[id] || 0) + 1;
    clients[id].visits = visitCounts[id];
    clients[id].totalSpend = (clients[id].totalSpend || 0) + (b.service_price || 0);
    if (b.created_at) {
      const visit = b.created_at.split('T')[0];
      if (!clients[id].lastVisit || visit > clients[id].lastVisit) {
        clients[id].lastVisit = visit;
      }
    }
  });

  // Persist merged data
  localCRM[storeId] = clients;
  writeLocalCRM(localCRM);

  return clients;
}

// ---------------------------------------------------------------------------
// Mutations (local only — CRM notes are not synced to Supabase)
// ---------------------------------------------------------------------------

/**
 * Save a note for a client.
 * @param {string} storeId
 * @param {string} clientId
 * @param {string} notes
 */
export function saveCRMNote(storeId, clientId, notes) {
  const data = readLocalCRM();
  if (!data[storeId]) data[storeId] = {};
  if (!data[storeId][clientId]) data[storeId][clientId] = {};
  data[storeId][clientId].notes = notes;
  writeLocalCRM(data);
}

/**
 * Save allergy info for a client.
 * @param {string} storeId
 * @param {string} clientId
 * @param {string} allergies
 */
export function saveCRMAllergy(storeId, clientId, allergies) {
  const data = readLocalCRM();
  if (!data[storeId]) data[storeId] = {};
  if (!data[storeId][clientId]) data[storeId][clientId] = {};
  data[storeId][clientId].allergies = allergies;
  writeLocalCRM(data);
}

/**
 * Toggle a tag on a client.
 * @param {string} storeId
 * @param {string} clientId
 * @param {string} tag
 * @returns {string[]} updated tags
 */
export function toggleCRMTag(storeId, clientId, tag) {
  const data = readLocalCRM();
  if (!data[storeId]) data[storeId] = {};
  if (!data[storeId][clientId]) data[storeId][clientId] = { tags: [] };
  const tags = data[storeId][clientId].tags || [];
  const idx = tags.indexOf(tag);
  if (idx > -1) tags.splice(idx, 1);
  else tags.push(tag);
  data[storeId][clientId].tags = tags;
  writeLocalCRM(data);
  return tags;
}

/**
 * Read the locally stored CRM data for a store.
 * @param {string} storeId
 * @returns {Object.<string, CRMClient>}
 */
export function getLocalCRM(storeId) {
  return readLocalCRM()[storeId] || {};
}
