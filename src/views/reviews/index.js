/**
 * src/views/reviews/index.js — Enhanced user reviews system.
 *
 * Phase 3 features:
 *  - Photo upload on reviews (via Supabase Storage)
 *  - Review editing within 24 hours of posting
 *  - Verified-visit badge (confirmed booking for this salon)
 *  - Owner reply thread UI
 *  - Google review source badge display
 *
 * XSS safety: ALL user-supplied content is set via .textContent or
 * .setAttribute(). No innerHTML is used anywhere in this file.
 * SVG elements are created with createElementNS.
 */

import { supabase } from '@/services/supabase.js';
import { store } from '@/store/index.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function el(tag, ...classes) {
  const e = document.createElement(tag);
  if (classes.length) e.className = classes.join(' ');
  return e;
}

function svgEl(tag) {
  return document.createElementNS(SVG_NS, tag);
}

/** Create an SVG camera icon using DOM methods — no innerHTML. */
function createCameraIcon() {
  const svg = svgEl('svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');

  const path = svgEl('path');
  path.setAttribute('d', 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z');
  svg.appendChild(path);

  const circle = svgEl('circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '13');
  circle.setAttribute('r', '4');
  svg.appendChild(circle);

  return svg;
}

// ---------------------------------------------------------------------------
// Photo upload
// ---------------------------------------------------------------------------

/**
 * Upload a review photo to Supabase Storage.
 * @param {File} file
 * @returns {string|null} public URL or null on error
 */
export async function uploadReviewPhoto(file) {
  const ext = String(file.name).split('.').pop().toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return null;
  if (file.size > 5 * 1024 * 1024) return null;

  const path = `reviews/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('review-photos').upload(path, file, { upsert: false });
  if (error) return null;

  const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(path);
  return publicUrl;
}

// ---------------------------------------------------------------------------
// Verified-visit check
// ---------------------------------------------------------------------------

/**
 * Returns true if the current user has a confirmed booking for this salon.
 */
export async function hasVerifiedVisit(salonId) {
  const user = store.get('currentUser');
  if (!user) return false;
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('salon_id', salonId)
    .eq('user_id', user.id)
    .eq('status', 'confirmed');
  return (count || 0) > 0;
}

// ---------------------------------------------------------------------------
// ReviewForm
// ---------------------------------------------------------------------------

/**
 * Renders a star-rating form with optional photo upload.
 */
export class ReviewForm {
  #container;
  #salonId;
  #bookingId;
  #rating = 0;

  /** @param {(data: object) => Promise<void>} fn */
  onSubmit = null;

  constructor(container, { salonId, bookingId = null } = {}) {
    this.#container = container;
    this.#salonId   = salonId;
    this.#bookingId = bookingId;
  }

  render() {
    while (this.#container.firstChild) this.#container.removeChild(this.#container.firstChild);

    const form = el('div', 'review-form');

    // Star rating
    const starsRow = el('div', 'review-stars-row');
    starsRow.setAttribute('role', 'group');
    starsRow.setAttribute('aria-label', 'Sternebewertung');

    for (let i = 1; i <= 5; i++) {
      const star = el('button', 'review-star');
      star.type = 'button';
      star.dataset.val = String(i);
      star.setAttribute('aria-label', `${i} Stern${i > 1 ? 'e' : ''}`);
      star.textContent = '\u2605';
      star.addEventListener('click', () => {
        this.#rating = i;
        starsRow.querySelectorAll('.review-star').forEach((s) => {
          s.classList.toggle('active', Number(s.dataset.val) <= i);
        });
      });
      starsRow.appendChild(star);
    }
    form.appendChild(starsRow);

    // Comment
    const textarea = document.createElement('textarea');
    textarea.className = 'form-input review-comment-input';
    textarea.rows = 3;
    textarea.placeholder = 'Wie war dein Besuch? (optional)';
    textarea.setAttribute('aria-label', 'Kommentar');
    form.appendChild(textarea);

    // Photo upload
    const photoInputId = `review-photo-${Date.now()}`;
    const photoLabel = el('label', 'review-photo-label');
    photoLabel.setAttribute('for', photoInputId);
    photoLabel.appendChild(createCameraIcon());
    photoLabel.appendChild(document.createTextNode(' Foto hinzuf\u00fcgen'));

    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.id = photoInputId;
    photoInput.accept = 'image/*';
    photoInput.style.display = 'none';
    form.appendChild(photoLabel);
    form.appendChild(photoInput);

    // Preview
    const preview = el('div', 'review-photo-preview');
    form.appendChild(preview);

    photoInput.addEventListener('change', () => {
      while (preview.firstChild) preview.removeChild(preview.firstChild);
      const file = photoInput.files?.[0];
      if (file) {
        const img = document.createElement('img');
        img.className = 'review-photo-preview-img';
        img.alt = 'Vorschau';
        const url = URL.createObjectURL(file);
        img.setAttribute('src', url);
        img.addEventListener('load', () => URL.revokeObjectURL(url));
        preview.appendChild(img);
      }
    });

    // Submit
    const submitBtn = el('button', 'btn-primary', 'review-submit-btn');
    submitBtn.type = 'button';
    submitBtn.textContent = 'Bewertung abgeben';
    submitBtn.addEventListener('click', async () => {
      if (!this.#rating) {
        submitBtn.textContent = 'Bitte Sterne w\u00e4hlen!';
        setTimeout(() => { submitBtn.textContent = 'Bewertung abgeben'; }, 2000);
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gespeichert\u2026';
      try {
        await this.onSubmit?.({
          salonId:   this.#salonId,
          bookingId: this.#bookingId,
          rating:    this.#rating,
          comment:   textarea.value.trim(),
          photoFile: photoInput.files?.[0] || null,
        });
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bewertung abgeben';
      }
    });
    form.appendChild(submitBtn);

    this.#container.appendChild(form);
  }
}

// ---------------------------------------------------------------------------
// ReviewList
// ---------------------------------------------------------------------------

export class ReviewList {
  #container;
  #salonId;
  #reviews = [];
  #isOwner = false;
  #currentUserId = null;

  constructor(container, { salonId, isOwner = false } = {}) {
    this.#container     = container;
    this.#salonId       = salonId;
    this.#isOwner       = isOwner;
    this.#currentUserId = store.get('currentUser')?.id || null;
  }

  async load() {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('salon_id', this.#salonId)
      .order('created_at', { ascending: false });
    this.#reviews = data || [];
    this.#render();
  }

  #render() {
    while (this.#container.firstChild) this.#container.removeChild(this.#container.firstChild);

    if (!this.#reviews.length) {
      const empty = el('p', 'review-empty');
      empty.textContent = 'Noch keine Bewertungen \u2013 sei der/die Erste!';
      this.#container.appendChild(empty);
      return;
    }

    this.#reviews.forEach((r) => this.#container.appendChild(this.#buildCard(r)));
  }

  #buildCard(review) {
    const card = el('div', 'review-card');

    // Header
    const header = el('div', 'review-header');
    const metaRow = el('div', 'review-meta-row');

    const nameEl = el('span', 'review-author');
    nameEl.textContent = review.reviewer_name || 'Anonym';
    metaRow.appendChild(nameEl);

    if (review.source === 'google') {
      const badge = el('span', 'review-google-badge');
      badge.textContent = 'Google';
      badge.setAttribute('title', 'Google Bewertung');
      metaRow.appendChild(badge);
    }

    if (review.booking_id) {
      const verified = el('span', 'review-verified-badge');
      verified.textContent = '\u2713 Verifizierter Besuch';
      metaRow.appendChild(verified);
    }

    header.appendChild(metaRow);

    const stars = el('div', 'review-stars');
    const ratingNum = Math.min(5, Math.max(0, Number(review.rating) || 0));
    stars.textContent = '\u2605'.repeat(ratingNum) + '\u2606'.repeat(5 - ratingNum);
    stars.setAttribute('aria-label', `${ratingNum} von 5 Sternen`);
    header.appendChild(stars);

    const dateEl = el('span', 'review-date');
    try { dateEl.textContent = new Date(review.created_at).toLocaleDateString('de-CH'); }
    catch { dateEl.textContent = ''; }
    header.appendChild(dateEl);

    card.appendChild(header);

    // Comment
    if (review.comment) {
      const comment = el('p', 'review-comment');
      comment.textContent = review.comment;
      card.appendChild(comment);
    }

    // Photo — src set via setAttribute, never innerHTML
    if (review.photo_url) {
      const photoWrap = el('div', 'review-photo-wrap');
      const img = document.createElement('img');
      img.className = 'review-photo';
      img.alt = 'Bewertungsfoto';
      img.loading = 'lazy';
      img.setAttribute('src', review.photo_url);
      img.addEventListener('click', () => window.open(review.photo_url, '_blank', 'noopener,noreferrer'));
      photoWrap.appendChild(img);
      card.appendChild(photoWrap);
    }

    // Edit form (own review within 24h)
    const isOwnReview = this.#currentUserId && review.user_id === this.#currentUserId;
    const isEditable  = isOwnReview && review.source !== 'google' &&
      (Date.now() - new Date(review.created_at).getTime() < 24 * 60 * 60 * 1000);
    if (isEditable) card.appendChild(this.#buildEditForm(review));

    // Owner reply
    if (review.owner_reply) {
      card.appendChild(this.#buildReplyDisplay(review.owner_reply));
    } else if (this.#isOwner && review.source !== 'google') {
      card.appendChild(this.#buildOwnerReplyForm(review, card));
    }

    return card;
  }

  #buildReplyDisplay(replyText) {
    const replyEl = el('div', 'review-reply');
    const label = el('span', 'reply-label');
    label.textContent = 'Salon-Antwort';
    const text = el('p', 'reply-text');
    text.textContent = replyText;
    replyEl.appendChild(label);
    replyEl.appendChild(text);
    return replyEl;
  }

  #buildEditForm(review) {
    const wrap = el('div', 'review-edit-wrap');

    const toggle = el('button', 'review-edit-toggle');
    toggle.type = 'button';
    toggle.textContent = 'Bearbeiten';

    const formEl = el('div', 'review-edit-form', 'hidden');

    const textarea = document.createElement('textarea');
    textarea.className = 'form-input';
    textarea.rows = 2;
    textarea.value = review.comment || '';

    const saveBtn = el('button', 'btn-sm', 'btn-primary');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Speichern';

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      const newComment = textarea.value.trim();
      const { error } = await supabase
        .from('reviews')
        .update({ comment: newComment, edited_at: new Date().toISOString() })
        .eq('id', review.id)
        .eq('user_id', this.#currentUserId);
      if (!error) {
        formEl.classList.add('hidden');
        const commentEl = wrap.closest('.review-card')?.querySelector('.review-comment');
        if (commentEl) commentEl.textContent = newComment;
        review.comment = newComment;
      }
      saveBtn.disabled = false;
    });

    toggle.addEventListener('click', () => formEl.classList.toggle('hidden'));
    formEl.appendChild(textarea);
    formEl.appendChild(saveBtn);
    wrap.appendChild(toggle);
    wrap.appendChild(formEl);
    return wrap;
  }

  #buildOwnerReplyForm(review, card) {
    const wrap = el('div', 'reply-area');

    const textarea = document.createElement('textarea');
    textarea.className = 'form-input reply-input';
    textarea.placeholder = 'Antworten\u2026';
    textarea.rows = 2;

    const btn = el('button', 'btn-sm', 'btn-teal');
    btn.type = 'button';
    btn.textContent = 'Senden';

    btn.addEventListener('click', async () => {
      const reply = textarea.value.trim();
      if (!reply) return;
      btn.disabled = true;
      const { error } = await supabase
        .from('reviews')
        .update({ owner_reply: reply, reply_at: new Date().toISOString() })
        .eq('id', review.id);
      if (!error) {
        review.owner_reply = reply;
        wrap.replaceWith(this.#buildReplyDisplay(reply));
      }
      btn.disabled = false;
    });

    wrap.appendChild(textarea);
    wrap.appendChild(btn);
    return wrap;
  }
}

// ---------------------------------------------------------------------------
// Submit helper
// ---------------------------------------------------------------------------

/**
 * Submit a review with optional photo upload.
 * @param {{ salonId, rating, comment, photoFile?, bookingId? }} params
 * @returns {{ error }}
 */
export async function submitReviewWithPhoto({ salonId, rating, comment, photoFile, bookingId }) {
  const user    = store.get('currentUser');
  const profile = store.get('currentProfile');

  let photo_url = null;
  if (photoFile) photo_url = await uploadReviewPhoto(photoFile);

  const row = {
    salon_id:      salonId,
    user_id:       user?.id || null,
    reviewer_name: profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'Gast',
    rating,
    comment:       comment || null,
    source:        'manual',
    created_at:    new Date().toISOString(),
  };
  if (photo_url) row.photo_url = photo_url;
  if (bookingId) row.booking_id = bookingId;

  const { error } = await supabase.from('reviews').insert(row);
  if (!error && bookingId) {
    await supabase.from('bookings').update({ reviewed: true }).eq('id', bookingId);
  }
  return { error };
}
