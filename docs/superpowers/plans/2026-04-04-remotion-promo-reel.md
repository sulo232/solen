# Remotion Promo Reel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 15-second 1080×1920 Solen.ch promo video in Remotion with 4 scenes: logo reveal, headline slam, service cards, and CTA end card.

**Architecture:** Standalone Remotion project in `solen/remotion/` subfolder. Each scene is an isolated React component. The root `PromoReel` composition sequences them using Remotion's `<Sequence>` — no external animation libraries, only Remotion's `spring()` and `interpolate()`.

**Tech Stack:** Remotion 4, React 19, TypeScript 5, `@remotion/google-fonts` for Bebas Neue + DM Sans.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `remotion/package.json` | Create | Deps + scripts |
| `remotion/tsconfig.json` | Create | TypeScript config for Remotion |
| `remotion/remotion.config.ts` | Create | Remotion output settings |
| `remotion/src/index.ts` | Create | Calls `registerRoot()` |
| `remotion/src/Root.tsx` | Create | Declares the `PromoReel` composition |
| `remotion/src/tokens.ts` | Create | Brand colors + font names |
| `remotion/src/compositions/PromoReel/index.tsx` | Create | Sequences all 4 scenes |
| `remotion/src/compositions/PromoReel/Scene1Logo.tsx` | Create | Logo reveal (frames 0–90 relative) |
| `remotion/src/compositions/PromoReel/Scene2Headline.tsx` | Create | Headline slam (frames 0–120 relative) |
| `remotion/src/compositions/PromoReel/Scene3Cards.tsx` | Create | Service cards (frames 0–150 relative) |
| `remotion/src/compositions/PromoReel/Scene4CTA.tsx` | Create | CTA end card (frames 0–90 relative) |

> Note: all scene components receive frames **relative to their own `<Sequence>`** start — `useCurrentFrame()` always starts at 0 inside a sequence.

---

## Task 1: Scaffold project files

**Files:**
- Create: `remotion/package.json`
- Create: `remotion/tsconfig.json`
- Create: `remotion/remotion.config.ts`

- [ ] **Step 1: Create `remotion/package.json`**

```json
{
  "name": "solen-remotion",
  "version": "1.0.0",
  "scripts": {
    "dev": "npx remotion studio",
    "render": "npx remotion render PromoReel out/PromoReel.mp4",
    "build": "npx remotion render PromoReel out/PromoReel.mp4 --overwrite"
  },
  "dependencies": {
    "remotion": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/google-fonts": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 2: Create `remotion/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `remotion/remotion.config.ts`**

```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

- [ ] **Step 4: Commit**

```bash
git add remotion/package.json remotion/tsconfig.json remotion/remotion.config.ts
git commit -m "feat(remotion): scaffold project config files"
```

---

## Task 2: Install dependencies

**Files:** `remotion/node_modules/` (generated)

- [ ] **Step 1: Install**

```bash
cd remotion
npm install
```

Expected: `added N packages` with no errors. A `node_modules/` folder appears.

- [ ] **Step 2: Verify Remotion CLI is available**

```bash
npx remotion --version
```

Expected output: `4.x.x` (any 4.x version).

- [ ] **Step 3: Commit lock file**

```bash
cd ..
git add remotion/package-lock.json
git commit -m "feat(remotion): add package-lock.json"
```

---

## Task 3: Brand tokens + entry point

**Files:**
- Create: `remotion/src/tokens.ts`
- Create: `remotion/src/index.ts`
- Create: `remotion/src/Root.tsx`
- Create: `remotion/src/compositions/PromoReel/index.tsx` (stub)

- [ ] **Step 1: Create `remotion/src/tokens.ts`**

```ts
export const tokens = {
  coral: '#E8624A',
  cream: '#FAF6EF',
  ink:   '#1A1209',
  white: '#FFFFFF',
  fontDisplay: 'Bebas Neue',
  fontBody:    'DM Sans',
} as const;
```

- [ ] **Step 2: Create stub `remotion/src/compositions/PromoReel/index.tsx`**

This is a placeholder so Root.tsx can import it without errors. Will be fleshed out in Task 7.

```tsx
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { tokens } from '../../tokens';

export const PromoReel: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: tokens.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: tokens.fontDisplay,
        fontSize: 80,
        color: tokens.ink,
      }}
    >
      Frame {frame}
    </div>
  );
};
```

- [ ] **Step 3: Create `remotion/src/Root.tsx`**

```tsx
import React from 'react';
import { Composition } from 'remotion';
import { PromoReel } from './compositions/PromoReel';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PromoReel"
      component={PromoReel}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
```

- [ ] **Step 4: Create `remotion/src/index.ts`**

```ts
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

