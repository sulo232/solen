/**
 * src/views/dashboard/notifications.js — Real-time booking notification center.
 *
 * Phase 3 feature: subscribes to Supabase realtime on the `bookings` table
 * for a specific store. When a new booking arrives, fires a browser notification
 * and renders an in-app notification badge + panel.
 *
 * XSS safety: all user-provided values (customer names, service names) are
 * passed through esc() before innerHTML insertion. Status values are looked up
 * in a static allowlist (STATUS_COLORS) — never interpolated raw.
 *
 * Usage:
 *   import { NotificationCenter } from '@/views/dashboard/notifications.js';
 *   const nc = new NotificationCenter(badgeEl, panelEl, storeId);
 *   nc.start();
 *   nc.stop();
 */

import { supabase } from '@/services/supabase.js';

// ---------------------------------------------------------------------------
// Security helper
// ---------------------------------------------------------------------------

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Static maps (no user data)
// ---------------------------------------------------------------------------

const STATUS_COLORS = {
  confirmed: 'var(--c-success)',
  pending:   'var(--c-warning)',
  cancelled: 'var(--c-error)',
};

// ---------------------------------------------------------------------------
// NotificationCenter
// ---------------------------------------------------------------------------

export class NotificationCenter {
  #badgeEl;
  #panelEl;
  #storeId;
  #channel = null;
  #notifications = [];
  #unreadCount = 0;

  constructor(badgeEl, panelEl, storeId) {
    this.#badgeEl = badgeEl;
    this.#panelEl = panelEl;
    this.#storeId = String(storeId);
  }

  start() {
    this.#requestBrowserPermission();
    this.#channel = supabase
      .channel(`notifications-${this.#storeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `store_id=eq.${this.#storeId}`,
      }, (payload) => {
        this.#handleNewBooking(payload.new);
      })
      .subscribe();
  }

  stop() {
    this.#channel?.unsubscribe();
    this.#channel = null;
  }

  markAllRead() {
    this.#unreadCount = 0;
    this.#notifications.forEach((n) => { n.read = true; });
    this.#updateBadge();
    this.#renderPanel();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  #handleNewBooking(booking) {
    // Build display strings using safe values from DB
    const firstName = String(booking.customer_first || '');
    const lastName  = String(booking.customer_last  || '');
    const guestName = String(booking.guest_name     || '');
    const name    = firstName ? `${firstName} ${lastName}`.trim() : (guestName || 'Gast');
    const service = String(booking.service_name || 'Termin');
    const time    = String(booking.booking_time || '').slice(0, 5);
    const date    = String(booking.booking_date || '');

    this.#notifications.unshift({
      id:      String(booking.id || ''),
      name,
      service,
      meta:    `${date} ${time}`.trim(),
      status:  String(booking.status || 'pending'),
      ts:      Date.now(),
      read:    false,
    });

    if (this.#notifications.length > 50) this.#notifications.pop();
    this.#unreadCount++;
    this.#updateBadge();
    this.#renderPanel();
    this.#fireBrowserNotification(name, service, date, time);
  }

  #updateBadge() {
    if (!this.#badgeEl) return;
    if (this.#unreadCount > 0) {
      // textContent is XSS-safe
      this.#badgeEl.textContent = this.#unreadCount > 99 ? '99+' : String(this.#unreadCount);
      this.#badgeEl.classList.remove('hidden');
    } else {
      this.#badgeEl.classList.add('hidden');
    }
  }

  #renderPanel() {
    if (!this.#panelEl) return;

    if (!this.#notifications.length) {
      this.#panelEl.innerHTML = `
        <div class="dash-notif-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-muted)" stroke-width="1.5" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>Keine neuen Benachrichtigungen</p>
        </div>`;
      return;
    }

    const unreadLabel = this.#unreadCount > 0
      ? `${Number(this.#unreadCount)} ungelesen`
      : 'Alle gelesen';

    // All user-provided values (name, service, meta) go through esc()
    const html = `
      <div class="dash-notif-list">
        <div class="dash-notif-header">
          <span>${unreadLabel}</span>
          ${this.#unreadCount > 0
            ? '<button class="dash-notif-mark-read" data-action="mark-read">Alle als gelesen markieren</button>'
            : ''}
        </div>
        ${this.#notifications.slice(0, 20).map((n) => {
          // Status is looked up in a static allowlist — not interpolated raw
          const color = STATUS_COLORS[n.status] || 'var(--c-accent)';
          return `
            <div class="dash-notif-item${n.read ? '' : ' dash-notif-unread'}">
              <div class="dash-notif-dot" style="background:${color}"></div>
              <div class="dash-notif-body">
                <div class="dash-notif-title">Neue Buchung</div>
                <div class="dash-notif-message">${esc(n.name)} \u2014 ${esc(n.service)}</div>
                <div class="dash-notif-meta">${esc(n.meta)} \u00b7 ${this.#timeAgo(n.ts)}</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;

    this.#panelEl.innerHTML = html;

    this.#panelEl
      .querySelector('[data-action="mark-read"]')
      ?.addEventListener('click', () => this.markAllRead());
  }

  async #requestBrowserPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  #fireBrowserNotification(name, service, date, time) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    // Notification API body is plain text — no HTML injection risk
    try {
      new Notification('solen \u00b7 Neue Buchung', {
        body: `${name} \u2014 ${service}\n${date} ${time}`,
        icon: '/icon-192.png',
        tag: 'solen-booking',
        renotify: true,
      });
    } catch { /* some browsers block SW-less notifications */ }
  }

  #timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60)    return 'Gerade eben';
    if (diff < 3600)  return `vor ${Math.floor(diff / 60)} Min.`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
    return `vor ${Math.floor(diff / 86400)} Tagen`;
  }
}
