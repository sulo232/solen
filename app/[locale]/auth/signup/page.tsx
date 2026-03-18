"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const toast = useToast();
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password validation
  const pwMin8 = password.length >= 8;
  const pwUpper = /[A-Z]/.test(password);
  const pwNumber = /[0-9]/.test(password);
  const pwMatch = password === confirmPassword && confirmPassword.length > 0;
  const pwValid = pwMin8 && pwUpper && pwNumber && pwMatch;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwValid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.message || "Registrierung fehlgeschlagen", "error");
      } else {
        setOtpSent(true);
      }
    } catch {
      toast("Netzwerkfehler", "error");
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const token = otp.join("");
    if (token.length !== 6) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, type: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.message || "Ungültiger Code", "error");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        // Refresh session in browser
        await supabase.auth.refreshSession();
        toast("Konto erfolgreich erstellt!", "success");
        router.push("/de");
      }
    } catch {
      toast("Netzwerkfehler", "error");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) toast(error.message, "error");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-mesh-teal flex flex-col items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-s-coral/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-s-coral/8 blur-[100px]" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-block font-heading font-bold text-3xl text-dark tracking-tight hover:opacity-80 transition-opacity"
          >
            solen<span className="text-s-coral">.</span>ch
          </a>
          <p className="text-dark/50 font-body text-sm mt-2">Konto erstellen</p>
        </div>

        {/* GlassCard */}
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-glass shadow-glass p-8">
          {otpSent ? (
            /* OTP Verification */
            <div className="flex flex-col gap-5 items-center">
              <div className="w-14 h-14 rounded-2xl bg-s-coral/10 flex items-center justify-center">
                <Mail size={26} className="text-s-coral" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="font-heading font-semibold text-dark text-lg">Bestätigungscode</p>
                <p className="text-sm text-dark/50 font-body mt-1">
                  Code an <strong className="text-dark/70">{email}</strong> gesendet
                </p>
              </div>

              {/* 6-digit OTP input */}
              <div className="flex gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 text-center text-lg data-text font-semibold text-dark rounded-button border border-gray-200 outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
                    aria-label={`Ziffer ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length !== 6}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-button bg-s-coral text-white text-sm font-body font-medium hover:bg-s-coral-dark transition-colors disabled:opacity-50 shadow-teal-glow"
              >
                {loading ? <Spinner size="sm" invert /> : <CheckCircle size={15} />}
                Bestätigen
              </button>

              <button
                onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); }}
                className="text-sm text-dark/50 hover:text-dark font-body"
              >
                Andere E-Mail verwenden
              </button>
            </div>
          ) : (
            /* Sign-up form */
            <div className="flex flex-col gap-4 w-full">
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-button border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-body font-medium text-dark shadow-card disabled:opacity-50"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Mit Google registrieren
              </button>

              <div className="flex items-center gap-3 text-xs text-dark/30 font-body">
                <div className="flex-1 h-px bg-gray-100" />
                oder
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail"
                  required
                  className="w-full px-4 py-2.5 rounded-button border border-gray-200 text-sm text-dark font-body outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort"
                    required
                    className="w-full px-4 py-2.5 pr-10 rounded-button border border-gray-200 text-sm text-dark font-body outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort bestätigen"
                  required
                  className="w-full px-4 py-2.5 rounded-button border border-gray-200 text-sm text-dark font-body outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
                />

                {/* Password requirements */}
                {password.length > 0 && (
                  <div className="flex flex-col gap-1 text-xs font-body">
                    <span className={pwMin8 ? "text-green-600" : "text-dark/40"}>
                      {pwMin8 ? "✓" : "○"} Mindestens 8 Zeichen
                    </span>
                    <span className={pwUpper ? "text-green-600" : "text-dark/40"}>
                      {pwUpper ? "✓" : "○"} Mindestens ein Grossbuchstabe
                    </span>
                    <span className={pwNumber ? "text-green-600" : "text-dark/40"}>
                      {pwNumber ? "✓" : "○"} Mindestens eine Zahl
                    </span>
                    {confirmPassword.length > 0 && (
                      <span className={pwMatch ? "text-green-600" : "text-s-coral"}>
                        {pwMatch ? "✓" : "✗"} Passwörter stimmen überein
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !pwValid || !email}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-button bg-s-coral text-white text-sm font-body font-medium hover:bg-s-coral-dark transition-colors disabled:opacity-50 shadow-teal-glow mt-1"
                >
                  {loading && <Spinner size="sm" invert />}
                  Registrieren
                </button>
              </form>

              <p className="text-xs text-dark/30 text-center font-body">
                Mit der Registrierung akzeptierst du unsere AGB.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-dark/30 font-body mt-6">
          Bereits registriert?{" "}
          <a href="/de/auth/login" className="text-s-coral hover:underline">
            Anmelden
          </a>
        </p>
      </div>
    </div>
  );
}
