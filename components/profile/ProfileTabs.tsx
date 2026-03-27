'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Grid3x3, Calendar, Heart, Star, Settings } from 'lucide-react';

type TabKey = 'looks' | 'termine' | 'favoriten' | 'stempel' | 'einstellungen';

interface ProfileTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children?: React.ReactNode;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange, children }) => {
  const t = useTranslations('account.beauty.tabs');

  const tabs: { key: TabKey; label: string; icon: React.FC<any> }[] = [
    { key: 'looks', label: t('looks'), icon: Grid3x3 },
    { key: 'termine', label: t('termine'), icon: Calendar },
    { key: 'favoriten', label: t('favoriten'), icon: Heart },
    { key: 'stempel', label: t('stempel'), icon: Star },
    { key: 'einstellungen', label: t('einstellungen'), icon: Settings },
  ];

  return (
    <div className="pt-2">
      {/* Tab bar */}
      <div className="flex items-center border-b border-s-ink/10 dark:border-white/10 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-body font-medium transition-all relative
                ${isActive ? 'text-s-coral' : 'text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text'}
              `}
              aria-label={tab.label}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{tab.label}</span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-s-coral" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {children}
      </div>
    </div>
  );
};
