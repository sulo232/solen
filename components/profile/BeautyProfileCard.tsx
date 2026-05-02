'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { beautyIconMap } from '@/components/ui/beauty-icons';
import type { Profile, BeautyProfile } from '@/lib/types';

interface BeautyProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
}

// Row-specific colors (custom semantic data colors from concept)
const ROW_STYLES = {
  hair: { bg: '#F5E6E0', text: '#8B4A35', dot: '#C8614A' },
  nails: { bg: '#E4EBF7', text: '#3A5280', dot: '#6B8CC8' },
  skin: { bg: '#E8F3E8', text: '#3A6040', dot: '#6BAF78' },
  stylist: { bg: '#F5EEE0', text: '#7A5A2A', dot: '#C8A45A' },
  style: { bg: '#EEE8F5', text: '#5A3A7A', dot: '#9B7EC8' },
} as const;

export const BeautyProfileCard: React.FC<BeautyProfileCardProps> = ({ profile, onEdit }) => {
  const t = useTranslations('account.beauty') as any;

  // Extract beauty profile from customer_preferences
  const beautyProfile: BeautyProfile = (profile.customer_preferences as any)?.beauty || {};

  // Helper to render a pill with icon
  const renderPill = (
    value: string,
    categoryKey: keyof typeof ROW_STYLES,
    iconKey?: string
  ) => {
    const styles = ROW_STYLES[categoryKey];
    const Icon = iconKey ? beautyIconMap[iconKey as keyof typeof beautyIconMap] : null;

    return (
      <div
        key={value}
        className="inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-pill text-[12px] font-body"
        style={{ background: styles.bg, color: styles.text }}
      >
        {Icon && <Icon size={14} className="flex-shrink-0" />}
        <span>{t(value as any) || value}</span>
      </div>
    );
  };

  // Render add-more pill
  const renderAddPill = (categoryKey: keyof typeof ROW_STYLES) => {
    const styles = ROW_STYLES[categoryKey];
    return (
      <button
        className="inline-flex items-center gap-1 px-[11px] py-[5px] rounded-pill text-[12px] font-body border-2 border-dashed transition-colors duration-150 hover:bg-s-ink/[0.03]:bg-white/[0.05]"
        style={{ borderColor: styles.dot, color: styles.dot }}
        onClick={onEdit}
        aria-label={t('addMore')}
      >
        <Plus size={14} strokeWidth={2.5} />
        <span>+</span>
      </button>
    );
  };

  // Build pill arrays for each row
  const hairPills: React.ReactNode[] = [];
  if (beautyProfile.hair?.texture) hairPills.push(renderPill(beautyProfile.hair.texture, 'hair', beautyProfile.hair.texture));
  if (beautyProfile.hair?.thickness) hairPills.push(renderPill(beautyProfile.hair.thickness, 'hair', beautyProfile.hair.thickness));
  if (beautyProfile.hair?.length) hairPills.push(renderPill(beautyProfile.hair.length, 'hair', beautyProfile.hair.length));
  if (beautyProfile.hair?.condition) hairPills.push(renderPill(beautyProfile.hair.condition, 'hair', beautyProfile.hair.condition));

  const nailPills: React.ReactNode[] = [];
  if (beautyProfile.nails?.shape) nailPills.push(renderPill(beautyProfile.nails.shape, 'nails', beautyProfile.nails.shape));
  if (beautyProfile.nails?.type) nailPills.push(renderPill(beautyProfile.nails.type, 'nails', beautyProfile.nails.type));
  if (beautyProfile.nails?.length) nailPills.push(renderPill(beautyProfile.nails.length, 'nails'));

  const skinPills: React.ReactNode[] = [];
  if (beautyProfile.skin?.type) skinPills.push(renderPill(beautyProfile.skin.type, 'skin', beautyProfile.skin.type === 'dry' ? 'skinDry' : beautyProfile.skin.type));

  const stylistPills: React.ReactNode[] = [];
  if (beautyProfile.stylist?.gender) stylistPills.push(renderPill(beautyProfile.stylist.gender, 'stylist', beautyProfile.stylist.gender));

  const stylePills: React.ReactNode[] = [];
  if (beautyProfile.style?.vibes) {
    beautyProfile.style.vibes.forEach(vibe => {
      stylePills.push(renderPill(vibe, 'style', vibe));
    });
  }

  return (
    <div className="bg-[--raised] rounded-[18px] p-4 shadow-warm-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-[16px] font-bold text-s-ink">
          {t('sectionTitle')}
        </h2>
        <button
          onClick={onEdit}
          className="text-[13px] font-body text-s-coral hover:brightness-[1.1] transition-[filter] duration-150"
          aria-label={t('edit')}
        >
          {t('edit')}
        </button>
      </div>

      {/* 5 rows */}
      <div className="flex flex-col">
        {/* HAAR */}
        <div className="py-3 border-b border-s-sand">
          <div className="text-[9px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
            {t('hair')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hairPills}
            {renderAddPill('hair')}
          </div>
        </div>

        {/* NÄGEL */}
        <div className="py-3 border-b border-s-sand">
          <div className="text-[9px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
            {t('nails')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nailPills}
            {renderAddPill('nails')}
          </div>
        </div>

        {/* HAUT */}
        <div className="py-3 border-b border-s-sand">
          <div className="text-[9px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
            {t('skin')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skinPills}
            {renderAddPill('skin')}
          </div>
        </div>

        {/* STYLIST */}
        <div className="py-3 border-b border-s-sand">
          <div className="text-[9px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
            {t('stylist')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stylistPills}
            {renderAddPill('stylist')}
          </div>
        </div>

        {/* STYLE */}
        <div className="py-3">
          <div className="text-[9px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
            {t('style')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stylePills}
            {renderAddPill('style')}
          </div>
        </div>
      </div>
    </div>
  );
};
