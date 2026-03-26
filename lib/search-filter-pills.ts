import type { FilterPill } from '@/lib/types';

/**
 * getSearchFilterPills — Grouped filter configuration for search/category pages
 *
 * Used by: /last-minute, /behandlungen/[...slug]
 * Zone: 3 (functional, no glassmorphism)
 *
 * Groups related filters to prevent infinite horizontal scroll.
 * MAX_VISIBLE=5 on desktop, overflow → drawer. Mobile → bottom sheet.
 */
export function getSearchFilterPills(t: (key: string) => string): FilterPill[] {
  return [

    {
      id: 'availability',
      label: t('availability'),
      subFilters: [
        { id: 'today', label: t('today') },
        { id: 'tomorrow', label: t('tomorrow') },
        { id: 'custom_date', label: t('pickDate') },
      ],
    },
    {
      id: 'rating',
      label: t('rating'),
      subFilters: [
        { id: '4', label: '4+ ★' },
        { id: '4.5', label: '4.5+ ★' },
      ],
    },
    { id: 'online_payment', label: t('onlinePayment') },
    { id: 'off_peak', label: t('offPeak') },
    {
      id: 'sort',
      label: t('sortBy'),
      subFilters: [
        { id: 'rating', label: t('sortByRating') },
        { id: 'price', label: t('sortByPrice') },
        { id: 'nearest', label: t('sortByNearest') },
        { id: 'newest', label: t('sortByNewest') },
        { id: 'next_slot', label: t('sortByNextSlot') },
      ],
    },
  ];
}
