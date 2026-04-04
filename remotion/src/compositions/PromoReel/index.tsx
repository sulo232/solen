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
