# Solen — Generation Tools & Asset Sources

> Every AI agent MUST read this before generating or sourcing any visual asset.
> If an asset is missing from the expected folder, **tell the user it's missing** — do NOT attempt to generate it programmatically without the right tool.

---

## 📁 Asset Folder Structure

```
public/
├── icons/
│   ├── category/          ← Category icons (SVG) — Coiffeur, Nails, Barber, Makeup, Spa, Waxing
│   │   ├── coiffeur.svg
│   │   ├── nails.svg
│   │   ├── barber.svg
│   │   ├── makeup.svg
│   │   ├── spa.svg
│   │   └── waxing.svg
│   └── ui/                ← Custom UI SVG icons (NOT lucide-react)
├── animations/            ← Lottie JSON animation files
│   ├── loading-*.json
│   ├── empty-*.json
│   └── success-*.json
└── illustrations/         ← One-off brand illustrations, hero graphics
```

---

## 🎨 What Tool For What

### Category Icons (Coiffeur, Nails, Barber, Makeup, Spa, Waxing)
**Tool: Recraft.ai**
- API endpoint: `https://external.api.recraft.ai/v1/images/generations`
- API key: `RECRAFT_API_KEY` in `.env.local`
- Style: `vector_illustration`
- Returns: real SVG files with bezier paths
- Output folder: `public/icons/category/[name].svg`
- **Do NOT** generate these with Figma Plugin API or by writing bezier coords manually in code — the output will be garbage
- **Prompt engineering required** — write prompts in `_rules/GENERATION_TOOLS.md` (see section below) before generating

### UI Icons (buttons, nav, actions)
**Tool: lucide-react** (already installed)
- Import: `import { Heart, Search, Star } from 'lucide-react'`
- NEVER use emoji, heroicons, fontawesome, or custom SVG for UI icons
- If a specific icon doesn't exist in lucide → ask the user before using an alternative

### Loading / Empty State / Success Animations
**Tool: LottieFiles**
- Website: lottiefiles.com (free + premium)
- Download as `.json` (Lottie format)
- Output folder: `public/animations/[name].json`
- React package: `lottie-react` (install if not present: `npm install lottie-react`)
- Usage: `<Lottie animationData={data} loop={true} />`
- Preferred animation style: warm, minimal, no blue/cool tones

### Page Transitions & Hover Animations
**Tool: Framer Motion** (already installed)
- Use for: card hovers, section reveals, stagger animations, modal entrances
- NOT for: loading states, empty states, success confirmations (use Lottie for those)

### Interactive / State-Machine Animations
**Tool: Rive**
- Use for: animated category icons on hover, complex interactive UI
- Only if Lottie is insufficient
- Output: `.riv` files in `public/animations/`

### Brand Illustrations (hero graphics, feature sections)
**Tool: Recraft.ai** or **human designer**
- For one-off illustrations that need to match brand exactly → hire a designer
- For generated illustrations → Recraft.ai with `digital_illustration` style
- Output folder: `public/illustrations/`

**Prompt contract (guideline — not a locked template):**
- **Constants (never vary):** terracotta coral `#E8624A` line weight, cream `#FAF6EF` background, 2px stroke weight, rounded line caps, centered composition, transparent where needed, no text.
- **Variables (per illustration):** subject, composition framing, secondary accent color drawn from the matching reserved palette (`s-plum` for barbershop, `s-sage` for spa, `s-sand` for makeup/partnership, `s-yellow` for achievement).
- **Rule:** the constants must appear verbatim in every prompt so the output stays cohesive across categories. The first person to skip a constant accidentally sets a new aesthetic — don't be that person.

### Photos & Salon Images
**Tool: Unsplash API** (already integrated) or licensed stock
- Never use AI-generated photorealistic people in production
- Salon photos come from real salon onboarding (Supabase storage)

### AI Nail Art (admin tool)
**Tool: fal.ai** (already integrated)
- Already built in `lib/nail/ai-prompts.ts`
- Do NOT change this integration

---

## ✍️ Recraft Prompt Engineering Guide

Before generating any icon, write the prompt here. Bad prompts = generic garbage.

### What makes a good Recraft icon prompt:
1. **Name the object specifically** — "nail polish bottle" not "beauty icon"
2. **Describe the style** — "flat vector illustration, clean geometric shapes, minimal detail"
3. **Specify colors explicitly** — "terracotta coral #E8624A as primary color, dark #1A0806 for details"
4. **Set the background** — "transparent background, no background"
5. **Exclude noise** — "no text, no labels, no shadows, no gradients, single object centered"
6. **Size/composition** — "square composition, object fills 80% of frame"

### Approved Prompts (use these — do not invent new ones without testing)

| Icon | Prompt |
|------|--------|
| Coiffeur | `professional hairdressing scissors icon, flat vector illustration, terracotta coral color #E8624A, clean geometric shapes, transparent background, no text, no shadows, centered composition` |
| Nails | `nail polish bottle icon, flat vector illustration, terracotta coral color #E8624A, clean minimal shapes, transparent background, no text, no shadows, centered` |
| Barber | `straight razor barber icon, flat vector illustration, dark handle with cream blade, terracotta coral accent, clean geometric, transparent background, no text, centered` |
| Makeup | `lipstick tube icon, flat vector illustration, terracotta coral color #E8624A, elegant minimal shapes, transparent background, no text, no shadows, centered` |
| Spa | `lotus flower icon, flat vector illustration, terracotta coral petals #E8624A, amber golden center, clean minimal, transparent background, no text, centered` |
| Waxing | `wax spatula stick icon, beauty depilation, flat vector illustration, terracotta coral color #E8624A, clean minimal shapes, transparent background, no text, centered` |

### If you get a bad result:
- Add: `"flat design, no shading, no gradients, 2 colors maximum"`
- Or: `"icon design, app icon style, simple bold shapes"`
- Or: try `"style": "icon"` instead of `"vector_illustration"`

---

## 🚨 Asset Checklist — Check Before Coding

When a component needs an icon/animation, run this check:

```
Category icon needed?
  → Check public/icons/category/[name].svg exists
  → If MISSING: tell user "I need [name].svg in public/icons/category/ — generate it with Recraft using the approved prompt in _rules/GENERATION_TOOLS.md"
  → NEVER generate it with code / Figma API blindly

Animation needed?
  → Check public/animations/[name].json exists  
  → If MISSING: tell user "I need a Lottie animation for [state] — download one from lottiefiles.com and save it as public/animations/[name].json"

UI icon needed?
  → Use lucide-react — check https://lucide.dev/icons/ for the right name
```

---

## 🔑 API Keys (store in .env.local, NEVER commit)

| Service | Env Var | Purpose |
|---------|---------|---------|
| Recraft.ai | `RECRAFT_API_KEY` | Icon & illustration generation |
| fal.ai | `FAL_KEY` | Nail art AI generation |
| Unsplash | `UNSPLASH_ACCESS_KEY` | Stock photos |
