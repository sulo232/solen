"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Users, Mail, UserPlus, Check, Lightbulb } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { useTranslations } from "next-intl";
import type { StepHandle } from "@/components-legacy/onboarding/SetupWizard";

interface TeamStepProps {
  onSaved: () => void;
}

const TeamStep = forwardRef<StepHandle, TeamStepProps>(function TeamStep({ onSaved }, ref) {
  const t = useTranslations("onboarding");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [invites, setInvites] = useState<{ email: string; name: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteInFlightRef = useRef<Promise<boolean> | null>(null);

  const sendInvite = (): Promise<boolean> => {
    if (inviteInFlightRef.current) return inviteInFlightRef.current;
    if (!email) return Promise.resolve(false);

    const operation = (async () => {
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
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler");
        return false;
      } finally {
        setSending(false);
      }
    })();
    inviteInFlightRef.current = operation;
    void operation.finally(() => {
      if (inviteInFlightRef.current === operation) inviteInFlightRef.current = null;
    });
    return operation;
  };

  const handleContinue = async (): Promise<boolean> => {
    const activeInvite = inviteInFlightRef.current;
    if (activeInvite && !(await activeInvite)) return false;
    onSaved();
    return true;
  };

  useImperativeHandle(ref, () => ({ save: handleContinue }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-ink/10 flex items-center justify-center">
          <Users size={22} strokeWidth={2.2} className="text-s-accent" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-s-ink">
            {t("team.title")}
          </h2>
          <p className="text-sm text-s-ink/40">
            {t("team.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-s-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">
              <Mail size={12} className="inline mr-1" />
              {t("team.emailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mitarbeiter@email.ch"
              className="w-full px-4 py-2.5 text-sm text-s-ink transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">
              <UserPlus size={12} className="inline mr-1" />
              {t("team.nameLabel")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("team.firstName")}
              className="w-full px-4 py-2.5 text-sm text-s-ink transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
            />
          </div>
        </div>

        {error && <p className="text-xs text-s-accent" role="alert">{error}</p>}

        <button
          onClick={sendInvite}
          disabled={!email || sending}
          className="w-full py-2.5 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[12px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
        >
          {sending && <Spinner size="sm" invert />}
          {t("team.sendInvite")}
        </button>
      </div>

      {invites.length > 0 && (
        <div className="bg-white rounded-[12px] border border-s-border overflow-hidden">
          {invites.map((inv, i) => (
            <div key={i} className={["flex items-center gap-3 px-5 py-3", i > 0 ? "border-t border-s-border" : ""].join(" ")}>
              <div className="w-8 h-8 rounded-full bg-s-ink/10 flex items-center justify-center">
                <UserPlus size={14} strokeWidth={1.6} className="text-s-accent" />
              </div>
              <div>
                <p className="text-sm text-s-ink">{inv.name || inv.email}</p>
                <p className="text-xs text-s-ink/40 flex items-center gap-1">
                  {t("team.inviteSent")} <Check size={10} className="text-s-accent" />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-s-bg-surface rounded-[12px] px-4 py-3 flex items-start gap-2">
        <Lightbulb size={14} strokeWidth={1.6} className="text-s-ink/30 mt-0.5 shrink-0" />
        <p className="text-xs text-s-ink/40">
          {t("team.soloHint")}
        </p>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-3 mt-6 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[12px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
      >
        {t("setup.saveAndContinue")}
      </button>
    </div>
  );
});

export default TeamStep;
