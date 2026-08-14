"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardList, Clock, Bot } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components-legacy/ui/Spinner";
import type { IntakeFormResponse } from "@/lib/types";

type FormWithSalon = IntakeFormResponse & { salons: { name: string, slug: string } };

// Fixed system set (lib/intake-templates.ts INTAKE_TEMPLATES): humanize is only a
// defensive fallback for a key outside that known set, never the primary label source.
function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MyIntakeFormsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Profile") as any;
  // Reuses the template-name translations already shipped for the salon-owner
  // dashboard (components-legacy/dashboard/IntakeFormTab.tsx), all 4 locales.
  const tTemplate = useTranslations("dashboard.intakeFormTab") as any;
  const TEMPLATE_NAMES: Record<string, string> = {
    hair_consultation: tTemplate("templateHairConsultation"),
    nail_consultation: tTemplate("templateNailConsultation"),
    waxing_consultation: tTemplate("templateWaxingConsultation"),
    makeup_consultation: tTemplate("templateMakeupConsultation"),
    spa_consultation: tTemplate("templateSpaConsultation"),
    barber_consultation: tTemplate("templateBarberConsultation"),
  };
  const [forms, setForms] = useState<FormWithSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadForms = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session?.user) {
          // ia-navigation-03: return here after login instead of dropping the
          // user on the homepage, matching the redirect= convention every
          // other /profile/* page already uses.
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/intake-forms`)}`);
          return;
        }

        const { data } = await supabase
          .from("intake_form_responses")
          .select("*, salons(name, slug)")
          .eq("customer_id", session.user.id)
          .order("filled_at", { ascending: false });

        if (!cancelled && data) setForms(data as any);
      } catch (err) {
        console.error("Error loading forms:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadForms();
    return () => { cancelled = true; };
  }, [locale, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  // Object.entries grouped by template_key
  const grouped = forms.reduce<Record<string, FormWithSalon[]>>((acc, form) => {
    (acc[form.template_key] = acc[form.template_key] || []).push(form);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-s-bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Title now sits beside the global back tile (Header deepPageTitle). */}
        {/* List */}
        {forms.length === 0 ? (
          <div className="bg-white rounded-[12px] border border-s-border p-8 text-center text-s-ink/40">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">{t("intakeFormsEmpty")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([templateKey, templateForms]) => (
              <div key={templateKey}>
                <h2 className="text-sm font-bold text-s-ink mb-3 uppercase tracking-wide">
                  {TEMPLATE_NAMES[templateKey] ?? humanizeKey(templateKey)}
                </h2>
                <div className="grid gap-3">
                  {templateForms.map((form) => {
                    const localeFmt = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-CH" : locale;
                    const isExpanded = expanded === form.id;
                    const responses = form.responses as Record<string, string>;

                    return (
                      <div key={form.id} className="bg-white rounded-[12px] border border-s-border overflow-hidden">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : form.id)}
                          // V3-D286: fix corrupted dark-mode concatenated hover (was `hover:bg-s-bg-surface:bg-white/5`)
                          className="w-full text-left p-4 flex justify-between items-center hover:bg-s-bg-sunken transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm text-s-ink">
                              {form.salons?.name ?? t("intakeUnknownSalon")}
                            </p>
                            <p className="text-xs text-s-ink-2 flex items-center gap-1 mt-1">
                              <Clock size={12} />
                              {new Date(form.filled_at).toLocaleDateString(localeFmt)}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-s-ink/40 px-3 py-1.5 bg-s-ink/5 rounded-btn">
                            {isExpanded ? t("intakeClose") : t("intakeShow")}
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-s-border">
                            {form.ai_recommendation && (
                              // V3-D286: AI recommendation block — undefined s-amber → s-accent pale (Layer 2 info wash, refined pastel pattern per CLAUDE.md V3-D199)
                              <div className="mt-4 mb-5 p-3 rounded-[12px] bg-s-bg-sunken border border-s-border">
                                <p className="text-xs font-bold text-s-ink flex items-center gap-1 mb-1.5">
                                  <Bot size={12} /> {t("intakeAiAnalysis")}
                                </p>
                                <p className="text-sm text-s-ink/80 leading-relaxed">
                                  {form.ai_recommendation}
                                </p>
                              </div>
                            )}

                            <div className="space-y-4">
                              {Object.entries(responses).map(([q, a]) => {
                                const questionI18nKey = `intakeQuestions.${templateKey}.${q}`;
                                return (
                                <div key={q}>
                                  <p className="text-xs font-medium text-s-ink-2 mb-0.5">
                                    {t.has(questionI18nKey) ? t(questionI18nKey) : humanizeKey(q)}
                                  </p>
                                  <p className="text-sm text-s-ink bg-s-bg-surface px-3 py-2 rounded-btn">
                                    {String(a)}
                                  </p>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
