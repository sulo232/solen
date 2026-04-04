import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont, fontFamily as bebasFamily } from '@remotion/google-fonts/BebasNeue';
import { tokens } from '../../tokens';

loadFont();

export const Scene1Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // Coral underline wipes in left→right (frames 30–60)
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
