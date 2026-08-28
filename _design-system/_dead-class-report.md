# Dead-class report

Report-mode only unless run with --gate (scripts/detect-dead-class.mjs, npm run dead-class-check). Flags a literal class token that Tailwind's JIT compiled with zero matching CSS rule: it produces no CSS, and that fact alone. This never means the element carrying it is broken or unstyled, that depends on every other class on the same element, which no static scan can know. Worked example: `prose` and `prose-s-ink` are dead (no typography plugin installed) and cost nothing, because /en/privacy styles every element with its own explicit utilities regardless.

Generated: 2026-08-28T06:52:35.742Z
Real class names in the compiled stylesheet: 3072
Files scanned (app/+components/+components-legacy/+lib/, per tailwind.config.js content globs): 1261

## Summary

- Total dead classes, bucket A (near neighbour exists, gate-tripping): **91**
- Total dead classes, bucket B (no neighbour, informational only, never gates): 29
- Review by hand (glued to an interpolation or a concatenation, never a finding, never gates): 2
- Unreadable files or directories (never counted clean): 0

## Bucket A: near-miss, the typo shape (91)

The dead token shares a rare word (appears in at most 20 real classes) with a real class, or sits within edit distance 2 of one. This is the shape the no-scrollbar incident had: a name that reads exactly like a real utility. --gate trips on this bucket only.

