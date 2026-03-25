"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "@/components/ui/Spinner";
import { FileText, Check } from "lucide-react";

// Update this when Terms of Service fundamentally change
const CURRENT_TOS_VERSION = "2026-03-23";

export default function TosPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't interrupt auth callback or legal pages
    if (pathname.includes("/auth/callback") || pathname.includes("/legal/")) {
      setLoading(false);
      return;
    }

    const checkTos = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tos_version")
        .eq("id", session.user.id)
        .single();

      if (profile && profile.tos_version !== CURRENT_TOS_VERSION) {
        setShow(true);
      }
      setLoading(false);
    };

    checkTos();
  }, [pathname]);

  const handleAccept = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/accept-tos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tos_version: CURRENT_TOS_VERSION }),
      });
      if (res.ok) {
        setShow(false);
      }
    } catch (e) {
      console.error("Failed to accept TOS", e);
    }
    setSaving(false);
  };

  if (loading || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-s-ink/40 dark:bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-s-dm-surface rounded-card shadow-warm-lg overflow-hidden flex flex-col"
      >
        <div className="p-6 text-center border-b border-s-ink/5 dark:border-white/5">
          <div className="w-12 h-12 rounded-full bg-s-coral/10 mx-auto flex items-center justify-center mb-4">
            <FileText size={24} className="text-s-coral" />
          </div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">Aktualisierte Nutzungsbedingungen</h2>
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 font-body">
            Wir haben unsere Allgemeinen Geschäftsbedingungen (AGB) und die Datenschutzerklärung aktualisiert. 
            Bitte akzeptiere die neuen Bedingungen, um solen.ch weiterhin nutzen zu können.
          </p>
        </div>
        
        <div className="p-6 bg-s-bg-sunken dark:bg-s-dm-bg">
          <div className="flex flex-col gap-3">
            <a href="/de/legal/terms" target="_blank" className="flex items-center justify-between p-3 rounded-btn bg-white dark:bg-s-dm-raised border border-s-ink/10 dark:border-white/10 hover:border-s-coral transition-colors group">
              <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">Allgemeine Geschäftsbedingungen</span>
              <span className="text-xs text-s-coral group-hover:underline">Lesen</span>
            </a>
            <a href="/de/legal/privacy" target="_blank" className="flex items-center justify-between p-3 rounded-btn bg-white dark:bg-s-dm-raised border border-s-ink/10 dark:border-white/10 hover:border-s-coral transition-colors group">
              <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">Datenschutzerklärung</span>
              <span className="text-xs text-s-coral group-hover:underline">Lesen</span>
            </a>
          </div>
        </div>

        <div className="p-6 border-t border-s-ink/5 dark:border-white/5 flex flex-col gap-3">
          <button
            onClick={handleAccept}
            disabled={saving}
            className="w-full py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-medium text-sm hover:brightness-[1.06] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size="sm" invert /> : <Check size={18} />}
            Ich akzeptiere die neuen Bedingungen
          </button>
        </div>
      </motion.div>
    </div>
  );
}
