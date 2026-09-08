"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { Mail } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { FieldHelper } from "@/app/[locale]/_components/primitives/FieldHelper";
import { TextInput } from "@/app/[locale]/_components/primitives/TextInput";
import { useSubmitGuard } from "@/lib/hooks/useSubmitGuard";
import { slideSwitch } from "@/lib/animations";
import { scorePassword } from "@/lib/password-strength";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ConsentLine() {
  const locale = useLocale();
  const t = useTranslations("authRegister");
  return (
    <p className="mt-3 text-center font-body text-[13px] font-normal text-s-ink-2">
      {t("consentPrefix")}{" "}
      <Link href={`/${locale}/terms`} className="text-s-accent hover:underline">
        {t("terms")}
      </Link>{" "}
      {t("consentAnd")}{" "}
      <Link
        href={`/${locale}/privacy`}
        className="text-s-accent hover:underline"
      >
        {t("privacy")}
      </Link>
      {t("consentSuffix")}
    </p>
  );
}

function StepEmail({
  email,
  onEmailChange,
  onContinue,
}: {
  email: string;
  onEmailChange: (email: string) => void;
  onContinue: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("authRegister");
  const [emailError, setEmailError] = useState<string | null>(null);

  const emailErrorFor = (value: string) =>
    EMAIL_PATTERN.test(value.trim()) && value.trim().length <= 320
      ? null
      : t("errorEmail");

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const error = emailErrorFor(normalizedEmail);
    setEmailError(error);
    if (error) return;
    onEmailChange(normalizedEmail);
    onContinue();
  };

  return (
    <div>
      <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-[-0.5px] text-s-ink">
        {t("welcomeTitle")}
      </h1>
      <p className="mt-2 font-body text-[15px] font-normal text-s-ink-2">
        {t("emailStepLead")}{" "}
        <Link
          href={`/${locale}/auth/login`}
          className="text-s-accent hover:underline"
        >
          {t("emailStepSignIn")}
        </Link>
      </p>

      <form onSubmit={handleContinue} className="mt-8">
        <TextInput
          type="email"
          placeholder={t("emailPlaceholder")}
          aria-label={t("emailPlaceholder")}
          aria-describedby={
            emailError ? "register-email-error" : "register-email-hint"
          }
          required
          autoComplete="email"
          inputMode="email"
          tone={emailError ? "error" : "default"}
          value={email}
          onChange={(event) => {
            const value = event.target.value;
            onEmailChange(value);
            if (emailError) setEmailError(emailErrorFor(value));
          }}
          className="!h-12 py-3 text-sm placeholder:text-s-ink/30"
        />
        {emailError ? (
          <FieldHelper id="register-email-error" tone="error" className="mt-2">
            {emailError}
          </FieldHelper>
        ) : (
          <p
            id="register-email-hint"
            className="mt-2 font-body text-[13px] font-normal text-s-ink-2"
          >
            {t("emailHint")}
          </p>
        )}
        <button
          type="submit"
          disabled={!email.trim()}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-[16px] bg-s-ink text-[14px] font-semibold text-white transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]"
        >
          {t("continue")}
        </button>
        <ConsentLine />
      </form>
    </div>
  );
}