- **app/[locale]/_components/homepage/Reviews.tsx:143** `scroll-snap-align-start` produces no CSS. Neighbours: `scroll-mt-24` (shares "scroll"), `scroll-mt-32` (shares "scroll"), `scroll-mt-[112px]` (shares "scroll"), `scroll-mt-[120px]` (shares "scroll"), `scroll-mt-[80px]` (shares "scroll"), +25 more
- **app/[locale]/dashboard/all-salons/page.tsx:205** `placeholder-dark/30` produces no CSS. Neighbours: `placeholder:font-medium` (shares "placeholder"), `placeholder:italic` (shares "placeholder"), `placeholder:text-s-accent/45` (shares "placeholder"), `placeholder:text-s-ink-2` (shares "placeholder"), `placeholder:text-s-ink-2/60` (shares "placeholder"), +10 more
- **app/[locale]/dashboard/all-users/page.tsx:186** `placeholder-dark/30` produces no CSS. Neighbours: `placeholder:font-medium` (shares "placeholder"), `placeholder:italic` (shares "placeholder"), `placeholder:text-s-accent/45` (shares "placeholder"), `placeholder:text-s-ink-2` (shares "placeholder"), `placeholder:text-s-ink-2/60` (shares "placeholder"), +10 more
- **app/[locale]/dashboard/badge-manager/page.tsx:455** `placeholder-dark/30` produces no CSS. Neighbours: `placeholder:font-medium` (shares "placeholder"), `placeholder:italic` (shares "placeholder"), `placeholder:text-s-accent/45` (shares "placeholder"), `placeholder:text-s-ink-2` (shares "placeholder"), `placeholder:text-s-ink-2/60` (shares "placeholder"), +10 more
- **app/[locale]/dashboard/content-editor/page.tsx:72** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **app/[locale]/dashboard/earnings/page.tsx:42** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **app/[locale]/dashboard/earnings/page.tsx:43** `bg-s-blue-subtle` produces no CSS. Neighbours: `border-blue-800` (shares "blue"), `border-s-blue/20` (shares "blue"), `border-l-s-blue` (shares "blue"), `bg-blue-100` (shares "blue"), `bg-blue-700` (shares "blue"), +9 more
- **app/[locale]/dashboard/earnings/page.tsx:43** `text-s-blue-text` produces no CSS. Neighbours: `border-blue-800` (shares "blue"), `border-s-blue/20` (shares "blue"), `border-l-s-blue` (shares "blue"), `bg-blue-100` (shares "blue"), `bg-blue-700` (shares "blue"), +8 more
- **app/[locale]/dashboard/platform-analytics/page.tsx:72** `font-data` produces no CSS. Neighbours: `data-text` (shares "data"), `data-[entering]:translate-y-full` (shares "data"), `data-[exiting]:translate-y-full` (shares "data"), `data-[entering]:scale-[0.95]` (shares "data"), `data-[exiting]:scale-[0.95]` (shares "data"), +14 more
- **app/[locale]/dashboard/settings/page.tsx:744** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **app/[locale]/dashboard/settings/page.tsx:836** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **app/[locale]/dashboard/settings/page.tsx:262** `translate-x-5.5` produces no CSS. Neighbours: `translate-x-0.5` (edit distance 1), `translate-x-5` (edit distance 2), `translate-y-3.5` (edit distance 2)
- **app/[locale]/dev/decision-radius/page.tsx:47** `radius-a` produces no CSS. Neighbours: `transition-[margin,border-radius]` (shares "radius")
- **app/[locale]/dev/decision-radius/page.tsx:65** `radius-b` produces no CSS. Neighbours: `transition-[margin,border-radius]` (shares "radius")
- **app/[locale]/dev/decision-shadow/page.tsx:43** `text-s-ink-3` produces no CSS. Neighbours: `text-s-ink` (edit distance 2), `text-s-ink-2` (edit distance 1), `text-s-ink/30` (edit distance 2), `text-s-ink/35` (edit distance 2), `text-s-ink/5` (edit distance 2)
- **app/[locale]/dev/mock-radius/page.tsx:48** `mock-radius-22` produces no CSS. Neighbours: `transition-[margin,border-radius]` (shares "radius")
- **app/[locale]/dev/mock-radius/page.tsx:48** `mock-radius-18` produces no CSS. Neighbours: `transition-[margin,border-radius]` (shares "radius")
- **app/[locale]/dev/terminal/b/B.tsx:920** `shadow-elevation` produces no CSS. Neighbours: `shadow-elevation-1` (shares "elevation"), `shadow-elevation-2` (shares "elevation"), `shadow-elevation-3` (shares "elevation"), `focus-within:shadow-elevation-3` (shares "elevation"), `hover:shadow-elevation-1` (shares "elevation"), +5 more
- **app/[locale]/help/[slug]/page.tsx:99** `prose` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/help/[slug]/page.tsx:99** `prose-sm` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/legal/privacy/page.tsx:11** `prose` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/legal/privacy/page.tsx:11** `prose-sm` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/legal/terms/page.tsx:11** `prose` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/legal/terms/page.tsx:11** `prose-sm` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/privacy/components/PrivacyContent.tsx:28** `prose` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/privacy/components/PrivacyContent.tsx:28** `prose-s-ink` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/privacy/components/PrivacySidebar.tsx:96** `custom-scrollbar` produces no CSS. Neighbours: `[scrollbar-width:none]` (shares "scrollbar"), `scrollbar-hide` (shares "scrollbar"), `scrollbar-none` (shares "scrollbar"), `[&::-webkit-scrollbar]:hidden` (shares "scrollbar")
- **app/[locale]/terms/components/TermsContent.tsx:30** `prose` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/terms/components/TermsContent.tsx:30** `prose-s-ink` produces no CSS. Neighbours: `prose-measure` (shares "prose")
- **app/[locale]/terms/components/TermsSidebar.tsx:108** `custom-scrollbar` produces no CSS. Neighbours: `[scrollbar-width:none]` (shares "scrollbar"), `scrollbar-hide` (shares "scrollbar"), `scrollbar-none` (shares "scrollbar"), `[&::-webkit-scrollbar]:hidden` (shares "scrollbar")
- **components/QuartierTile.tsx:36** `dark:bg-s-dm-raised` produces no CSS. Neighbours: `dark:border-s-coral/20` (shares "dark"), `dark:bg-s-amber/10` (shares "dark"), `dark:bg-s-blue/10` (shares "dark"), `dark:bg-s-coral/10` (shares "dark"), `dark:bg-s-sage/5` (shares "dark"), +4 more
- **components/WeatherBanner.tsx:100** `dark:text-s-dm-text/70` produces no CSS. Neighbours: `dark:border-s-coral/20` (shares "dark"), `dark:bg-s-amber/10` (shares "dark"), `dark:bg-s-blue/10` (shares "dark"), `dark:bg-s-coral/10` (shares "dark"), `dark:bg-s-sage/5` (shares "dark"), +1 more
- **components/WeatherBanner.tsx:105** `rounded-button` produces no CSS. Neighbours: `[&>button]:pointer-events-auto` (shares "button")
- **components/discovery/PriceRangeBadge.tsx:20** `dark:bg-s-dm-surface/90` produces no CSS. Neighbours: `dark:border-s-coral/20` (shares "dark"), `dark:bg-s-amber/10` (shares "dark"), `dark:bg-s-blue/10` (shares "dark"), `dark:bg-s-coral/10` (shares "dark"), `dark:bg-s-sage/5` (shares "dark"), +9 more
- **components/discovery/PriceRangeBadge.tsx:20** `dark:text-s-dm-text` produces no CSS. Neighbours: `dark:border-s-coral/20` (shares "dark"), `dark:bg-s-amber/10` (shares "dark"), `dark:bg-s-blue/10` (shares "dark"), `dark:bg-s-coral/10` (shares "dark"), `dark:bg-s-sage/5` (shares "dark"), +1 more
- **components/ui/BackgroundBlobs.tsx:12** `animate-blob-float` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BackgroundBlobs.tsx:13** `bg-s-amber/8` produces no CSS. Neighbours: `border-amber-800` (shares "amber"), `border-s-amber/20` (shares "amber"), `border-s-amber/30` (shares "amber"), `bg-amber-700` (shares "amber"), `bg-s-amber` (shares "amber"), +10 more
- **components/ui/BackgroundBlobs.tsx:13** `animate-blob-float-delayed` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BackgroundBlobs.tsx:20** `animate-blob-float` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BackgroundBlobs.tsx:21** `animate-blob-float-delayed` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BackgroundBlobs.tsx:22** `animate-blob-float` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BlobBackground.tsx:18** `animate-blob-float` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BlobBackground.tsx:21** `animate-blob-float-delayed` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BlobBackground.tsx:24** `animate-blob-float` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BlobBackground.tsx:27** `animate-blob-float-delayed` produces no CSS. Neighbours: `shadow-float` (shares "float"), `shadow-v5-float` (shares "float")
- **components/ui/BlobBackground.tsx:32** `grain-overlay` produces no CSS. Neighbours: `[body[data-overlay-open]_&]:hidden` (shares "overlay")
- **components-legacy/SalonCard.tsx:147** `ring-s-yellow/50` produces no CSS. Neighbours: `bg-yellow-100` (shares "yellow"), `text-yellow-800` (shares "yellow")
- **components-legacy/chat/ClientTags.tsx:128** `hover:bg-s-sand:bg-s-ink/60` produces no CSS. Neighbours: `bg-s-sand` (shares "sand"), `hover:bg-s-sand` (shares "sand")
- **components-legacy/dashboard/NotificationCenter.tsx:73** `hover:bg-s-bg-sunken:bg-white/[0.06]` produces no CSS. Neighbours: `border-s-bg-sunken` (shares "sunken"), `bg-s-bg-sunken` (shares "sunken"), `bg-s-bg-sunken/50` (shares "sunken"), `bg-s-bg-sunken/60` (shares "sunken"), `from-s-bg-sunken` (shares "sunken"), +10 more
- **components-legacy/dashboard/PromoManager.tsx:223** `hover:bg-s-sand:bg-white/15` produces no CSS. Neighbours: `bg-s-sand` (shares "sand"), `hover:bg-s-sand` (shares "sand")
- **components-legacy/dashboard/PromoManager.tsx:254** `hover:bg-s-bg-sunken:bg-white/10` produces no CSS. Neighbours: `border-s-bg-sunken` (shares "sunken"), `bg-s-bg-sunken` (shares "sunken"), `bg-s-bg-sunken/50` (shares "sunken"), `bg-s-bg-sunken/60` (shares "sunken"), `from-s-bg-sunken` (shares "sunken"), +10 more
- **components-legacy/dashboard/SalonAboutEditor.tsx:88** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/dashboard/SalonAboutEditor.tsx:95** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/dashboard/coiffeur/AllergyAlert.tsx:25** `bg-s-error/8` produces no CSS. Neighbours: `bg-s-error` (edit distance 2), `bg-s-error/10` (edit distance 2), `bg-s-error/5` (edit distance 1), `bg-s-error/80` (edit distance 1)
- **components-legacy/dashboard/coiffeur/AllergyAlert.tsx:37** `bg-s-error/12` produces no CSS. Neighbours: `bg-s-error/10` (edit distance 1), `bg-s-error/5` (edit distance 2), `bg-s-error/80` (edit distance 2)
- **components-legacy/dashboard/nail/AiArtGenerator.tsx:79** `bg-s-sand-subtle` produces no CSS. Neighbours: `bg-s-sand` (shares "sand"), `hover:bg-s-sand` (shares "sand"), `bg-s-amber-subtle` (shares "subtle")
- **components-legacy/dashboard/nail/DynamicPricingConfig.tsx:151** `bg-s-sage-subtle` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage"), +1 more
- **components-legacy/dashboard/nail/DynamicPricingConfig.tsx:153** `bg-s-coral-subtle` produces no CSS. Neighbours: `bg-s-amber-subtle` (shares "subtle")
- **components-legacy/dashboard/nail/InfillReminderConfig.tsx:114** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **components-legacy/dashboard/nail/StationManager.tsx:120** `bg-s-sand-subtle` produces no CSS. Neighbours: `bg-s-sand` (shares "sand"), `hover:bg-s-sand` (shares "sand"), `bg-s-amber-subtle` (shares "subtle")
- **components-legacy/dashboard/spa/RoomManager.tsx:319** `hover:bg-red-50:bg-red-900/20` produces no CSS. Neighbours: `bg-red-100` (shares "red"), `bg-red-50` (shares "red"), `bg-red-500/80` (shares "red"), `text-red-500` (shares "red"), `text-red-600` (shares "red"), +6 more
- **components-legacy/dashboard/spa/SpaIntake.tsx:21** `bg-s-sage-subtle` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage"), +1 more
- **components-legacy/dashboard/spa/WellnessJournal.tsx:264** `bg-s-sage-subtle` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage"), +1 more
- **components-legacy/dashboard/spa/WellnessJournal.tsx:264** `text-s-sage-text` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage")
- **components-legacy/dashboard/spa/WellnessJournal.tsx:266** `text-s-sage-text/50` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage")
- **components-legacy/dashboard/spa/WellnessJournal.tsx:266** `hover:text-s-sage-text` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage")
- **components-legacy/dashboard/spa/WellnessJournal.tsx:376** `bg-s-sage-subtle` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage"), +1 more
- **components-legacy/dashboard/spa/WellnessJournal.tsx:376** `text-s-sage-text` produces no CSS. Neighbours: `border-s-sage/20` (shares "sage"), `border-l-s-sage` (shares "sage"), `bg-s-sage/10` (shares "sage"), `text-s-sage` (shares "sage"), `dark:bg-s-sage/5` (shares "sage")
- **components-legacy/discovery/DetailPage.tsx:211** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/discovery/DetailPage.tsx:283** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/discovery/DetailPage.tsx:297** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/discovery/DetailPage.tsx:306** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/discovery/DetailPage.tsx:442** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/discovery/DiscoveryAdmin.tsx:339** `bg-s-yellow-subtle` produces no CSS. Neighbours: `bg-yellow-100` (shares "yellow"), `text-yellow-800` (shares "yellow"), `bg-s-amber-subtle` (shares "subtle")
- **components-legacy/discovery/DiscoveryAdmin.tsx:339** `text-s-yellow-text` produces no CSS. Neighbours: `bg-yellow-100` (shares "yellow"), `text-yellow-800` (shares "yellow")
- **components-legacy/discovery/FilterDrawer.tsx:78** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/discovery/MasonryGrid.tsx:24** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/discovery/SaveToBoardSheet.tsx:86** `fade-in` produces no CSS. Neighbours: `animate-fade-in-up` (shares "fade"), `css-enter-fade` (shares "fade"), `scroll-fade-right` (shares "fade")
- **components-legacy/editor/EditPanel.tsx:426** `pl-5.5` produces no CSS. Neighbours: `ml-0.5` (edit distance 2), `ml-1.5` (edit distance 2), `p-0.5` (edit distance 2), `p-1.5` (edit distance 2), `p-2.5` (edit distance 2), +23 more
- **components-legacy/editor/EditPanel.tsx:430** `pl-5.5` produces no CSS. Neighbours: `ml-0.5` (edit distance 2), `ml-1.5` (edit distance 2), `p-0.5` (edit distance 2), `p-1.5` (edit distance 2), `p-2.5` (edit distance 2), +23 more
- **components-legacy/editor/EditPanel.tsx:436** `pl-5.5` produces no CSS. Neighbours: `ml-0.5` (edit distance 2), `ml-1.5` (edit distance 2), `p-0.5` (edit distance 2), `p-1.5` (edit distance 2), `p-2.5` (edit distance 2), +23 more
- **components-legacy/editor/EditPanel.tsx:408** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **components-legacy/editor/EditPanel.tsx:415** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **components-legacy/editor/RequestList.tsx:220** `pl-5.5` produces no CSS. Neighbours: `ml-0.5` (edit distance 2), `ml-1.5` (edit distance 2), `p-0.5` (edit distance 2), `p-1.5` (edit distance 2), `p-2.5` (edit distance 2), +23 more
- **components-legacy/editor/RequestList.tsx:227** `pl-5.5` produces no CSS. Neighbours: `ml-0.5` (edit distance 2), `ml-1.5` (edit distance 2), `p-0.5` (edit distance 2), `p-1.5` (edit distance 2), `p-2.5` (edit distance 2), +23 more
- **components-legacy/editor/RequestList.tsx:289** `pl-5.5` produces no CSS. Neighbours: `ml-0.5` (edit distance 2), `ml-1.5` (edit distance 2), `p-0.5` (edit distance 2), `p-1.5` (edit distance 2), `p-2.5` (edit distance 2), +23 more
- **components-legacy/editor/RequestList.tsx:205** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **components-legacy/editor/RequestList.tsx:212** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **components-legacy/nail/AllergyWarning.tsx:49** `text-s-star-text` produces no CSS. Neighbours: `bg-s-star` (shares "star"), `bg-s-star/15` (shares "star"), `fill-s-star` (shares "star"), `text-s-star` (shares "star"), `text-s-star/80` (shares "star"), +1 more
- **components-legacy/ui/CategoryTree.tsx:113** `hover:bg-s-bg-surface:bg-white/5` produces no CSS. Neighbours: `bg-[--surface]` (shares "surface"), `bg-s-bg-surface` (shares "surface"), `bg-s-bg-surface/50` (shares "surface"), `bg-s-bg-surface/80` (shares "surface"), `from-s-bg-surface` (shares "surface"), +3 more
- **components-legacy/ui/LanguageSwitcher.tsx:158** `hover:bg-s-bg-surface:bg-white/5` produces no CSS. Neighbours: `bg-[--surface]` (shares "surface"), `bg-s-bg-surface` (shares "surface"), `bg-s-bg-surface/50` (shares "surface"), `bg-s-bg-surface/80` (shares "surface"), `from-s-bg-surface` (shares "surface"), +3 more

