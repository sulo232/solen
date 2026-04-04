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
