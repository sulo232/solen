'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { modalVariants } from "@/lib/animations";
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { beautyIconMap } from '@/components/ui/beauty-icons';
import type { BeautyProfile } from '@/lib/types';

interface BeautyProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: BeautyProfile;
  onSave: (profile: BeautyProfile) => Promise<void>;
}

export const BeautyProfileEditModal: React.FC<BeautyProfileEditModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  onSave,
}) => {
  const t = useTranslations('account.beauty') as any;
  const [profile, setProfile] = useState<BeautyProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(profile);
      onClose();
    } catch (error) {
      console.error('Failed to save beauty profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle helpers
  const toggleHairTexture = (value: 'straight' | 'wavy' | 'curly') => {
    setProfile({
      ...profile,
      hair: { ...profile.hair, texture: profile.hair?.texture === value ? undefined : value },
    });
  };

  const toggleHairThickness = (value: 'fine' | 'thick') => {
    setProfile({
      ...profile,
      hair: { ...profile.hair, thickness: profile.hair?.thickness === value ? undefined : value },
    });
  };

  const toggleHairLength = (value: 'short' | 'long') => {
    setProfile({
      ...profile,
      hair: { ...profile.hair, length: profile.hair?.length === value ? undefined : value },
    });
  };

  const toggleHairCondition = (value: 'dry' | 'normal') => {
    setProfile({
      ...profile,
      hair: { ...profile.hair, condition: profile.hair?.condition === value ? undefined : value },
    });
  };

  const toggleNailShape = (value: 'almond' | 'square' | 'coffin' | 'stiletto' | 'round') => {
    setProfile({
      ...profile,
      nails: { ...profile.nails, shape: profile.nails?.shape === value ? undefined : value },
    });
  };

  const toggleNailType = (value: 'gel' | 'natural' | 'acrylic') => {
    setProfile({
      ...profile,
      nails: { ...profile.nails, type: profile.nails?.type === value ? undefined : value },
    });
  };

  const toggleSkinType = (value: 'normal' | 'dry' | 'oily' | 'sensitive' | 'mixed') => {
    setProfile({
      ...profile,
      skin: { type: profile.skin?.type === value ? undefined : value },
    });
  };

  const toggleStylistGender = (value: 'female' | 'male' | 'no-preference') => {
    setProfile({
      ...profile,
      stylist: { gender: profile.stylist?.gender === value ? undefined : value },
    });
  };

  const toggleStyleVibe = (value: 'minimal' | 'natural' | 'bold' | 'edgy') => {
    const vibes = profile.style?.vibes || [];
    const newVibes = vibes.includes(value)
      ? vibes.filter((v) => v !== value)
      : [...vibes, value];
    setProfile({
      ...profile,
      style: { vibes: newVibes },
    });
  };

  // Pill button component
  const PillButton: React.FC<{
    value: string;
    isActive: boolean;
    onClick: () => void;
    iconKey?: string;
    bgColor: string;
    textColor: string;
  }> = ({ value, isActive, onClick, iconKey, bgColor, textColor }) => {
    const Icon = iconKey ? beautyIconMap[iconKey as keyof typeof beautyIconMap] : null;

    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-1.5 px-[11px] py-[6px] rounded-pill text-[13px] font-body transition-[background-color,color,box-shadow,opacity] duration-150
          ${isActive ? 'ring-2 ring-s-coral' : 'hover:brightness-[1.06]'}
        `}
        style={{
          background: isActive ? bgColor : `${bgColor}80`,
          color: isActive ? textColor : `${textColor}80`,
        }}
        aria-label={t(value as any)}
      >
        {Icon && <Icon size={16} />}
        <span>{t(value as any)}</span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-s-ink/40 z-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-modal p-4">
          <motion.div role="dialog" aria-modal="true" variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-[--raised] rounded-[18px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-warm-lg">
          {/* Header */}
          <div className="sticky top-0 bg-[--raised] border-b border-s-ink/10 px-6 py-4 flex items-center justify-between rounded-t-[18px]">
            <h2 className="font-heading text-[18px] font-bold text-s-ink">
              {t('sectionTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-pill hover:bg-s-ink/5:bg-white/5 transition-colors duration-150"
              aria-label={t("close")}
            >
              <X size={20} strokeWidth={2} className="text-s-ink/60" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* HAAR */}
            <div>
              <h3 className="text-[10px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
                {t('hair')}
              </h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <PillButton value="straight" isActive={profile.hair?.texture === 'straight'} onClick={() => toggleHairTexture('straight')} iconKey="straight" bgColor="#F5E6E0" textColor="#8B4A35" />
                  <PillButton value="wavy" isActive={profile.hair?.texture === 'wavy'} onClick={() => toggleHairTexture('wavy')} iconKey="wavy" bgColor="#F5E6E0" textColor="#8B4A35" />
                  <PillButton value="curly" isActive={profile.hair?.texture === 'curly'} onClick={() => toggleHairTexture('curly')} iconKey="curly" bgColor="#F5E6E0" textColor="#8B4A35" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <PillButton value="fine" isActive={profile.hair?.thickness === 'fine'} onClick={() => toggleHairThickness('fine')} iconKey="fine" bgColor="#F5E6E0" textColor="#8B4A35" />
                  <PillButton value="thick" isActive={profile.hair?.thickness === 'thick'} onClick={() => toggleHairThickness('thick')} iconKey="thick" bgColor="#F5E6E0" textColor="#8B4A35" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <PillButton value="short" isActive={profile.hair?.length === 'short'} onClick={() => toggleHairLength('short')} iconKey="short" bgColor="#F5E6E0" textColor="#8B4A35" />
                  <PillButton value="long" isActive={profile.hair?.length === 'long'} onClick={() => toggleHairLength('long')} iconKey="long" bgColor="#F5E6E0" textColor="#8B4A35" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <PillButton value="dry" isActive={profile.hair?.condition === 'dry'} onClick={() => toggleHairCondition('dry')} iconKey="dry" bgColor="#F5E6E0" textColor="#8B4A35" />
                  <PillButton value="normal" isActive={profile.hair?.condition === 'normal'} onClick={() => toggleHairCondition('normal')} iconKey="normal" bgColor="#F5E6E0" textColor="#8B4A35" />
                </div>
              </div>
            </div>

            {/* NÄGEL */}
            <div>
              <h3 className="text-[10px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
                {t('nails')}
              </h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <PillButton value="almond" isActive={profile.nails?.shape === 'almond'} onClick={() => toggleNailShape('almond')} iconKey="almond" bgColor="#E4EBF7" textColor="#3A5280" />
                  <PillButton value="square" isActive={profile.nails?.shape === 'square'} onClick={() => toggleNailShape('square')} iconKey="square" bgColor="#E4EBF7" textColor="#3A5280" />
                  <PillButton value="coffin" isActive={profile.nails?.shape === 'coffin'} onClick={() => toggleNailShape('coffin')} iconKey="coffin" bgColor="#E4EBF7" textColor="#3A5280" />
                  <PillButton value="stiletto" isActive={profile.nails?.shape === 'stiletto'} onClick={() => toggleNailShape('stiletto')} iconKey="stiletto" bgColor="#E4EBF7" textColor="#3A5280" />
                  <PillButton value="round" isActive={profile.nails?.shape === 'round'} onClick={() => toggleNailShape('round')} iconKey="round" bgColor="#E4EBF7" textColor="#3A5280" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <PillButton value="gel" isActive={profile.nails?.type === 'gel'} onClick={() => toggleNailType('gel')} iconKey="gel" bgColor="#E4EBF7" textColor="#3A5280" />
                  <PillButton value="natural" isActive={profile.nails?.type === 'natural'} onClick={() => toggleNailType('natural')} bgColor="#E4EBF7" textColor="#3A5280" />
                  <PillButton value="acrylic" isActive={profile.nails?.type === 'acrylic'} onClick={() => toggleNailType('acrylic')} bgColor="#E4EBF7" textColor="#3A5280" />
                </div>
              </div>
            </div>

            {/* HAUT */}
            <div>
              <h3 className="text-[10px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
                {t('skin')}
              </h3>
              <div className="flex flex-wrap gap-2">
                <PillButton value="normal" isActive={profile.skin?.type === 'normal'} onClick={() => toggleSkinType('normal')} iconKey="normal" bgColor="#E8F3E8" textColor="#3A6040" />
                <PillButton value="dry" isActive={profile.skin?.type === 'dry'} onClick={() => toggleSkinType('dry')} iconKey="skinDry" bgColor="#E8F3E8" textColor="#3A6040" />
                <PillButton value="oily" isActive={profile.skin?.type === 'oily'} onClick={() => toggleSkinType('oily')} iconKey="oily" bgColor="#E8F3E8" textColor="#3A6040" />
                <PillButton value="sensitive" isActive={profile.skin?.type === 'sensitive'} onClick={() => toggleSkinType('sensitive')} iconKey="sensitive" bgColor="#E8F3E8" textColor="#3A6040" />
                <PillButton value="mixed" isActive={profile.skin?.type === 'mixed'} onClick={() => toggleSkinType('mixed')} iconKey="mixed" bgColor="#E8F3E8" textColor="#3A6040" />
              </div>
            </div>

            {/* STYLIST */}
            <div>
              <h3 className="text-[10px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
                {t('stylist')}
              </h3>
              <div className="flex flex-wrap gap-2">
                <PillButton value="female" isActive={profile.stylist?.gender === 'female'} onClick={() => toggleStylistGender('female')} iconKey="female" bgColor="#F5EEE0" textColor="#7A5A2A" />
                <PillButton value="male" isActive={profile.stylist?.gender === 'male'} onClick={() => toggleStylistGender('male')} iconKey="male" bgColor="#F5EEE0" textColor="#7A5A2A" />
                <PillButton value="neutral" isActive={profile.stylist?.gender === 'no-preference'} onClick={() => toggleStylistGender('no-preference')} iconKey="neutral" bgColor="#F5EEE0" textColor="#7A5A2A" />
              </div>
            </div>

            {/* STYLE */}
            <div>
              <h3 className="text-[10px] font-body font-semibold tracking-[.1em] text-s-ink/60 mb-2">
                {t('style')}
              </h3>
              <div className="flex flex-wrap gap-2">
                <PillButton value="minimal" isActive={profile.style?.vibes?.includes('minimal') || false} onClick={() => toggleStyleVibe('minimal')} iconKey="minimal" bgColor="#EEE8F5" textColor="#5A3A7A" />
                <PillButton value="natural" isActive={profile.style?.vibes?.includes('natural') || false} onClick={() => toggleStyleVibe('natural')} iconKey="natural" bgColor="#EEE8F5" textColor="#5A3A7A" />
                <PillButton value="bold" isActive={profile.style?.vibes?.includes('bold') || false} onClick={() => toggleStyleVibe('bold')} iconKey="bold" bgColor="#EEE8F5" textColor="#5A3A7A" />
                <PillButton value="edgy" isActive={profile.style?.vibes?.includes('edgy') || false} onClick={() => toggleStyleVibe('edgy')} iconKey="edgy" bgColor="#EEE8F5" textColor="#5A3A7A" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[--raised] border-t border-s-ink/10 px-6 py-4 flex gap-3 rounded-b-[18px]">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-pill border border-s-ink/10 text-s-ink/60 text-[14px] font-medium hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150"
              aria-label={t("cancel")}
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 rounded-pill bg-s-coral text-white text-[14px] font-medium hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 shadow-coral-glow"
              aria-label={t("save")}
            >
              {isSaving ? t("saving") : t("save")}
            </button>
          </div>
        </motion.div>
      </div>
      </>
      )}
    </AnimatePresence>
  );
}