## Bucket B: no neighbour, lower confidence (29)

No real class shares a rare word or sits within edit distance 2. Could be a hook or a script querying by name, a class from a third-party stylesheet, a disabled-plugin class (see the prose worked example above), or a genuinely dead name with no obvious fix. Reported plainly, never trips --gate.

- **app/[locale]/_components/homepage/AtmosphereBlobs.tsx:77** `atm-blob` produces no CSS. No neighbour found.
- **app/[locale]/_components/homepage/HeroHeadline.tsx:124** `hover:text-s-ink-mid` produces no CSS. No neighbour found.
- **app/[locale]/dashboard/admin-sandbox/page.tsx:462** `hover:text-s-coral:text-s-coral` produces no CSS. No neighbour found.
- **app/[locale]/dashboard/discovery-admin/page.tsx:56** `hover:bg-s-ink/10:bg-white/10` produces no CSS. No neighbour found.
- **app/[locale]/dev/mock-backbutton/page.tsx:53** `mock-backbutton-44` produces no CSS. No neighbour found.
- **app/[locale]/dev/mock-disabled/page.tsx:119** `mock-disabled-50` produces no CSS. No neighbour found.
- **app/[locale]/dev/mock-disabled/page.tsx:119** `mock-disabled-40` produces no CSS. No neighbour found.
- **app/[locale]/dev/mock-shadow/page.tsx:53** `mock-shadow-gesetz` produces no CSS. No neighbour found.
- **components-legacy/coiffeur/AiMatcherModal.tsx:145** `hover:bg-s-ink/5:bg-white/5` produces no CSS. No neighbour found.
- **components-legacy/dashboard/CommandPalette.tsx:123** `hover:bg-s-ink/5:bg-white/5` produces no CSS. No neighbour found.
- **components-legacy/dashboard/SalonAboutEditor.tsx:88** `slide-in-from-top-1` produces no CSS. No neighbour found.
- **components-legacy/dashboard/SalonAboutEditor.tsx:95** `slide-in-from-top-1` produces no CSS. No neighbour found.
- **components-legacy/dashboard/nail/DynamicPricingConfig.tsx:224** `hover:bg-s-error-bg:bg-s-error/10` produces no CSS. No neighbour found.
- **components-legacy/discovery/DetailPage.tsx:284** `slide-in-from-bottom` produces no CSS. No neighbour found.
- **components-legacy/discovery/DetailPage.tsx:306** `slide-in-from-bottom-4` produces no CSS. No neighbour found.
- **components-legacy/discovery/DiscoveryAdmin.tsx:240** `hover:border-s-border:border-white/10` produces no CSS. No neighbour found.
- **components-legacy/discovery/FilterDrawer.tsx:79** `slide-in-from-bottom` produces no CSS. No neighbour found.
- **components-legacy/discovery/SaveToBoardSheet.tsx:87** `slide-in-from-bottom` produces no CSS. No neighbour found.
- **components-legacy/nail/HandChart.tsx:116** `hover:bg-s-ink/5:bg-white/5` produces no CSS. No neighbour found.
- **components-legacy/nail/HandChart.tsx:147** `hover:bg-s-ink/5:bg-white/5` produces no CSS. No neighbour found.
- **components-legacy/nail/InspoBoard.tsx:113** `hover:bg-s-ink/5:bg-white/5` produces no CSS. No neighbour found.
- **components-legacy/onboarding/steps/PaymentsStep.tsx:92** `hover:border-s-border:border-white/20` produces no CSS. No neighbour found.
- **components-legacy/salon/ServiceCategoryFilter.tsx:39** `hover:border-s-ink/20:border-white/20` produces no CSS. No neighbour found.
- **components-legacy/salon/ServiceCategoryFilter.tsx:51** `hover:border-s-ink/20:border-white/20` produces no CSS. No neighbour found.
- **components-legacy/search/SearchCriteriaChips.tsx:60** `hover:bg-s-ink/10:bg-white/10` produces no CSS. No neighbour found.
- **components-legacy/shared/ClientSelectorDropdown.tsx:107** `hover:bg-s-ink/5:bg-white/5` produces no CSS. No neighbour found.
- **components-legacy/ui/PWAInstallPrompt.tsx:65** `slide-in-from-bottom-4` produces no CSS. No neighbour found.
- **components-legacy/ui/ScrollableFilterRow.tsx:105** `hover:text-s-accent:text-s-accent` produces no CSS. No neighbour found.
- **components-legacy/ui/ScrollableFilterRow.tsx:128** `hover:text-s-accent:text-s-accent` produces no CSS. No neighbour found.

