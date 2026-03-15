'use client';

import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Spinner } from '@/src/components/ui/Spinner';

interface Props {
  params: Promise<{ locale: string }>;
}

const HAIR_TYPES = ['Glatt', 'Wellig', 'Lockig', 'Kraus', 'Weiß nicht'];
const AGE_GROUPS = ['Kind', 'Teenager', 'Erwachsene', 'Senior'];
const GENDERS = ['Männlich', 'Weiblich', 'Divers', 'Keine Angabe'];
const CATEGORIES = ['coiffeur', 'barbershop', 'nails', 'spa', 'makeup', 'waxing'];
const CATEGORY_LABELS: Record<string, string> = {
  coiffeur: 'Coiffeur',
  barbershop: 'Barbershop',
  nails: 'Nails',
  spa: 'Spa',
  makeup: 'Make-up',
  waxing: 'Waxing',
};

function OnboardingWizard({ locale }: { locale: string }) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [step1, setStep1] = useState({ display_name: '', bio: '' });
  const [step2, setStep2] = useState({ hair_type: '', age_group: '', gender: '' });
  const [step3, setStep3] = useState({ categories: [] as string[] });

  const saveStep = async (stepData: Record<string, unknown>) => {
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stepData),
    });
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      if (step === 1) await saveStep(step1);
      else if (step === 2) await saveStep({ hair_type: step2.hair_type, age_group: step2.age_group });
      else if (step === 3) {
        await saveStep({ preferred_categories: step3.categories, onboarding_completed: true });
        setShowConfetti(true);
        setTimeout(() => { window.location.href = `/${locale}`; }, 2000);
        return;
      }
      setStep((s) => s + 1);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (step === 3) { window.location.href = `/${locale}`; return; }
    setStep((s) => s + 1);
  };

  const STEP_TITLES = ['Erzähl uns von dir', 'Was passt zu dir?', 'Was suchst du?'];

  if (showConfetti) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="text-5xl">🎉</div>
        <h2 className="font-heading font-bold text-2xl text-dark">Willkommen bei solen!</h2>
        <p className="text-gray-500 text-sm">Dein Profil wurde gespeichert.</p>
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-teal' : 'bg-gray-200'
              } ${s === step ? 'w-8' : 'w-4'}`}
            />
          ))}
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="font-heading font-bold text-xl text-dark mb-4">
            {STEP_TITLES[step - 1]}
          </h2>

          {/* Step 1: Name + bio */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Anzeigename</label>
                <input
                  type="text"
                  value={step1.display_name}
                  onChange={(e) => setStep1((s) => ({ ...s, display_name: e.target.value }))}
                  placeholder="Dein Name"
                  className="w-full border border-gray-200 rounded-button px-3 py-2.5 text-sm focus:outline-none focus:border-teal"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Kurze Bio (optional)</label>
                <textarea
                  value={step1.bio}
                  onChange={(e) => setStep1((s) => ({ ...s, bio: e.target.value }))}
                  placeholder="Erzähl uns etwas über dich..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-button px-3 py-2 text-sm resize-none focus:outline-none focus:border-teal"
                />
              </div>
            </div>
          )}

          {/* Step 2: Hair type + age + gender */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Altersgruppe</p>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setStep2((s) => ({ ...s, age_group: a }))}
                      className={`px-3 py-1.5 rounded-pill text-xs border transition-colors ${step2.age_group === a ? 'bg-teal text-white border-teal' : 'border-gray-200 text-dark'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Geschlecht</p>
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setStep2((s) => ({ ...s, gender: g }))}
                      className={`px-3 py-1.5 rounded-pill text-xs border transition-colors ${step2.gender === g ? 'bg-teal text-white border-teal' : 'border-gray-200 text-dark'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Haartyp</p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_TYPES.map((h) => (
                    <button
                      key={h}
                      onClick={() => setStep2((s) => ({ ...s, hair_type: h }))}
                      className={`px-3 py-1.5 rounded-pill text-xs border transition-colors ${step2.hair_type === h ? 'bg-teal text-white border-teal' : 'border-gray-200 text-dark'}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Categories */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Wähle alle Kategorien, die dich interessieren.</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const selected = step3.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setStep3((s) => ({
                          categories: selected
                            ? s.categories.filter((c) => c !== cat)
                            : [...s.categories, cat],
                        }))
                      }
                      className={`flex items-center justify-between px-3 py-2.5 rounded-card border text-sm font-medium transition-colors ${
                        selected ? 'bg-teal/10 border-teal text-teal' : 'border-gray-200 text-dark hover:border-teal/50'
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                      {selected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Überspringen
            </button>
            <button
              onClick={handleNext}
              disabled={isSaving}
              className="flex items-center gap-2 bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded-button hover:bg-teal/90 transition-colors disabled:opacity-60"
            >
              {isSaving ? <Spinner size={14} invert /> : null}
              {step === 3 ? (
                <>Fertig <Sparkles size={14} /></>
              ) : (
                <>Weiter <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <OnboardingWizard locale={locale} />;
}