- [ ] **Step 5: Verify Remotion Studio opens**

```bash
cd remotion
npm run dev
```

Expected: browser opens at `http://localhost:3000`, shows a cream rectangle with "Frame 0" text and a composition named "PromoReel" in the left panel. Kill the server with Ctrl+C after confirming.

- [ ] **Step 6: Commit**

```bash
cd ..
git add remotion/src/
git commit -m "feat(remotion): add tokens, root, and PromoReel stub"
```

---

## Task 4: Scene 1 — Logo Reveal

**Files:**
- Create: `remotion/src/compositions/PromoReel/Scene1Logo.tsx`

- [ ] **Step 1: Create `remotion/src/compositions/PromoReel/Scene1Logo.tsx`**

```tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont, fontFamily as bebasFamily } from '@remotion/google-fonts/BebasNeue';
import { tokens } from '../../tokens';

loadFont();

export const Scene1Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wordmark: spring scale + fade in
  const scale = spring({
    frame,
    fps,
    config: { stiffness: 200, damping: 20 },
    from: 0.6,
    to: 1.0,
  });
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Coral underline wipes in from left (frames 30–60)
  const underlineWidth = interpolate(frame, [30, 60], [0, 220], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: tokens.cream,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ transform: `scale(${scale})`, opacity }}>
        <div
          style={{
            fontFamily: bebasFamily,
            fontSize: 120,
            color: tokens.ink,
            letterSpacing: 12,
            lineHeight: 1,
          }}
        >
          SOLEN
        </div>
        <div
          style={{
            height: 5,
            width: underlineWidth,
            backgroundColor: tokens.coral,
            marginTop: 10,
          }}
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Update PromoReel stub to show Scene 1**

Replace the contents of `remotion/src/compositions/PromoReel/index.tsx` with:

```tsx
import React from 'react';
import { Sequence } from 'remotion';
import { Scene1Logo } from './Scene1Logo';

export const PromoReel: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={90}>
        <Scene1Logo />
      </Sequence>
    </>
  );
};
```

- [ ] **Step 3: Preview in Remotion Studio**

```bash
cd remotion
npm run dev
```

Expected: scrub frames 0–89. You should see a cream background, "SOLEN" in Bebas Neue scaling up from small, then a coral line wiping in underneath. Kill server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd ..
git add remotion/src/compositions/PromoReel/
git commit -m "feat(remotion): add Scene1Logo — logo reveal"
```

---

## Task 5: Scene 2 — Headline Slam

**Files:**
- Create: `remotion/src/compositions/PromoReel/Scene2Headline.tsx`
- Modify: `remotion/src/compositions/PromoReel/index.tsx`

- [ ] **Step 1: Create `remotion/src/compositions/PromoReel/Scene2Headline.tsx`**

```tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont, fontFamily as bebasFamily } from '@remotion/google-fonts/BebasNeue';
import { tokens } from '../../tokens';

loadFont();

const Line: React.FC<{
  text: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ text, delay, frame, fps }) => {
  const localFrame = Math.max(0, frame - delay);
  const y = spring({
    frame: localFrame,
    fps,
    config: { stiffness: 300, damping: 20 },
    from: 80,
    to: 0,
  });
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontFamily: bebasFamily,
        fontSize: 140,
        color: tokens.white,
        lineHeight: 0.92,
        transform: `translateY(${y}px)`,
        opacity,
        letterSpacing: 2,
      }}
    >
      {text}
    </div>
  );
};

export const Scene2Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Coral flash at relative frame 70 (quick 8-frame burst)
  const flashOpacity = interpolate(
    frame,
    [70, 74, 82],
    [0, 0.28, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: tokens.ink,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Coral flash layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: tokens.coral,
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Lines staggered 12 frames apart */}
      <Line text="BOOK" delay={0} frame={frame} fps={fps} />
      <Line text="YOUR" delay={12} frame={frame} fps={fps} />
      <Line text="SALON" delay={24} frame={frame} fps={fps} />
      <Line text="IN BASEL" delay={36} frame={frame} fps={fps} />
    </div>
  );
};
```

- [ ] **Step 2: Add Scene 2 to `remotion/src/compositions/PromoReel/index.tsx`**

```tsx
import React from 'react';
import { Sequence } from 'remotion';
import { Scene1Logo } from './Scene1Logo';
import { Scene2Headline } from './Scene2Headline';

export const PromoReel: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={90}>
        <Scene1Logo />
      </Sequence>
      <Sequence from={90} durationInFrames={120}>
        <Scene2Headline />
      </Sequence>
    </>
  );
};
```

- [ ] **Step 3: Preview in Remotion Studio**

