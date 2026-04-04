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

  // Quick coral flash at relative frame 70
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: tokens.coral,
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />
      <Line text="BOOK" delay={0} frame={frame} fps={fps} />
      <Line text="YOUR" delay={12} frame={frame} fps={fps} />
      <Line text="SALON" delay={24} frame={frame} fps={fps} />
      <Line text="IN BASEL" delay={36} frame={frame} fps={fps} />
    </div>
  );
};
