import { useEffect, useMemo, useState } from 'react';
import { EMOTIONS, type Emotion } from '@/data/emotions';

type Props = {
  size?: number;
  active: Emotion;
  onHover?: (e: Emotion) => void;
  onSelect?: (e: Emotion) => void;
};

/**
 * 12-slice emotion wheel. Each slice is a pie wedge; hover/active state lights
 * the wedge with the emotion's hue, others stay as thin hairlines.
 */
export default function EmotionWheel({ size = 520, active, onHover, onSelect }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const ringOuter = size * 0.46;
  const ringInner = size * 0.30;
  const labelR = size * 0.385;

  const slices = useMemo(() => {
    const n = EMOTIONS.length;
    const step = (2 * Math.PI) / n;
    // Start so the first slice is centered at the top.
    const start = -Math.PI / 2 - step / 2;
    return EMOTIONS.map((e, i) => {
      const a0 = start + i * step;
      const a1 = a0 + step;
      const mid = (a0 + a1) / 2;
      return {
        emotion: e,
        path: arcPath(cx, cy, ringInner, ringOuter, a0, a1),
        labelX: cx + Math.cos(mid) * labelR,
        labelY: cy + Math.sin(mid) * labelR,
        labelRotate: ((mid * 180) / Math.PI + 90) % 360,
      };
    });
  }, [cx, cy, ringInner, ringOuter, labelR]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="select-none w-full h-auto"
      style={{ maxWidth: size }}
      role="img"
      aria-label="情绪光谱：12 种基础情绪选择器"
    >
      <defs>
        <radialGradient id="wheel-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={active.hue} stopOpacity="0.35" />
          <stop offset="55%" stopColor={active.hue} stopOpacity="0.06" />
          <stop offset="100%" stopColor={active.hue} stopOpacity="0" />
        </radialGradient>
        <filter id="wheel-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Soft halo behind the wheel that takes the active emotion's color */}
      <circle cx={cx} cy={cy} r={size * 0.48} fill="url(#wheel-halo)" />

      {slices.map(({ emotion, path, labelX, labelY }) => {
        const isActive = emotion.id === active.id;
        return (
          <g
            key={emotion.id}
            onMouseEnter={() => onHover?.(emotion)}
            onClick={() => onSelect?.(emotion)}
            onFocus={() => onHover?.(emotion)}
            tabIndex={0}
            className="cursor-pointer outline-none"
          >
            <path
              d={path}
              fill={isActive ? emotion.hue : 'transparent'}
              fillOpacity={isActive ? 0.18 : 0}
              stroke={isActive ? emotion.hue : 'rgba(255,255,255,0.10)'}
              strokeWidth={isActive ? 1.2 : 0.8}
              className="transition-[fill-opacity,stroke] duration-200 hover:[fill-opacity:0.10]"
              style={{ fill: emotion.hue }}
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-serif pointer-events-none"
              style={{
                fontSize: isActive ? 18 : 15,
                fill: isActive ? '#fff' : 'rgba(227,227,234,0.55)',
                transition: 'all 200ms ease',
              }}
            >
              {emotion.label}
            </text>
          </g>
        );
      })}

      {/* Center: the active emotion's display name */}
      <g>
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          className="h-eyebrow"
          style={{ fontSize: 11, fill: 'rgba(227,227,234,0.55)', letterSpacing: '0.18em' }}
        >
          {active.en.toUpperCase()}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          className="font-serif"
          style={{ fontSize: 36, fill: '#fff', letterSpacing: '-0.02em' }}
        >
          {active.label}
        </text>
      </g>
    </svg>
  );
}

/** Build an annular sector path between two radii and two angles. */
function arcPath(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p0 = polar(cx, cy, rOut, a0);
  const p1 = polar(cx, cy, rOut, a1);
  const p2 = polar(cx, cy, rIn, a1);
  const p3 = polar(cx, cy, rIn, a0);
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${p3.x} ${p3.y}`,
    'Z',
  ].join(' ');
}

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}