```bash
cd remotion
npm run dev
```

Expected: frames 0–89 show Scene 1 as before. Frames 90–209 show a dark ink background with "BOOK / YOUR / SALON / IN BASEL" slamming in from the bottom one by one, then a brief coral flash around frame 160. Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd ..
git add remotion/src/compositions/PromoReel/
git commit -m "feat(remotion): add Scene2Headline — text slam"
```

---

## Task 6: Scene 3 — Service Cards

**Files:**
- Create: `remotion/src/compositions/PromoReel/Scene3Cards.tsx`
- Modify: `remotion/src/compositions/PromoReel/index.tsx`

- [ ] **Step 1: Create `remotion/src/compositions/PromoReel/Scene3Cards.tsx`**

```tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont, fontFamily as bebasFamily } from '@remotion/google-fonts/BebasNeue';
import { tokens } from '../../tokens';

loadFont();

const Card: React.FC<{
  label: string;
  bg: string;
  textColor: string;
  startFrame: number;
  endFrame: number;
  frame: number;
  fps: number;
}> = ({ label, bg, textColor, startFrame, endFrame, frame, fps }) => {
  const localFrame = frame - startFrame;
  const isVisible = frame >= startFrame && frame < endFrame;

  if (!isVisible) return null;

  const scale = spring({
    frame: localFrame,
    fps,
    config: { stiffness: 300, damping: 25 },
    from: 0.85,
    to: 1.0,
  });
  const y = spring({
    frame: localFrame,
    fps,
    config: { stiffness: 300, damping: 25 },
    from: 40,
    to: 0,
  });
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.cream,
      }}
    >
      <div
        style={{
          width: '80%',
          aspectRatio: '4 / 3',
          backgroundColor: bg,
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale}) translateY(${y}px)`,
          opacity,
        }}
      >
        <span
          style={{
            fontFamily: bebasFamily,
            fontSize: 120,
            color: textColor,
            letterSpacing: 6,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export const Scene3Cards: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Hair: frames 0–35 */}
      <Card
        label="HAIR"
        bg={tokens.coral}
        textColor={tokens.white}
        startFrame={0}
        endFrame={35}
        frame={frame}
        fps={fps}
      />
      {/* Nails: frames 35–80 */}
      <Card
        label="NAILS"
        bg={tokens.ink}
        textColor={tokens.cream}
        startFrame={35}
        endFrame={80}
        frame={frame}
        fps={fps}
      />
      {/* Barber: frames 80–150 */}
      <Card
        label="BARBER"
        bg={tokens.coral}
        textColor={tokens.white}
        startFrame={80}
        endFrame={150}
        frame={frame}
        fps={fps}
      />
    </div>
  );
};
```

- [ ] **Step 2: Add Scene 3 to `remotion/src/compositions/PromoReel/index.tsx`**

```tsx
import React from 'react';
import { Sequence } from 'remotion';
import { Scene1Logo } from './Scene1Logo';
import { Scene2Headline } from './Scene2Headline';
import { Scene3Cards } from './Scene3Cards';

export const PromoReel: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={90}>
        <Scene1Logo />
      </Sequence>
      <Sequence from={90} durationInFrames={120}>
        <Scene2Headline />
      </Sequence>
      <Sequence from={210} durationInFrames={150}>
        <Scene3Cards />
      </Sequence>
    </>
  );
};
```

- [ ] **Step 3: Preview in Remotion Studio**

```bash
cd remotion
npm run dev
```

Expected: scrub frames 210–359. A cream background with three cards appearing in rapid succession — coral "HAIR", ink "NAILS", coral "BARBER" — each bouncing up into place. Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd ..
git add remotion/src/compositions/PromoReel/
git commit -m "feat(remotion): add Scene3Cards — service cards flash"
```

---

## Task 7: Scene 4 — CTA End Card

**Files:**
- Create: `remotion/src/compositions/PromoReel/Scene4CTA.tsx`
- Modify: `remotion/src/compositions/PromoReel/index.tsx`

- [ ] **Step 1: Create `remotion/src/compositions/PromoReel/Scene4CTA.tsx`**

```tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont, fontFamily as bebasFamily } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadDmSans, fontFamily as dmSansFamily } from '@remotion/google-fonts/DmSans';
import { tokens } from '../../tokens';

loadFont();
loadDmSans();

