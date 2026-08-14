/**
 * /dev/mock/category-morph , three directions for the category row, tappable.
 *
 * Owner 2026-08-12: "instead of pills like circle n once u click then it bcms pill all morphism and
 * also the icon i want it like abit glare yk like 3d liquid style icons yk".
 *
 * Three DISTINCT directions rather than one with tweaks, all on the real categories and the real
 * tokens. Tap any circle and it morphs into its pill; the one that was open closes.
 *
 * lang-ok: the category labels come from the app's own constant; the only strings this route owns
 * are the three direction names, in English.
 *
 * exists-check: `npm run exists "category morph"` = 0 this turn.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import Variants from "./Variants";

export default function CategoryMorphPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      <style>{`
        body > header, header[class*="sticky"], footer,
        [class*="fixed"][class*="bottom-"] { display: none !important; }
        main > section:has(input[type="email"]) { display: none !important; }
      `}</style>
      <div className="px-4 pb-16 pt-8">
        <Variants />
      </div>
    </div>
  );
}
