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

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Coral oval pulses every 30 frames
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
      {/* Coral oval pulse behind text */}
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
