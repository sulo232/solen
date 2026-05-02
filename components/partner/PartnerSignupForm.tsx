"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export default function PartnerSignupForm() {
  const t = useTranslations("partner") as any;
  const [email, setEmail] = useState("");
  const [salonName, setSalonName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !salonName) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/partner/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, salon_name: salonName }),
      });

      if (!res.ok) throw new Error("Submission failed");
      
      setStatus("success");
      setEmail("");
      setSalonName("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-sm rounded-[14px] bg-s-sage/10 border border-s-sage/20 p-5 text-center mt-6">
        <h3 className="font-heading font-semibold text-s-sage-text mb-1">
          {t("form_success_title")}
        </h3>
        <p className="text-sm font-body text-s-ink/70">
          {t("form_success_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mt-8 mx-auto lg:mx-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          required
          value={salonName}
          onChange={(e) => setSalonName(e.target.value)}
          placeholder={t("form_salon_name_placeholder")}
          className="w-full px-5 py-3.5 bg-white border border-s-ink/10 rounded-xl text-sm font-body text-s-ink focus:outline-none focus:border-s-coral focus:ring-1 focus:ring-s-coral transition-colors"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("form_email_placeholder")}
          className="w-full px-5 py-3.5 bg-white border border-s-ink/10 rounded-xl text-sm font-body text-s-ink focus:outline-none focus:border-s-coral focus:ring-1 focus:ring-s-coral transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-s-coral hover:brightness-[1.06] text-white font-heading font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 mt-1"
        >
          {status === "loading" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t("hero_cta")
          )}
        </button>
        {status === "error" && (
          <p className="text-xs text-red-500 text-center font-body mt-2">{t("form_error")}</p>
        )}
      </form>
    </div>
  );
}
