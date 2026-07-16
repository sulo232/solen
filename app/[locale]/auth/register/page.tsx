"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { User, Building2, ChevronRight, Mail } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { slideSwitch } from "@/lib/animations";

// ─────────────────────────────────────────
// Step 0 — Customer vs Salon choice (NEW)
// ─────────────────────────────────────────
function StepRole({ onCustomer, onSalon }: { onCustomer: () => void; onSalon: () => void }) {
  const t = useTranslations("authRegister");
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-1">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-s-ink">
          {t("roleHeading")}
        </h2>
        <p className="text-[14px] text-s-ink-2 mt-1">{t("roleSubtitle")}</p>
      </div>

      {/* Customer choice */}
      <button onClick={onCustomer}
        className="group flex items-center gap-4 p-4 rounded-[12px] border border-s-border hover:border-s-ink/30 hover:bg-s-bg-sunken transition-colors duration-150 text-left">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-s-bg-sunken">
          <User size={20} className="text-s-ink" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-s-ink">{t("roleCustomerTitle")}</p>
          <p className="text-[12px] text-s-ink-2 mt-0.5">{t("roleCustomerDesc")}</p>
        </div>
        <ChevronRight size={18} className="text-s-ink/30 group-hover:text-s-ink transition-colors shrink-0" />
      </button>

      {/* Salon choice */}
      <button onClick={onSalon}
        className="group flex items-center gap-4 p-4 rounded-[12px] border border-s-border hover:border-s-ink/30 hover:bg-s-bg-sunken transition-colors duration-150 text-left">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-s-bg-sunken">
          <Building2 size={20} className="text-s-ink" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-s-ink">{t("roleSalonTitle")}</p>
          <p className="text-[12px] text-s-ink-2 mt-0.5">{t("roleSalonDesc")}</p>
        </div>
        <ChevronRight size={18} className="text-s-ink/30 group-hover:text-s-ink transition-colors shrink-0" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Step 0.5 — Register Email/Pass/DOB (NEW)
// ─────────────────────────────────────────
function StepRegister({ onNext, isSalon }: { onNext: () => void; isSalon?: boolean }) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const t = useTranslations("authRegister");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [salonName, setSalonName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const calcAge = (dateStr: string) => {
    if (!dateStr) return 0;
    const b = new Date(dateStr);
    const ageDifMs = Date.now() - b.getTime();
    return Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (!isSalon && calcAge(birthday) < 16) {
      toast.error(t("errorMinAge"));
      setSaving(false);
      return;
    }

    // LOCKFILE 14.4 (2026-06-11): errors name the exact cause BEFORE the server
    // gets a chance to answer generically. Mirrors the placeholder's stated policy.
    // NIST SP 800-63-4 (July 2025): length only, no composition rules. The
    // breach-list check happens server-side (app/api/auth/signup/route.ts).
    if (password.length < 12) {
      toast.error(t("errorPasswordMin"));
      setSaving(false);
      return;
    }

    try {
      const payload = isSalon 
        ? { email, password, salon_name: salonName } 
        : { email, password, birthday };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409) {
        toast.error(t("errorAccountExists"));
        setSaving(false);
        return;
      }
      if (!res.ok) {
        // password_breached gets its own locale-aware copy (distinct from
        // "too short"); every other server error falls back to its raw message.
        toast.error(data.code === "password_breached" ? t("errorPasswordBreached") : (data.message || tc("errorProcessing")));
        setSaving(false);
        return;
      }
      setSuccess(true);
    } catch {
      toast.error(tc("networkError"));
    }
    setSaving(false);
  };

  if (success) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-s-bg-sunken">
          <Mail size={24} className="text-s-ink" />
        </div>
        <div>
          <p className="text-[18px] font-semibold text-s-ink">{t("successTitle")}</p>
          <p className="text-[13px] text-s-ink-2 mt-1.5 leading-relaxed">
            {t("successBody")}
          </p>
        </div>
        <button onClick={onNext}
          className="text-[13px] text-s-ink-2 underline underline-offset-2 hover:text-s-ink transition-colors mt-2">
          {t("continue")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-s-ink">{t("createAccount")}</h2>

      <input
        type="email"
        placeholder={t("emailPlaceholder")}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent/15 transition-colors"
      />
      <input
        type="password"
        placeholder={t("passwordPlaceholder")}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent/15 transition-colors"
      />
      
      {isSalon ? (
        <div>
          <label className="block text-[13px] font-medium text-s-ink-2 mb-1.5">
            {t("salonNameLabel")}
          </label>
          <input
            type="text"
            required
            placeholder={t("salonNamePlaceholder")}
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent/15 transition-colors"
          />
        </div>
      ) : (
        <div>
          <label className="block text-[13px] font-medium text-s-ink-2 mb-1.5">
            {t("birthdayLabel")} <span className="text-s-ink/25">{t("birthdayHint")}</span>
          </label>
          <input
            type="date"
            required
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-accent focus:ring-2 focus:ring-s-accent/15 transition-colors"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!email || !password || (isSalon ? !salonName : !birthday) || saving}
        className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium active:scale-[0.97] transition-transform duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
        {saving && <Spinner size="sm" invert />}
        {t("submit")}
      </button>

      <p className="text-center text-[13px] text-s-ink-2 mt-2">
        {t("haveAccount")}{" "}
        <Link href={`/${locale}/auth/login`} className="text-s-ink font-semibold">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────
// Main wizard
// ─────────────────────────────────────────

type WizardStep = -1 | 0;

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("authRegister");
  const [step, setStep] = useState<WizardStep>(-1);
  const [prevStep, setPrevStep] = useState<WizardStep>(-1);
  const [salonIntent, setSalonIntent] = useState(false);

  // Already signed in (e.g. browser-back onto this page) -> leave immediately,
  // same guard as SignIn; otherwise the wizard reads as "you got logged out".
  useEffect(() => {
    import("@/lib/supabase-browser").then(({ createBrowserSupabaseClient }) =>
      createBrowserSupabaseClient().auth.getSession().then(({ data }) => {
        if (data.session) window.location.replace(`/${locale}`);
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read intent=salon from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("intent") === "salon") {
      setSalonIntent(true);
      goTo(0); // Jump straight to registration form
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (next: WizardStep) => {
    setPrevStep(step);
    setStep(next);
  };

  const handleSalonChoice = () => {
    setSalonIntent(true);
    goTo(0); // Show the registration form first — account must exist before onboarding
  };

  const direction = prevStep === -1 && step === 0 ? "right" : "left";
  const variants = slideSwitch(direction);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-8 pb-12">
      <div className="w-full max-w-sm">
        {/* Auth card — clean B&W surface (design-system) */}
        <div className="rounded-card border border-s-border bg-white overflow-hidden">
          <div className="p-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={String(step)}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {step === -1 && <StepRole onCustomer={() => goTo(0)} onSalon={handleSalonChoice} />}
                {step === 0 && <StepRegister isSalon={salonIntent} onNext={() => {
                  if (salonIntent) {
                    router.push(`/${locale}/onboarding/salon`);
                  } else {
                    // V3-D348: customer onboarding now happens post-confirmation
                    // via /api/auth/callback -> /onboarding. The old in-wizard
                    // Step1/2/3 are retired; send them home after the email notice.
                    router.push(`/${locale}`);
                  }
                }} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {step === -1 && (
          <p className="text-center mt-8 text-[13px] text-s-ink-2">
            {t("alreadyRegistered")}{" "}
            <Link href={`/${locale}/auth/login`}
              className="text-s-ink font-semibold">
              {t("signIn")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
