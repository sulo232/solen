/**
 * src/views/dashboard/calendar.js — Weekly booking calendar view.
 *
 * Phase 3 feature: renders a 7-day grid showing all bookings for the week,
 * colour-coded by status. Connects to Supabase realtime for live updates.
 *
 * XSS safety: every value from the database is passed through esc() before
 * being inserted into the DOM via innerHTML. Numeric and date values are
 * formatted with built-in formatters (no raw interpolation of DB values).
 *
 * Usage:
 *   import { DashboardCalendar } from '@/views/dashboard/calendar.js';
 *   const cal = new DashboardCalendar(containerEl, storeId);
 *   await cal.mount();
 *   cal.destroy();
 */

import { supabase } from '@/services/supabase.js';

// ---------------------------------------------------------------------------
// Security helper — escape all user-provided content before DOM insertion
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
// Constants (all static strings, no user data)
// ---------------------------------------------------------------------------

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00–20:00
const STATUS_COLORS = {
  confirmed: 'var(--c-success)',
  pending:   'var(--c-warning)',
  cancelled: 'var(--c-error)',
};
const STATUS_LABELS = {
  confirmed: 'Bestätigt',
  pending:   'Ausstehend',
  cancelled: 'Abgesagt',
};

// ---------------------------------------------------------------------------
// Date helpers (return only safe, formatted strings — no raw DB values)
// ---------------------------------------------------------------------------

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function timeToMinutes(timeStr = '00:00') {
  const parts = String(timeStr).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function formatHour(h) {
  return String(h).padStart(2, '0') + ':00';
}

// ---------------------------------------------------------------------------
// DashboardCalendar
// ---------------------------------------------------------------------------

export class DashboardCalendar {
  #container;
  #storeId;
  #weekStart;
  #bookings = [];
  #realtimeSub = null;

  constructor(container, storeId) {
    this.#container = container;
    this.#storeId = String(storeId); // ensure string, never raw object
    this.#weekStart = getWeekStart();
  }

  async mount() {
    await this.#load();
    this.#render();
    this.#subscribeRealtime();
  }

  destroy() {
    this.#realtimeSub?.unsubscribe();
    this.#container.innerHTML = '';
  }

  // ── Data ────────────────────────────────────────────────────────────────

  async #load() {
    const weekEnd = new Date(this.#weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data } = await supabase
      .from('bookings')
      .select('id,booking_date,booking_time,service_name,customer_first,customer_last,guest_name,status,service_duration,staff_name')
      .eq('store_id', this.#storeId)
      .gte('booking_date', toDateStr(this.#weekStart))
      .lte('booking_date', toDateStr(weekEnd))
      .order('booking_time');

    this.#bookings = data || [];
  }

  #subscribeRealtime() {
    this.#realtimeSub = supabase
      .channel(`dash-cal-${this.#storeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `store_id=eq.${this.#storeId}`,
      }, async () => {
        await this.#load();
        this.#render();
      })
      .subscribe();
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  #render() {
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.#weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    const totalMinutes = (HOURS[HOURS.length - 1] - HOURS[0] + 1) * 60;
    const monthYear = this.#weekStart.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });

    // monthYear comes from the Intl formatter, not from user data — safe to use directly
    const html = `
      <div class="dash-cal">
        <div class="dash-cal-header">
          <h3 class="dash-cal-title">Wochenkalender \u2014 ${monthYear}</h3>
          <div class="dash-cal-day-labels">
            <div class="dash-cal-gutter-spacer"></div>
            ${weekDates.map((d) => {
              const isToday = toDateStr(d) === toDateStr(new Date());
              // Date values from JS Date — not user data, safe
              const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
              return `<div class="dash-cal-day-label${isToday ? ' dash-cal-today' : ''}">
                <span class="dash-cal-weekday">${DAYS[dayIdx]}</span>
                <span class="dash-cal-date">${d.getDate()}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="dash-cal-nav">
          <button class="dash-cal-nav-btn" data-dir="-1">\u2190 Letzte Woche</button>
          <button class="dash-cal-nav-btn" data-dir="0">Heute</button>
          <button class="dash-cal-nav-btn" data-dir="1">N\u00e4chste Woche \u2192</button>
        </div>
        <div class="dash-cal-grid" role="grid">
          <div class="dash-cal-gutter" aria-hidden="true">
            ${HOURS.map((h) => `<div class="dash-cal-hour-label">${formatHour(h)}</div>`).join('')}
          </div>
          ${weekDates.map((d) => this.#renderDayColumn(d, totalMinutes)).join('')}
        </div>
        <div class="dash-cal-legend">
          ${Object.entries(STATUS_COLORS).map(([status, color]) => `
            <span class="dash-cal-legend-item">
              <span class="dash-cal-dot" style="background:${color}"></span>
              ${STATUS_LABELS[status] || esc(status)}
            </span>`).join('')}
        </div>
      </div>`;

    this.#container.innerHTML = html;
    this.#bindNav();
  }

  #renderDayColumn(date, totalMinutes) {
    const dateStr = toDateStr(date);
    const dayBookings = this.#bookings.filter((b) => b.booking_date === dateStr);
    const isToday = dateStr === toDateStr(new Date());

    return `
      <div class="dash-cal-day${isToday ? ' dash-cal-today-col' : ''}" role="gridcell">
        ${HOURS.map((h) => `<div class="dash-cal-hour-slot" data-hour="${h}"></div>`).join('')}
        ${dayBookings.map((b) => this.#renderBookingBlock(b, totalMinutes)).join('')}
      </div>`;
  }

  #renderBookingBlock(booking, totalMinutes) {
    const startMins = timeToMinutes(booking.booking_time) - HOURS[0] * 60;
    const duration = Math.max(15, Number(booking.service_duration) || 60);
    const topPct = Math.max(0, (startMins / totalMinutes) * 100).toFixed(2);
    const heightPct = Math.max(2, (duration / totalMinutes) * 100).toFixed(2);
    // Status comes from a constrained DB enum — still escaped for safety
    const color = STATUS_COLORS[booking.status] || 'var(--c-accent)';

    // All user-provided string values are escaped
    const firstName = esc(booking.customer_first || '');
    const lastName  = esc(booking.customer_last || '');
    const guestName = esc(booking.guest_name || '');
    const displayName = firstName ? `${firstName} ${lastName}`.trim() : (guestName || 'Gast');
    const svcName   = esc(booking.service_name || '');
    const staffName = esc(booking.staff_name || '');
    // booking_time is a DB time string — formatted to HH:MM (safe numeric slice)
    const timeLabel = esc(String(booking.booking_time || '').slice(0, 5));

    return `
      <div class="dash-cal-booking" style="top:${topPct}%;height:${heightPct}%;border-left-color:${color}">
        <span class="dash-cal-booking-time">${timeLabel}</span>
        <span class="dash-cal-booking-name">${displayName}</span>
        ${svcName ? `<span class="dash-cal-booking-svc">${svcName}</span>` : ''}
        ${staffName ? `<span class="dash-cal-booking-staff">${staffName}</span>` : ''}
      </div>`;
  }

  #bindNav() {
    this.#container.querySelectorAll('.dash-cal-nav-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const dir = parseInt(btn.dataset.dir, 10);
        if (dir === 0) {
          this.#weekStart = getWeekStart();
        } else {
          this.#weekStart.setDate(this.#weekStart.getDate() + dir * 7);
        }
        await this.#load();
        this.#render();
      });
    });
  }
}