export const Scene4CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title scale + fade in
  const titleScale = spring({
    frame,
    fps,
    config: { stiffness: 200, damping: 20 },
    from: 0.8,
    to: 1.0,
  });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Subtitle fades in at frame 30
  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Coral oval pulses — loops every 30 frames
  const pulseProgress = (frame % 30) / 30;
  const pulseScale = interpolate(pulseProgress, [0, 0.5, 1], [1.0, 1.08, 1.0]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: tokens.cream,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Coral oval pulse (behind text) */}
      <div
        style={{
          position: 'absolute',
          width: 540,
          height: 320,
          borderRadius: '50%',
          backgroundColor: tokens.coral,
          opacity: 0.15,
          transform: `scale(${pulseScale})`,
        }}
      />

      {/* solen.ch */}
      <div
        style={{
          fontFamily: bebasFamily,
          fontSize: 100,
          color: tokens.ink,
          letterSpacing: 6,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          position: 'relative',
        }}
      >
        solen.ch
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: dmSansFamily,
          fontSize: 28,
          color: tokens.ink,
          opacity: subtitleOpacity * 0.6,
          marginTop: 16,
          position: 'relative',
          letterSpacing: 1,
        }}
      >
        Dein Salon in Basel
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Complete `remotion/src/compositions/PromoReel/index.tsx` with all 4 scenes**

```tsx
import React from 'react';
import { Sequence } from 'remotion';
import { Scene1Logo } from './Scene1Logo';
import { Scene2Headline } from './Scene2Headline';
import { Scene3Cards } from './Scene3Cards';
import { Scene4CTA } from './Scene4CTA';

export const PromoReel: React.FC = () => {
  return (
    <>
      {/* Scene 1: Logo reveal — 0–3s (frames 0–89) */}
      <Sequence from={0} durationInFrames={90}>
        <Scene1Logo />
      </Sequence>

      {/* Scene 2: Headline slam — 3–7s (frames 90–209) */}
      <Sequence from={90} durationInFrames={120}>
        <Scene2Headline />
      </Sequence>

      {/* Scene 3: Service cards — 7–12s (frames 210–359) */}
      <Sequence from={210} durationInFrames={150}>
        <Scene3Cards />
      </Sequence>

      {/* Scene 4: CTA end card — 12–15s (frames 360–449) */}
      <Sequence from={360} durationInFrames={90}>
        <Scene4CTA />
      </Sequence>
    </>
  );
};
```

- [ ] **Step 3: Full preview in Remotion Studio**

```bash
cd remotion
npm run dev
```

Expected: press Play and watch the full 15-second video from frame 0 to 449. Verify each scene transitions at the right moment:
- 0s–3s: cream bg, SOLEN logo reveals
- 3s–7s: dark bg, BOOK / YOUR / SALON / IN BASEL slams in
- 7s–12s: cream bg, HAIR → NAILS → BARBER cards flash
- 12s–15s: cream bg, solen.ch + subtitle + coral pulse

Kill with Ctrl+C after confirming all 4 scenes look correct.

- [ ] **Step 4: Commit**

```bash
cd ..
git add remotion/src/compositions/PromoReel/
git commit -m "feat(remotion): add Scene4CTA and complete full PromoReel composition"
```

---

## Task 8: Render to MP4

**Files:** `remotion/out/PromoReel.mp4` (generated)

- [ ] **Step 1: Create output directory**

```bash
mkdir -p remotion/out
```

- [ ] **Step 2: Render**

```bash
cd remotion
npm run render
```

Expected output (last few lines):
```
Rendered 450 frames
Encoded 450/450 frames (100%)
Rendered video: remotion/out/PromoReel.mp4
```

This takes 1–3 minutes on a modern laptop.

- [ ] **Step 3: Verify the file**

```bash
ls -lh remotion/out/PromoReel.mp4
```

Expected: file exists, size between 2–15 MB.

- [ ] **Step 4: Add `out/` to `.gitignore`**

Add this line to `remotion/.gitignore` (create the file if it doesn't exist):

```
out/
node_modules/
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add remotion/.gitignore
git commit -m "feat(remotion): add .gitignore, render pipeline complete"
```

---

## Success Checklist

- [ ] `cd remotion && npm install` completes without errors
- [ ] `npm run dev` opens Remotion Studio at localhost:3000 with "PromoReel" in the left panel
- [ ] Scrubbing frames 0–89 shows Scene 1: logo reveal on cream bg
- [ ] Scrubbing frames 90–209 shows Scene 2: headline slam on ink bg
- [ ] Scrubbing frames 210–359 shows Scene 3: HAIR → NAILS → BARBER cards
- [ ] Scrubbing frames 360–449 shows Scene 4: solen.ch CTA with coral pulse
- [ ] `npm run render` produces `out/PromoReel.mp4` at 1080×1920
- [ ] Brand colors in the video: coral `#E8624A`, cream `#FAF6EF`, ink `#1A1209`
- [ ] Fonts: Bebas Neue for all large text, DM Sans for subtitle in Scene 4