function StepRegister({
  email,
  onNext,
  onBusiness,
  isSalon,
}: {
  email: string;
  onNext: () => void;
  onBusiness: () => void;
  isSalon: boolean;
}) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const t = useTranslations("authRegister");
  const tp = useTranslations("passwordStrength");
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

  const strength = useMemo(
    () => scorePassword(password, { email }),
    [password, email],
  );

  const calcAge = (dateStr: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return 0;

    const birthYear = Number(match[1]);
    const birthMonth = Number(match[2]);
    const birthDay = Number(match[3]);
    const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
    if (
      birthDate.getUTCFullYear() !== birthYear ||
      birthDate.getUTCMonth() !== birthMonth - 1 ||
      birthDate.getUTCDate() !== birthDay
    ) {
      return 0;
    }

    const today = new Date();
    let age = today.getUTCFullYear() - birthYear;
    const birthdayHasPassed =
      today.getUTCMonth() > birthMonth - 1 ||
      (today.getUTCMonth() === birthMonth - 1 &&
        today.getUTCDate() >= birthDay);
    if (!birthdayHasPassed) age -= 1;
    return age;
  };

  // states-forms-01: fires on blur (first pass) and, once a field is already in
  // error, again on every keystroke so the error clears the moment it's fixed.
  // Never fires while the user is still typing a first pass.
  const ageErrorFor = (dateStr: string) =>
    !isSalon && calcAge(dateStr) < 16 ? t("errorMinAge") : null;

  // LOCKFILE 14.4 (2026-06-11): errors name the exact cause BEFORE the server
  // gets a chance to answer generically. Mirrors the placeholder's stated policy.
  // The authoritative signup route requires 12 characters. Keep the client at
  // the same minimum, then retain the existing entropy score without adding a
  // composition rule.
  const passwordErrorFor = (pw: string) => {
    if (pw.length < 12) return t("errorPasswordMin");
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
        ? { email, password, salon_name: salonName, locale }
        : { email, password, birthday, locale };

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
        toast.error(
          data.code === "password_breached"
            ? t("errorPasswordBreached")
            : data.message || tc("errorProcessing"),
        );
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
          <p className="text-[18px] font-semibold text-s-ink">
            {t("successTitle")}
          </p>
          <p className="text-[13px] text-s-ink-2 mt-1.5 leading-relaxed">
            {t("successBody")}
          </p>
        </div>
        <button
          onClick={onNext}
          className="text-[13px] text-s-ink-2 underline underline-offset-2 hover:text-s-ink transition-colors mt-2"
        >
          {t("continue")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-[-0.5px] text-s-ink">
        {t("welcomeTitle")}
      </h1>
      <p className="mt-2 font-body text-[15px] font-normal text-s-ink-2">
        {isSalon ? t("businessDetailsSubtitle") : t("detailsSubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <TextInput
          type="password"
          aria-label={t("passwordLabel")}
          placeholder={t("passwordPlaceholder")}
          required
          autoComplete="new-password"
          revealable
          revealLabels={{
            show: ta("show_password"),
            hide: ta("hide_password"),
          }}
          tone={passwordError ? "error" : "default"}
          aria-describedby={
            passwordError ? "register-password-error" : undefined
          }
          value={password}
          onChange={(e) => {
            const v = e.target.value;
            setPassword(v);
            // states-forms-01: already-errored field re-validates live to clear fast;
            // a clean field never gets a first-pass error mid-keystroke.
            if (passwordError) setPasswordError(passwordErrorFor(v));
          }}
          onBlur={() => setPasswordError(passwordErrorFor(password))}
          className="!h-12 py-3 text-sm placeholder:text-s-ink/30"
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
          <FieldHelper
            id="register-password-error"
            tone="error"
            className="-mt-1.5"
          >
            {passwordError}
          </FieldHelper>
        )}

        {isSalon ? (
          <div>
            {/* owner 2026-08-09, decision 7 of ten, verbatim "7C": the small grey label above a
              field is gone, replaced by a larger ink question. The Uber shape, picked from the
              three he was shown on /dev/form-labels. The FIELD is untouched and stays as he locked
              it the same day: white fill, grey resting line, nothing happens on tap. */}
            <label
              htmlFor="register-salon-name"
              className="block text-[15px] text-s-ink mb-2"
            >
              {" "}
              {/* mockup-ok: he picked C from the three variants on /dev/form-labels, TASTE_LOG 2026-08-09 */}
              {t("salonNameLabel")}
            </label>
            <TextInput
              id="register-salon-name"
              type="text"
              required
              autoComplete="organization"
              placeholder={t("salonNamePlaceholder")}
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="!h-12 py-3 text-sm placeholder:text-s-ink/30"
            />
          </div>
        ) : (
          <div>
            {/* owner 2026-08-09, decision 7 of ten, verbatim "7C": the small grey label above a
              field is gone, replaced by a larger ink question. The Uber shape, picked from the
              three he was shown on /dev/form-labels. The FIELD is untouched and stays as he locked
              it the same day: white fill, grey resting line, nothing happens on tap. */}
            <label
              htmlFor="register-birthday"
              className="block text-[15px] text-s-ink mb-2"
            >
              {" "}
              {/* mockup-ok: he picked C from the three variants on /dev/form-labels, TASTE_LOG 2026-08-09 */}
              {t("birthdayLabel")}{" "}
              <span className="text-s-ink/25">{t("birthdayHint")}</span>
            </label>
            <TextInput
              id="register-birthday"
              type="date"
              required
              autoComplete="bday"
              tone={ageError ? "error" : "default"}
              aria-describedby={ageError ? "register-age-error" : undefined}
              value={birthday}
              onChange={(e) => {
                const v = e.target.value;
                setBirthday(v);
                if (ageError) setAgeError(ageErrorFor(v));
              }}
              onBlur={() => setAgeError(ageErrorFor(birthday))}
              className="!h-12 py-3 text-sm placeholder:text-s-ink/30"
            />
            {/* states-forms-02: single-field validation error, inline under the field. */}
            {ageError && (
              <FieldHelper id="register-age-error" tone="error">
                {ageError}
              </FieldHelper>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            !email || !password || (isSalon ? !salonName : !birthday) || saving
          }
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-s-ink text-[14px] font-semibold text-white transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]"
        >
          {saving && <Spinner size="sm" invert />}
          {t("createAccount")}
        </button>

        <ConsentLine />

        {!isSalon && (
          <p className="mt-8 text-center font-body text-[15px] font-normal text-s-ink-2">
            {t("businessPrompt")}{" "}
            <button
              type="button"
              onClick={onBusiness}
              className="inline-flex min-h-11 items-center text-s-accent hover:underline"
            >
              {t("businessAction")}
            </button>
          </p>
        )}
      </form>
    </div>
  );
}

// ─────────────────────────────────────────
// Main wizard
// ─────────────────────────────────────────

type WizardStep = "email" | "details";

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("email");
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [email, setEmail] = useState("");
  const [salonIntent, setSalonIntent] = useState(false);

  // Already signed in (e.g. browser-back onto this page) -> leave immediately,
  // same guard as SignIn; otherwise the wizard reads as "you got logged out".
  useEffect(() => {
    import("@/lib/supabase-browser").then(({ createBrowserSupabaseClient }) =>
      createBrowserSupabaseClient()
        .auth.getSession()
        .then(({ data }) => {
          if (data.session) window.location.replace(`/${locale}`);
        }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read intent=salon from URL on mount without reintroducing the removed role-choice screen.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("intent") === "salon") {
      setSalonIntent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The global Header already owns this route's one back control. Give the local step a
  // same-URL history entry so that control returns from details to email without duplicating
  // chrome, and keep the email in this mounted parent while the detail form unmounts.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      setDirection(
        event.state?.solenRegisterStep === "details" ? "right" : "left",
      );
      setStep(
        event.state?.solenRegisterStep === "details" ? "details" : "email",
      );
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const continueFromEmail = () => {
    setDirection("right");
    window.history.pushState(
      { ...(window.history.state ?? {}), solenRegisterStep: "details" },
      "",
      window.location.href,
    );
    setStep("details");
  };

  const updateEmail = (value: string) => {
    setEmail(value);
  };

  const chooseBusiness = () => {
    setSalonIntent(true);
  };

  const variants = slideSwitch(direction);

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-white">
      <div className="mx-auto w-full max-w-[402px] px-6 pb-16 pt-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {step === "email" ? (
              <StepEmail
                email={email}
                onEmailChange={updateEmail}
                onContinue={continueFromEmail}
              />
            ) : (
              <StepRegister
                email={email}
                isSalon={salonIntent}
                onBusiness={chooseBusiness}
                onNext={() => {
                  if (salonIntent) {
                    router.push(`/${locale}/onboarding/salon`);
                  } else {
                    // V3-D348: customer onboarding now happens post-confirmation
                    // via /api/auth/callback -> /onboarding. The old in-wizard
                    // Step1/2/3 are retired; send them home after the email notice.
                    router.push(`/${locale}`);
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
