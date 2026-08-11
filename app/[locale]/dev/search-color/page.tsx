/**
 * /dev/search-color , the search panel reads flat and grey, and what to do about it.
 *
 * Owner 2026-08-12, with four captures: "i wanna improve design sh looks flat n no color n the fur
 * sie ui too".
 *
 * measured: his IMG_7123 at 402x874pt carries 0.1% coloured pixels, mean saturation 0.001. The
 * screen is greyscale to within a rounding error. Its icon tiles measure a 48pt box on a 68pt row
 * pitch, and the live panel measures the same, so the mockup is built to those numbers rather than
 * to an eyeball.
 *
 * Nothing here is applied to the real panel. Mockup first, his call, then the change.
 *
 * exists-check: `npm run exists "search panel colour"` = 0; `npm run exists "category icon"` returns
 * graveyard hits only (makeup/waxing, the walk-in pill), neither touched here. The one thing that is
 * new is the comparison page itself; every treatment it proposes uses data or tokens that already
 * exist in the app.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import Panel from "./Panel";

export default function SearchColorPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        The search panel is grey, and the colour it is missing is already in the app
      </h1>
      <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-s-ink-2">
        Your screenshot of that list measures 0.1% coloured pixels. Not restrained, greyscale. Three
        changes below, each one rendering something the panel already has and currently throws away.
        Each is shown against what ships today, with real salons and the real feed.
      </p>
      <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-s-ink-2">
        One thing to know before you judge section A: the salon photos here are stock placeholders.
        The photo table has no rows, so every cover is an Unsplash seed image, the same ones the
        home page already shows. What A decides is whether the row carries the salon&apos;s photo at
        all. The picture it will carry the day a salon uploads one is not this picture.
      </p>
      <Panel />
    </main>
  );
}
