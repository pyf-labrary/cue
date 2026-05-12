import { useMemo } from 'react';
import { EMOTIONS, type EmotionId } from '@/data/emotions';

type Props = {
  values: Partial<Record<EmotionId, number>>; // 0..10
  size?: number;
};

/**
 * 12-axis radar. Each axis = one emotion. Filled polygon = instrument's
 * affinity. Axes labels sit just outside the outer ring.
 */
export default function EmotionRadar({ values, size = 360 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const max = size * 0.36;
  const n = EMOTIONS.length;

  const { polyPoints, axes, gridRings } = useMemo(() => {
    const polyPoints: string[] = [];
    const axes: {
      x: number;
      y: number;
      labelX: number;
      labelY: number;
      anchor: 'start' | 'end' | 'middle';
      label: string;
      hue: string;
      strong: boolean;
    }[] = [];
    EMOTIONS.forEach((e, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const v = (values[e.id] ?? 0) / 10;
      const px = cx + Math.cos(a) * max * v;
      const py = cy + Math.sin(a) * max * v;
      polyPoints.push(`${px},${py}`);
      const lx = cx + Math.cos(a) * (max + 22);
      const ly = cy + Math.sin(a) * (max + 22);
      const cos = Math.cos(a);
      const anchor: 'start' | 'end' | 'middle' =
        cos > 0.15 ? 'start' : cos < -0.15 ? 'end' : 'middle';
      axes.push({
        x: cx + Math.cos(a) * max,
        y: cy + Math.sin(a) * max,
        labelX: lx,
        labelY: ly,
        anchor,
        label: e.label,
        hue: e.hue,
        strong: v >= 0.6,
      });
    });
    const gridRings = [0.25, 0.5, 0.75, 1].map((r) =>
      Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        return `${cx + Math.cos(a) * max * r},${cy + Math.sin(a) * max * r}`;
      }).join(' ')
    );
    return { polyPoints: polyPoints.join(' '), axes, gridRings };
  }, [values, cx, cy, max, n]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="情绪雷达图">
      {/* concentric rings */}
      {gridRings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={i === gridRings.length - 1 ? 1 : 0.5}
        />
      ))}
      {/* axes */}
      {axes.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={a.x}
          y2={a.y}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={0.5}
        />
      ))}
      {/* filled affinity polygon */}
      <polygon
        points={polyPoints}
        fill="rgba(230,195,107,0.18)"
        stroke="#E6C36B"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* axis labels */}
      {axes.map((a, i) => (
        <text
          key={i}
          x={a.labelX}
          y={a.labelY}
          textAnchor={a.anchor}
          dominantBaseline="central"
          className="font-serif"
          style={{
            fontSize: 12,
            fill: a.strong ? a.hue : 'rgba(184,184,194,0.6)',
            letterSpacing: '0.02em',
          }}
        >
          {a.label}
        </text>
      ))}
    </svg>
  );
}
