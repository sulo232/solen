'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Share2, Heart, Settings } from 'lucide-react';
import type { Profile } from '@/lib/types';

interface ProfileHeroProps {
  profile: Profile;
  locale: string;
  onEditProfile?: () => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({ profile, locale, onEditProfile }) => {
  const t = useTranslations('account.beauty') as any;

  const getInitial = () => {
    if (profile.display_name) {
      return profile.display_name.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Avatar with gradient ring */}
      <div className="relative">
        <div
          className="w-16 h-16 sm:w-[90px] sm:h-[90px] rounded-full p-[2.5px]"
          style={{
            background: 'linear-gradient(145deg, #C8614A 0%, #E8C49A 55%, #E8927A 100%)'
          }}
        >
          <div className="w-full h-full rounded-full bg-[--raised] dark:bg-s-dm-surface flex items-center justify-center overflow-hidden relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="font-display text-[34px] text-s-ink dark:text-s-dm-text tracking-[.07em]">
                {getInitial()}
              </span>
            )}
          </div>
        </div>

        {/* Edit button - bottom right */}
        <button
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-s-coral text-white flex items-center justify-center shadow-warm-sm hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
          aria-label={t("editAvatar")}
        >
          <Settings size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Name */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-display text-[30px] tracking-[.07em] text-s-ink dark:text-s-dm-text leading-none">
          {profile.display_name || 'Guest'}
        </h1>

        {/* Badge */}
        <div className="px-3 py-1 rounded-pill text-[11px] font-body" style={{ background: '#F5EEE0', color: '#7A5A2A' }}>
          {t('exclusiveBadge')}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          className="px-4 py-2 rounded-pill bg-s-ink/[0.05] dark:bg-white/[0.08] text-s-ink dark:text-s-dm-text text-[13px] font-body font-medium hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.12] active:scale-[0.98] transition-[background-color,transform] duration-150"
          aria-label={t("editProfile")}
          onClick={onEditProfile}
        >
          {t("editProfile")}
        </button>

        <button
          className="w-9 h-9 rounded-full bg-s-ink/[0.05] dark:bg-white/[0.08] text-s-ink dark:text-s-dm-text flex items-center justify-center hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.12] active:scale-[0.98] transition-[background-color,transform] duration-150"
          aria-label={t("editProfile")}
        >
          <Share2 size={16} strokeWidth={2} />
        </button>

        <button
          className="w-9 h-9 rounded-full bg-s-ink/[0.05] dark:bg-white/[0.08] text-s-coral flex items-center justify-center hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.12] active:scale-[0.98] transition-[background-color,transform] duration-150"
          aria-label={t("addMore")}
        >
          <Heart size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};
