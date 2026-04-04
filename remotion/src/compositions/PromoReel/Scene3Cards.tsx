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
      <Card label="HAIR"   bg={tokens.coral} textColor={tokens.white} startFrame={0}  endFrame={35}  frame={frame} fps={fps} />
      <Card label="NAILS"  bg={tokens.ink}   textColor={tokens.cream} startFrame={35} endFrame={80}  frame={frame} fps={fps} />
      <Card label="BARBER" bg={tokens.coral} textColor={tokens.white} startFrame={80} endFrame={150} frame={frame} fps={fps} />
    </div>
  );
};
