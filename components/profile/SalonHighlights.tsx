'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Scissors, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SalonHighlight {
  id: string;
  name: string;
  category: string;
  slug: string;
}

interface SalonHighlightsProps {
  favorites: SalonHighlight[];
  locale: string;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  coiffeur: { bg: '#F5E6E0', icon: '#C8614A' },
  barbershop: { bg: '#E4EBF7', icon: '#6B8CC8' },
  nails: { bg: '#E8F3E8', icon: '#6BAF78' },
  spa: { bg: '#EEE8F5', icon: '#9B7EC8' },
  makeup: { bg: '#FFF0E5', icon: '#E8A030' },
  waxing: { bg: '#F5EEE0', icon: '#C8A45A' },
};

export const SalonHighlights: React.FC<SalonHighlightsProps> = ({ favorites, locale }) => {
  const t = useTranslations('account.beauty') as any;

  if (!favorites || favorites.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {favorites.slice(0, 6).map((salon) => {
          const colors = CATEGORY_COLORS[salon.category] || CATEGORY_COLORS.coiffeur;

          return (
            <Link
              key={salon.id}
              href={`/${locale}/salon/${salon.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            >
              {/* Circle */}
              <div
                className="w-[58px] h-[58px] rounded-full flex items-center justify-center shadow-warm-md transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1"
                style={{ background: colors.bg }}
              >
                <Scissors size={24} strokeWidth={1.8} style={{ color: colors.icon }} />
              </div>

              {/* Label */}
              <span className="text-[10px] font-body text-s-ink/60 dark:text-s-dm-text/60 max-w-[58px] text-center truncate">
                {salon.name}
              </span>
            </Link>
          );
        })}

        {/* Add more button */}
        <Link
          href={`/${locale}/coiffeur`}
          className="flex-shrink-0 flex flex-col items-center gap-1.5"
        >
          <div
            className="w-[58px] h-[58px] rounded-full flex items-center justify-center border-2 border-dashed border-s-ink/20 dark:border-white/20 hover:border-s-coral dark:hover:border-s-coral transition-[border-color] duration-150"
          >
            <Plus size={24} strokeWidth={2} className="text-s-ink/40 dark:text-s-dm-text/40" />
          </div>
          <span className="text-[10px] font-body text-s-ink/60 dark:text-s-dm-text/60">
            {t("more")}
          </span>
        </Link>
      </div>
    </div>
  );
};
