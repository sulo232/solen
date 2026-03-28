"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Users, Check, AlertTriangle } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

export default function StaffInvitePage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [salonName, setSalonName] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState<string | null>(null);

  // We show the token info and an accept button
  // On accept, call the API which links the account

  useEffect(() => {
    if (!token) setError("Kein Token angegeben");
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect) {
          // Need to log in first
          window.location.href = data.redirect;
          return;
        }
        throw new Error(data.error ?? "Fehler");
      }
      setSalonName(data.salon_name ?? null);
      setInviteName(data.staff_name ?? null);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    de: {
      title: "Team-Einladung",
      desc: "Du wurdest eingeladen, einem Salon-Team beizutreten.",
      accept: "Einladung annehmen",
      success: "Willkommen im Team!",
      successDesc: "Du kannst jetzt auf das Dashboard zugreifen.",
      goToDashboard: "Zum Dashboard",
      noToken: "Ungültiger Einladungslink",
      role: "Mitarbeiter",
    },
    en: {
      title: "Team Invitation",
      desc: "You have been invited to join a salon team.",
      accept: "Accept Invitation",
      success: "Welcome to the team!",
      successDesc: "You can now access the dashboard.",
      goToDashboard: "Go to Dashboard",
      noToken: "Invalid invitation link",
      role: "Staff Member",
    },
  };
  const l = labels[locale as "de" | "en"] ?? labels.de;

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-s-dm-surface rounded-[12px] shadow-warm-md max-w-md w-full p-8"
      >
        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-coral/10">
              <Check size={24} className="text-s-coral" />
            </div>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">{l.success}</h2>
            {salonName && <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-1">{salonName}</p>}
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">{l.successDesc}</p>
            <a href={`/${locale}/dashboard`} className="inline-block px-6 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-colors">
              {l.goToDashboard}
            </a>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-amber-subtle">
              <AlertTriangle size={24} className="text-s-amber" />
            </div>
            <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70">{error === "Kein Token angegeben" ? l.noToken : error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-s-coral/10 flex items-center justify-center">
                <Users size={22} className="text-s-coral" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">{l.title}</h1>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{l.role}</p>
              </div>
            </div>

            <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-6">{l.desc}</p>

            <button
              onClick={handleAccept}
              disabled={loading || !token}
              className="w-full py-3 rounded-btn bg-s-coral text-white font-semibold text-sm hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Spinner size="sm" invert />}
              {l.accept}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
