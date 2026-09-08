import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import itMessages from '@/messages/it.json';
import { formatReviewDate } from '@/app/[locale]/_components/salon/_shared';
import SalonReviews from '@/components-legacy/salon/SalonReviews';

const state = vi.hoisted(() => ({ locale: 'en' }));
const messages = { de, en, fr, it: itMessages };
vi.mock('next-intl', () => ({ useTranslations: (namespace: string) => (key: string, values: Record<string, unknown> = {}) => {
  const text = (messages[state.locale as keyof typeof messages] as any)[namespace][key];
  return String(text).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
} }));
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock('motion/react', () => ({ motion: { button: ({ whileHover, whileTap, ...props }: any) => <button {...props} /> }, AnimatePresence: ({ children }: any) => children }));
vi.mock('@/app/[locale]/_components/primitives/Sheet', () => ({ Sheet: ({ isOpen, children }: any) => isOpen ? <section>{children}</section> : null }));
vi.mock('@/app/[locale]/_components/primitives/TabPill', () => ({ TabPill: ({ active, size, children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('@/app/[locale]/_components/primitives/RatingStars', () => ({ RatingStars: ({ value }: any) => <span data-rating={value} /> }));
vi.mock('@/components-legacy/ReviewForm', () => ({ default: ({ onSuccess, onClose }: any) => <section data-review-form><button onClick={onSuccess}>Submit test review</button><button onClick={onClose}>Close test review</button></section> }));
vi.mock('@/components-legacy/discovery/ReportButton', () => ({ default: () => <button data-report>Report</button> }));
vi.mock('@/components-legacy/ui/EmptyState', () => ({ default: ({ title, message }: any) => <section>{title}{message}</section> }));

let renderer: ReactTestRenderer;
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); vi.unstubAllGlobals(); });
const body = () => JSON.stringify(renderer.toJSON());
const button = (text: string) => renderer.root.findAllByType('button').find(node => node.children.join('') === text)!;
const review = { id: '00000000-0000-4000-8000-000000000001', rating: 5, comment: 'A careful haircut.', created_at: '2026-08-10T10:00:00Z', profiles: { display_name: 'Test reviewer', avatar_url: null }, review_replies: { reply_text: 'Thank you for visiting.', is_public: true, created_at: '2026-08-11T10:00:00Z' }, review_photos: [{ id: 'photo', photo_url: '/test-review.jpg' }] };
async function mount(extra: Record<string, unknown> = {}) {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected request'); }));
  await act(async () => { renderer = create(<SalonReviews reviews={[review] as any} averageRating={5} reviewCount={1} salonId="00000000-0000-4000-8000-000000000002" salonSlug="test-store" salonName="Test Store" unreviewedBookingId={null} locale={state.locale} {...extra} />); });
}

describe('dedicated Store reviews preserves reviews without reporting', () => {
  for (const locale of ['de', 'en', 'fr', 'it'] as const) for (const isOwner of [false, true]) {
    it(`${locale}, owner=${isOwner}: no report trigger; review, public reply and date remain`, async () => {
      state.locale = locale;
      await mount({ isOwner });
      expect(renderer.root.findAll(node => node.props['data-report'] || node.props['aria-label'] === messages[locale].salonDetail.flagReview)).toHaveLength(0);
      expect(renderer.root.findAllByType('textarea')).toHaveLength(0);
      expect(body()).toContain(review.comment);
      expect(body()).toContain('Test reviewer');
      expect(body()).toContain(review.review_replies.reply_text);
      expect(body()).toContain(formatReviewDate(review.review_replies.created_at, locale));
      expect(fetch).not.toHaveBeenCalled();
    });
  }
  it('retains expansion, photo callback and authorized write-review form callbacks', async () => {
    state.locale = 'en';
    const onLightbox = vi.fn(), onReviewSubmitted = vi.fn();
    const comment = 'A long review. '.repeat(20);
    await mount({ reviews: [{ ...review, comment }], canWriteReview: true, onLightbox, onReviewSubmitted });
    expect(body()).not.toContain(comment);
    await act(async () => button(en.salonDetail.readMore).props.onClick());
    expect(body()).toContain(comment);
    await act(async () => renderer.root.findByProps({ 'aria-label': en.salonDetail.enlargePhoto }).props.onClick());
    expect(onLightbox).toHaveBeenCalledWith('/test-review.jpg');
    await act(async () => button(en.salonDetail.writeReview).props.onClick());
    expect(renderer.root.findAllByProps({ 'data-review-form': true })).toHaveLength(1);
    await act(async () => button('Submit test review').props.onClick());
    expect(onReviewSubmitted).toHaveBeenCalledOnce();
    expect(renderer.root.findAllByProps({ 'data-review-form': true })).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps private replies hidden and an actual empty-success state', async () => {
    state.locale = 'en';
    await mount({ reviews: [{ ...review, review_replies: { ...review.review_replies, is_public: false } }] });
    expect(body()).not.toContain(review.review_replies.reply_text);
    await act(async () => renderer.unmount());
    await mount({ reviews: [], reviewCount: 0 });
    expect(body()).toContain(en.salonDetail.noReviews);
    expect(fetch).not.toHaveBeenCalled();
  });
});
