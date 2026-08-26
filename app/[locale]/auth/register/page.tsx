"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { User, Building2, ChevronRight, Mail } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { FieldHelper } from "@/app/[locale]/_components/primitives/FieldHelper";
import { useSubmitGuard } from "@/lib/hooks/useSubmitGuard";
import { slideSwitch } from "@/lib/animations";
import { scorePassword } from "@/lib/password-strength";

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
          <User size={20} strokeWidth={2.2} className="text-s-ink" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-s-ink">{t("roleCustomerTitle")}</p>
          <p className="text-[12px] text-s-ink-2 mt-0.5">{t("roleCustomerDesc")}</p>
        </div>
        <ChevronRight size={18} strokeWidth={1.9} className="text-s-ink/30 group-hover:text-s-ink transition-colors shrink-0" />
      </button>

      {/* Salon choice */}
      <button onClick={onSalon}
        className="group flex items-center gap-4 p-4 rounded-[12px] border border-s-border hover:border-s-ink/30 hover:bg-s-bg-sunken transition-colors duration-150 text-left">
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-s-bg-sunken">
          <Building2 size={20} strokeWidth={2.2} className="text-s-ink" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-s-ink">{t("roleSalonTitle")}</p>
          <p className="text-[12px] text-s-ink-2 mt-0.5">{t("roleSalonDesc")}</p>
        </div>
        <ChevronRight size={18} strokeWidth={1.9} className="text-s-ink/30 group-hover:text-s-ink transition-colors shrink-0" />
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
  const tp = useTranslations("passwordStrength");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [salonName, setSalonName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  // states-forms-02: single-field validation errors render inline under the field
  // (LOCKFILE §14.4), never as a toast. toast.error stays reserved for the
  // account-exists / server / network branches below.
  const [ageError, setAgeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // states-forms-05: account creation is a non-idempotent write; a synchronous
  // ref guard (not just the `saving` state flag) closes the double-tap race.
  const submitGuard = useSubmitGuard();

  const strength = useMemo(() => scorePassword(password, { email }), [password, email]);

  const calcAge = (dateStr: string) => {
    if (!dateStr) return 0;
    const b = new Date(dateStr);
    const ageDifMs = Date.now() - b.getTime();
    return Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
  };

  // states-forms-01: fires on blur (first pass) and, once a field is already in
  // error, again on every keystroke so the error clears the moment it's fixed.
  // Never fires while the user is still typing a first pass.
  const ageErrorFor = (dateStr: string) =>
    !isSalon && calcAge(dateStr) < 16 ? t("errorMinAge") : null;

  // LOCKFILE 14.4 (2026-06-11): errors name the exact cause BEFORE the server
  // gets a chance to answer generically. Mirrors the placeholder's stated policy.
  // ig1 (2026-07-16): the server (lib/validations.ts signupSchema) only enforces
  // min(8).max(200); gate on that plus a real entropy score, never composition.
  const passwordErrorFor = (pw: string) => {
    if (pw.length < 8) return t("errorPasswordMin");
    const s = scorePassword(pw, { email });
    // strength.cause is never "clear" once score < 2 (see lib/password-strength.ts),
    // the fallback only satisfies the type since next-intl needs a real message key.
    if (s.score < 2) return tp(s.cause === "clear" ? "addLength" : s.cause);
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ageErr = ageErrorFor(birthday);
    const pwErr = passwordErrorFor(password);
    setAgeError(ageErr);
    setPasswordError(pwErr);
    if (ageErr || pwErr) return;

    // The copy this merge came from replaced the rule above with a bare 12-character minimum and
    // no other requirement. Refused, for the second time: it is a change every existing customer
    // would feel and it is not part of the breach fix. Only the locale-aware error below is taken.
    if (!submitGuard.tryEnter()) return; // a signup is already in flight, drop the duplicate
    setSaving(true);

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
        return;
      }
      if (!res.ok) {
        // A leaked password gets its own translated line instead of the server's German sentence.
        // Every other server error falls back to its raw message exactly as before.
        toast.error(data.code === "password_breached" ? t("errorPasswordBreached") : (data.message || tc("errorProcessing")));
        return;
      }
      setSuccess(true);
    } catch {
      toast.error(tc("networkError"));
    } finally {
      submitGuard.release();
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-s-bg-sunken">
          <Mail size={24} strokeWidth={2.4} className="text-s-ink" />
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
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3.5 text-sm font-body text-s-ink placeholder:text-s-ink/30 transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
      />
      <input
        type="password"
        placeholder={t("passwordPlaceholder")}
        required
        autoComplete="new-password"
        aria-invalid={passwordError ? true : undefined}
        value={password}
        onChange={(e) => {
          const v = e.target.value;
          setPassword(v);
          // states-forms-01: already-errored field re-validates live to clear fast;
          // a clean field never gets a first-pass error mid-keystroke.
          if (passwordError) setPasswordError(passwordErrorFor(v));
        }}
        onBlur={() => setPasswordError(passwordErrorFor(password))}
        className="w-full px-4 py-3.5 text-sm font-body text-s-ink placeholder:text-s-ink/30 transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
      />

      {/* mockup-ok: ig1, owner-approved TASTE_LOG.md 2026-07-16 "IG-principles round 1". Strength bar reuses ImageUpload.tsx:265-273 geometry (slim pill, ink fill). */}
      {password.length > 0 && !passwordError && (
        <div className="flex flex-col gap-1 -mt-1.5">
          <div className="h-1.5 w-full rounded-pill bg-s-bg-sunken overflow-hidden">
            {/* mockup-ok: hard-rule-2 conformance fix, treatment-only (fill looks
                identical). Was animating `width` at 300ms on a per-keystroke
                control; converted to `scaleX` (origin left) on the snap tier
                (150ms, finding 4: a repeated action gets the fastest tier). */}
            <div
              className="h-full w-full origin-left rounded-pill bg-s-ink transition-transform duration-150" // mockup-ok
              style={{ transform: `scaleX(${strength.score / 4})` }}
            />
          </div>
          <p className="text-[12px] text-s-ink-2">
            {tp(strength.level)}
            {strength.cause !== "clear" && `: ${tp(strength.cause)}`}
          </p>
        </div>
      )}
      {/* states-forms-02: single-field validation error, inline under the field
          per LOCKFILE §14.4, never a toast. */}
      {passwordError && (
        <FieldHelper tone="error" className="-mt-1.5">{passwordError}</FieldHelper>
      )}

      {isSalon ? (
        <div>
          {/* owner 2026-08-09, decision 7 of ten, verbatim "7C": the small grey label above a
              field is gone, replaced by a larger ink question. The Uber shape, picked from the
              three he was shown on /dev/form-labels. The FIELD is untouched and stays as he locked
              it the same day: white fill, grey resting line, nothing happens on tap. */}
          <label className="block text-[15px] text-s-ink mb-2"> {/* mockup-ok: he picked C from the three variants on /dev/form-labels, TASTE_LOG 2026-08-09 */}
            {t("salonNameLabel")}
          </label>
          <input
            type="text"
            required
            autoComplete="organization"
            placeholder={t("salonNamePlaceholder")}
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            className="w-full px-4 py-3.5 text-sm font-body text-s-ink placeholder:text-s-ink/30 transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
        </div>
      ) : (
        <div>
          {/* owner 2026-08-09, decision 7 of ten, verbatim "7C": the small grey label above a
              field is gone, replaced by a larger ink question. The Uber shape, picked from the
              three he was shown on /dev/form-labels. The FIELD is untouched and stays as he locked
              it the same day: white fill, grey resting line, nothing happens on tap. */}
          <label className="block text-[15px] text-s-ink mb-2"> {/* mockup-ok: he picked C from the three variants on /dev/form-labels, TASTE_LOG 2026-08-09 */}
            {t("birthdayLabel")} <span className="text-s-ink/25">{t("birthdayHint")}</span>
          </label>
          <input
            type="date"
            required
            autoComplete="bday"
            aria-invalid={ageError ? true : undefined}
            value={birthday}
            onChange={(e) => {
              const v = e.target.value;
              setBirthday(v);
              if (ageError) setAgeError(ageErrorFor(v));
            }}
            onBlur={() => setAgeError(ageErrorFor(birthday))}
            className="w-full px-4 py-3.5 text-sm font-body text-s-ink placeholder:text-s-ink/30 transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
          {/* states-forms-02: single-field validation error, inline under the field. */}
          {ageError && <FieldHelper tone="error">{ageError}</FieldHelper>}
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
