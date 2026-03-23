"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

interface ToSCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const LABELS: Record<string, string> = {
  de: "Ich akzeptiere die",
  en: "I accept the",
  fr: "J'accepte les",
  it: "Accetto i",
};

const TOS_LABELS: Record<string, string> = {
  de: "Nutzungsbedingungen",
  en: "Terms of Service",
  fr: "Conditions d'utilisation",
  it: "Termini di servizio",
};

export default function ToSCheckbox({ checked, onChange }: ToSCheckboxProps) {
  const locale = useLocale();

  return (
    <label className="flex items-start gap-2 text-xs text-s-ink/60 dark:text-s-dm-text/60 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded accent-s-coral"
      />
      <span>
        {LABELS[locale] ?? LABELS.de}{" "}
        <Link href={`/${locale}/terms/discovery`} className="underline hover:text-s-coral" target="_blank">
          {TOS_LABELS[locale] ?? TOS_LABELS.de}
        </Link>
      </span>
    </label>
  );
}
