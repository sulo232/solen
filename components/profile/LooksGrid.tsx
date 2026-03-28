'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Scissors, Sparkles, Palette } from 'lucide-react';

interface Look {
  id: string;
  category: string;
  icon: string;
  imageUrl?: string;
}

interface LooksGridProps {
  looks?: Look[];
  onAddLook?: () => void;
}

// Category color mapping
const CATEGORY_STYLES: Record<string, { bg: string; icon: string }> = {
  hair: { bg: '#F5E6E0', icon: '#C8614A' },
  nails: { bg: '#E4EBF7', icon: '#6B8CC8' },
  makeup: { bg: '#FFF0E5', icon: '#E8A030' },
};

export const LooksGrid: React.FC<LooksGridProps> = ({ looks = [], onAddLook }) => {
  const t = useTranslations('account.beauty') as any;

  return (
    <div className="grid grid-cols-3 gap-2.5 pb-6">
      {looks.map((look) => {
        const styles = CATEGORY_STYLES[look.category] || CATEGORY_STYLES.hair;

        return (
          <div
            key={look.id}
            className="aspect-square rounded-[10px] flex items-center justify-center shadow-warm-md hover:-translate-y-1 hover:shadow-v5-card-hover transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer"
            style={{ background: styles.bg }}
          >
            {look.imageUrl ? (
              <img
                src={look.imageUrl}
                alt="Look"
                className="w-full h-full object-cover rounded-[10px]"
              />
            ) : (
              <Scissors size={32} strokeWidth={1.8} style={{ color: styles.icon }} />
            )}
          </div>
        );
      })}

      {/* Add new look cell */}
      <button
        onClick={onAddLook}
        className="aspect-square rounded-[10px] flex flex-col items-center justify-center border-2 border-dashed border-s-ink/20 dark:border-white/20 hover:border-s-coral dark:hover:border-s-coral transition-[border-color] duration-150"
        aria-label={t('addMore')}
      >
        <Plus size={28} strokeWidth={2} className="text-s-ink/40 dark:text-s-dm-text/40 mb-1" />
        <span className="text-[11px] font-body text-s-ink/50 dark:text-s-dm-text/50">
          {t("addLook")}
        </span>
      </button>
    </div>
  );
};
