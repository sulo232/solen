"use client";

// Mockup-scope: whole-page
// panel-ok: a floating control plus a stylesheet, not a page preview of its own.
// Exists-check: `npm run exists variant-switch` found `VariantSwitcher` in this same folder and it
// is REUSED below rather than rebuilt. Nothing else here duplicates it: this adds the treatments,
// the switcher already handled swapping `?v=` on the current path.
//
// WHY THIS SHAPE. This project already wrote down what a decision mockup must be, after a round of
// them were built as isolated component panels and rejected: a preview of the WHOLE real page with
// only the treatment applied, switchable by `?v=` on that same page. So instead of yet another
// stand-in screen, any real screen can now be opened with `?v=anchor` and it restyles itself in
// place. Same four directions he already saw on search results.
//
// measure-ok: the sizes below are the ones measured with getComputedStyle on the built site at
// 390x844 on 2026-08-23, recorded in _plans/DESIGN_UNIFY_2026-08-23.md. The store page he likes
// leads at 30px and 2.31x its smallest text with 13% of its words bold. Inspo leads at 15px and
// 1.25x. Help and login carry 18% and 27% bold. These treatments move a screen toward the first.
//
// It renders NOTHING unless `?v=` is in the address, and the server only mounts it on the preview
// machine, so no real visitor can ever reach it.

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { VariantSwitcher } from "./VariantSwitcher";

const CSS: Record<string, string> = {
  now: "",
  anchor: `
    main h1, main h2 { font-size: 30px !important; line-height: 1.12 !important; letter-spacing: -0.02em !important; }
    main [class*="text-[15px]"], main [class*="text-[16px]"], main h3 {
      font-size: 22px !important; line-height: 1.2 !important; letter-spacing: -0.015em !important;
    }
    main [class*="text-[12px]"], main [class*="text-[13px]"] { font-size: 13px !important; }
    main [class*="tabular"] { font-weight: 600 !important; }
  `,
  photo: `
    main [class*="aspect-[5/4]"], main [class*="aspect-[4/3]"], main [class*="aspect-video"],
    main [class*="aspect-square"] { aspect-ratio: 4 / 5 !important; }
    main [class*="shadow-whisper"], main [class*="shadow-elevation"] { box-shadow: none !important; }
    main [class*="text-[12px]"] { font-size: 13px !important; }
  `,
  both: `
    main h1, main h2 { font-size: 30px !important; line-height: 1.12 !important; letter-spacing: -0.02em !important; }
    main [class*="text-[15px]"], main [class*="text-[16px]"], main h3 {
      font-size: 22px !important; line-height: 1.2 !important; letter-spacing: -0.015em !important;
    }
    main [class*="text-[12px]"], main [class*="text-[13px]"] { font-size: 13px !important; }
    main [class*="tabular"] { font-weight: 600 !important; }
    main [class*="aspect-[5/4]"], main [class*="aspect-[4/3]"], main [class*="aspect-video"],
    main [class*="aspect-square"] { aspect-ratio: 4 / 5 !important; }
    main [class*="shadow-whisper"], main [class*="shadow-elevation"] { box-shadow: none !important; }
    main div[class*="rounded-"]:not([class*="rounded-full"]) { border-radius: 20px !important; }
  `,
};

const OPTIONS = [
  { value: "now", label: "Now" },
  { value: "anchor", label: "Bigger headings" },
  { value: "photo", label: "Taller photos" },
  { value: "both", label: "Both" },
];

export function LookPreview() {
  const params = useSearchParams();
  const v = params?.get("v");
  if (!v || !(v in CSS)) return null;
  return (
    <>
      {CSS[v] ? <style dangerouslySetInnerHTML={{ __html: CSS[v] }} /> : null}
      <VariantSwitcher options={OPTIONS} bottomClassName="bottom-20" />
    </>
  );
}
