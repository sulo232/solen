"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronLeft, ClipboardList, Clock, Sparkles } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import type { IntakeFormResponse } from "@/lib/types";

type FormWithSalon = IntakeFormResponse & { salons: { name: string, slug: string } };

const TEMPLATE_NAMES: Record<string, string> = {
  hair_consultation: "Haar-Beratung",
  nail_consultation: "Nail-Beratung",
  waxing_consultation: "Waxing-Beratung",
  makeup_consultation: "Make-up-Beratung",
  spa_consultation: "Spa-Beratung",
};

export default function MyIntakeFormsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Profile") as any;
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
          router.push(`/${locale}/auth/login`);
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
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/${locale}/profile`} className="p-2 -ml-2 rounded-full hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} className="text-s-ink/60 dark:text-s-dm-text/60" />
          </Link>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text flex items-center gap-2">
            <ClipboardList size={20} className="text-s-amber" />
            Meine Konsultationsformulare
          </h1>
        </div>

        {/* List */}
        {forms.length === 0 ? (
          <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/10 p-8 text-center text-s-ink/40 dark:text-s-dm-text/40">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Bisher keine Formulare ausgefüllt</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([templateKey, templateForms]) => (
              <div key={templateKey}>
                <h2 className="text-sm font-bold text-s-ink dark:text-s-dm-text mb-3 uppercase tracking-wide">
                  {TEMPLATE_NAMES[templateKey] ?? templateKey.replace("_", " ")}
                </h2>
                <div className="grid gap-3">
                  {templateForms.map((form) => {
                    const localeFmt = locale === "de" ? "de-CH" : locale;
                    const isExpanded = expanded === form.id;
                    const responses = form.responses as Record<string, string>;

                    return (
                      <div key={form.id} className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/10 overflow-hidden">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : form.id)}
                          className="w-full text-left p-4 flex justify-between items-center hover:bg-s-bg-surface dark:hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm text-s-ink dark:text-s-dm-text">
                              {form.salons?.name ?? "Unbekannter Salon"}
                            </p>
                            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 flex items-center gap-1 mt-1">
                              <Clock size={12} />
                              {new Date(form.filled_at).toLocaleDateString(localeFmt)}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 px-3 py-1.5 bg-s-ink/5 dark:bg-white/5 rounded-btn">
                            {isExpanded ? "Schliessen" : "Anzeigen"}
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-s-ink/5 dark:border-white/5">
                            {form.ai_recommendation && (
                              <div className="mt-4 mb-5 p-3 rounded-[12px] bg-s-amber/10 border border-s-amber/20">
                                <p className="text-xs font-bold text-s-amber flex items-center gap-1 mb-1.5 uppercase tracking-wide">
                                  <Sparkles size={12} /> AI Analyse
                                </p>
                                <p className="text-sm text-s-ink/80 dark:text-s-dm-text/80 leading-relaxed">
                                  {form.ai_recommendation}
                                </p>
                              </div>
                            )}

                            <div className="space-y-4">
                              {Object.entries(responses).map(([q, a]) => (
                                <div key={q}>
                                  <p className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-0.5">
                                    {q.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-sm text-s-ink dark:text-s-dm-text bg-s-bg-surface dark:bg-s-dm-bg px-3 py-2 rounded-btn">
                                    {String(a)}
                                  </p>
                                </div>
                              ))}
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
