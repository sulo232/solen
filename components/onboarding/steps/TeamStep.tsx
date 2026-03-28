"use client";

import { useState } from "react";
import { Users, Mail, UserPlus, Check, Lightbulb } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useTranslations } from "next-intl";

interface TeamStepProps {
  onSaved: () => void;
}

export default function TeamStep({ onSaved }: TeamStepProps) {
  const t = useTranslations("onboarding") as any;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [invites, setInvites] = useState<{ email: string; name: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvite = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
      }
      setInvites((prev) => [...prev, { email, name }]);
      setEmail("");
      setName("");
      // Removed onSaved() so user can add multiple members before advancing
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
          <Users size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t("team.title")}
          </h2>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50">
            {t("team.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
              <Mail size={12} className="inline mr-1" />
              {t("team.emailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mitarbeiter@email.ch"
              className="w-full px-4 py-2.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">
              <UserPlus size={12} className="inline mr-1" />
              {t("team.nameLabel")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("team.firstName")}
              className="w-full px-4 py-2.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-xs text-s-coral">{error}</p>}

        <button
          onClick={sendInvite}
          disabled={!email || sending}
          className="w-full py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-coral-glow transition-all"
        >
          {sending && <Spinner size="sm" invert />}
          {t("team.sendInvite")}
        </button>
      </div>

      {invites.length > 0 && (
        <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 overflow-hidden">
          {invites.map((inv, i) => (
            <div key={i} className={["flex items-center gap-3 px-5 py-3", i > 0 ? "border-t border-s-ink/5 dark:border-white/5" : ""].join(" ")}>
              <div className="w-8 h-8 rounded-full bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
                <UserPlus size={14} className="text-s-coral" />
              </div>
              <div>
                <p className="text-sm text-s-ink dark:text-s-dm-text">{inv.name || inv.email}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-1">
                  {t("team.inviteSent")} <Check size={10} className="text-s-coral" />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-s-bg-surface dark:bg-s-dm-raised rounded-[12px] px-4 py-3 flex items-start gap-2">
        <Lightbulb size={14} className="text-s-ink/30 dark:text-s-dm-text/30 mt-0.5 shrink-0" />
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
          {t("team.soloHint")}
        </p>
      </div>

      <button
        onClick={() => onSaved()}
        className="w-full py-3 mt-6 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-coral-glow transition-all"
      >
        {t("setup.saveAndContinue")}
      </button>
    </div>
  );
}