## Review by hand (2)

Never a finding, never counted toward either bucket, never trips --gate. A token glued (no separating whitespace) to a template interpolation or a string concatenation cannot be statically resolved. Saying nothing here would be indistinguishable from clean, which is worse than naming the file and line and asking for a human look.

- **app/[locale]/dashboard/bookings/page.tsx:281** `active:ease-glide`: adjacent to a template literal interpolation (${...}) with no separating whitespace, cannot statically resolve this token
- **components-legacy/booking/PayConfirmStep.tsx:678** `flex-1`: adjacent to a template literal interpolation (${...}) with no separating whitespace, cannot statically resolve this token

## Unreadable files or directories (0)

Never counted clean. A path this detector could not open (a file OR a directory it could not list) was never actually checked, so the whole run exits 2, both in report mode and --gate mode: nothing here is proven either way.

_none_

## Tunables

- `RARE_WORD_THRESHOLD` / `EDIT_DISTANCE_THRESHOLD` (top of this file): bucket A neighbour thresholds, see the header note for the measured word-frequency reasoning.
- `isExcludedOperand` / `COMPARISON_OPERAND_RE` / `CASE_KEYWORD_RE`: the cn()/clsx() comparison-operand exclusion, see the header note for the real DashboardUI.tsx example.
- `findExcludedCallRanges`: the cn()/clsx() object-key trap's other shape, a string argument nested inside a call to some OTHER function (butterPress/chipClass real examples).
- `findLiteralSpans` / `findTemplateSpans`: the real class-name positions, including recursive interpolation resolution.
- `markConcatJoins`: the string-concatenation fusion check.
- Scan roots: `app/` (+ .mdx), `components/`, `components-legacy/`, `lib/`, per tailwind.config.js content globs.
