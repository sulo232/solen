/**
 * Exists-check: `npm run exists decision-mockup` -> 1 REMOVED hit (bundles, unrelated).
 * `npm run exists TextInput` / `Switch` / `Checkbox` / `Radio` -> all real primitives
 * at app/[locale]/_components/primitives/{TextInput,Switch,Checkbox,Radio}.tsx.
 * Net-new: this decision route (no dev route compares disabled-opacity values today).
 *
 * lang-ok: owner-facing decision mockup for a direct German-speaking owner review
 * (task spec: "German copy only (no EN)"), not an AI-only review artifact.
 *
 * no-focus-ring-ok: CTA_CLASS below is a byte-for-byte quote of the real booking
 * commit button (components-legacy/booking/PayConfirmStep.tsx:604), including its
 * `focus-visible:ring-*` classes, because the task requires "the exact class string."
 * The button here is always `disabled`, so `:focus-visible` can never apply (disabled
 * elements cannot receive focus) - the ring is inert quoted markup, not a new addition.
 *
 * Decision: disabled-state opacity. Switch/Checkbox/Radio ship `opacity-40` (each
 * component's own disabled className, applied unconditionally in JS, not a Tailwind
 * `disabled:` variant). The design contract's locked "disabled" row in CLAUDE.md is
 * `opacity-50 cursor-not-allowed`, which TextInput and the booking commit CTA
 * (components-legacy/booking/PayConfirmStep.tsx:604, `disabled:opacity-50`) already
 * ship. No primitive file is edited; each column forces its opacity via a `className`
 * override passed into the primitive (Tailwind `!` important beats the primitive's
 * own baked-in value regardless of class order, since `cn()` in lib/utils.ts is a
 * plain clsx join, not tailwind-merge).
 */
import { notFound } from "next/navigation";
import { TextInput, Switch, Checkbox, Radio } from "@/app/[locale]/_components/primitives";
import { DecisionChip, DecisionCaption, DecisionHeader } from "../_shared/DecisionChip";

// The exact commit-CTA class string, copied verbatim from
// components-legacy/booking/PayConfirmStep.tsx:604 (the real booking "Buchen" button).
const CTA_CLASS =
  "w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-full bg-s-ink text-white font-body text-[15px] font-semibold transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2";

function DisabledColumn({ letter, value, opacityClass }: { letter: "A" | "B"; value: string; opacityClass: string }) {
  return (
    <div className="flex-1 min-w-0">
      <DecisionChip letter={letter} value={value} />
      <div className="mt-4 space-y-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-s-ink-2">Vorname</label>
          <TextInput defaultValue="Jasmin" disabled className={opacityClass} />
        </div>

        <Switch label="Erinnerung per SMS" defaultChecked disabled className={opacityClass} />

        <Checkbox defaultChecked disabled className={opacityClass}>
          AGB akzeptiert
        </Checkbox>

        <Radio name={`sort-${letter}`} defaultChecked disabled className={opacityClass}>
          Am nächsten Termin zuerst
        </Radio>

        <button type="button" disabled className={`${CTA_CLASS} ${opacityClass}`}>
          Buchen
        </button>
      </div>
    </div>
  );
}

export default function DecisionDisabledPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <DecisionHeader
        title="Deaktiviert-Zustand: Deckkraft"
        decision="opacity-40 (Switch/Checkbox/Radio, wie ausgeliefert) vs. opacity-50 (gesperrte Vorgabe, wie TextInput + Buchen-Button)."
      />
      <div className="flex gap-4 p-4">
        <DisabledColumn letter="A" value="opacity-40" opacityClass="disabled:!opacity-40" />
        <div className="w-px shrink-0 bg-s-border" />
        <DisabledColumn letter="B" value="opacity-50" opacityClass="disabled:!opacity-50" />
      </div>
      <div className="px-4">
        <DecisionCaption>
          Gleiche Felder, gleiche Beschriftung in beiden Spalten. Keine der Primitive-Dateien
          wurde verändert, die Deckkraft kommt über eine Wrapper-Klasse.
        </DecisionCaption>
      </div>
      <div className="h-8" />
    </div>
  );
}
