"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * EarningsCalculator — Treatwell-inspired hero/mid-page lead device for
 * /fuer-salons (B2B redesign, 2026-05-30). Category chips + 3 sliders → live
 * estimated monthly revenue uplift. Page-scoped client component. Copy via the
 * `fuersalons` i18n namespace (V3-D353).
 *
 * ⚠️ The formula is ILLUSTRATIVE (15% marketplace booking uplift + half of
 * no-shows recovered). Replace with real Solen benchmarks before relying on the
 * number publicly. Layer: n/a (page-scoped, not a registry primitive).
 */
const CATEGORY_KEYS = ["cat_coiffeur", "cat_barbershop", "cat_nails", "cat_spa", "cat_makeup"];

export function EarningsCalculator() {
  const t = useTranslations("fuersalons");
  const [cat, setCat] = useState(CATEGORY_KEYS[0]);
  const [appts, setAppts] = useState(40);
  const [ticket, setTicket] = useState(80);
  const [noShow, setNoShow] = useState(12);

  // Illustrative: 15% booking uplift + half of no-shows recovered.
  const monthly = appts * 4.33 * ticket;
  const upside = monthly * 0.15 + monthly * (noShow / 100) * 0.5;
  // Deterministic Swiss apostrophe grouping (NOT toLocaleString — Node/browser
  // locale data diverges → SSR hydration mismatch).
  const fmt = Math.round(upside).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");

  return (
    <div className="rounded-card-lg border border-s-border bg-s-bg-sunken p-7 md:p-10">
      <div className="grid grid-cols-1 gap-7 md:grid-cols-[1.2fr_0.9fr] md:items-center md:gap-10">
        <div>
          <p className="mb-0.5 font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
            {t("calc_your_salon")}
          </p>
          <div className="mb-5 mt-3.5 flex flex-wrap gap-2">
            {CATEGORY_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`rounded-pill border px-3.5 py-1.5 font-body text-[13px] transition-colors duration-150 ease-glide ${
                  cat === c
                    ? "border-s-ink bg-s-ink text-white"
                    : "border-s-border bg-white text-s-ink hover:border-s-ink"
                }`}
              >
                {t(c)}
              </button>
            ))}
          </div>

          <CalcField
            label={t("calc_appts")}
            value={String(appts)}
            min={10}
            max={120}
            cur={appts}
            onChange={setAppts}
          />
          <CalcField
            label={t("calc_ticket")}
            value={`CHF ${ticket}`}
            min={30}
            max={300}
            cur={ticket}
            onChange={setTicket}
          />
          <CalcField
            label={t("calc_noshow")}
            value={`${noShow}%`}
            min={0}
            max={30}
            cur={noShow}
            onChange={setNoShow}
          />
        </div>

        <div className="rounded-card border border-s-border bg-white p-6 text-center shadow-elevation-1">
          <div className="font-body text-[13px] text-s-ink-2">{t("calc_result_label")}</div>
          <div className="my-1.5 font-display text-[clamp(34px,5vw,46px)] font-bold leading-none tracking-[-0.03em] text-s-ink">
            CHF {fmt}
          </div>
          <a
            href="#anmelden"
            className="mt-1.5 inline-flex items-center justify-center rounded-btn bg-s-ink px-7 py-3 font-body text-[15px] font-medium tracking-[-0.005em] text-white transition-transform duration-200 ease-glide hover:-translate-y-[1px] active:scale-[0.97]"
          >
            {t("calc_cta")}
          </a>
          <div className="mt-2 inline-block rounded-md bg-s-warning-bg px-2 py-0.5 font-mono text-[11px] text-s-warning-text">
            {t("calc_note")}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalcField({
  label,
  value,
  min,
  max,
  cur,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  cur: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-[18px]">
      <label className="mb-2 flex justify-between font-body text-[13px] font-medium text-s-ink">
        <span>{label}</span>
        <b className="tabular-nums">{value}</b>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={cur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-s-accent"
        aria-label={label}
      />
    </div>
  );
}
