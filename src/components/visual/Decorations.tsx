/**
 * Decorative SVG components — pure visual, no audio binding.
 * Cheap to render; safe to drop in any page that feels too text-heavy.
 *
 *   <SoundWave />        — single sinusoidal divider line, animatable
 *   <FrequencyBars />    — animated EQ bars (CSS keyframes, no JS clock)
 *   <LaneStripes />      — 5 horizontal lines in DX/MX/FX/NX/VO colors
 *   <AudioMeter />       — vertical VU-style meter, decorative
 *   <FilmStrip />        — 35mm sprocket-hole edge as a top accent
 *   <MarqueeWave />      — wide ambient wave for hero backgrounds
 */
import { TRACK_META } from '@/data/scenes';

/* -------------------------------------------------------------------------- */

export function SoundWave({
  color = 'rgba(230,195,107,0.45)',
  height = 24,
  amplitude = 8,
  cycles = 6,
}: {
  color?: string;
  height?: number;
  amplitude?: number;
  cycles?: number;
}) {
  const w = 1000;
  const mid = height / 2;
  const step = w / (cycles * 2);
  let d = `M 0 ${mid}`;
  for (let i = 0; i < cycles * 2; i++) {
    const cx = step / 2 + i * step;
    const cy = mid + (i % 2 === 0 ? -amplitude : amplitude);
    d += ` Q ${cx} ${cy} ${(i + 1) * step} ${mid}`;
  }
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

export function FrequencyBars({
  bars = 32,
  height = 80,
  color = '#E6C36B',
  className = '',
}: {
  bars?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  const width = 600;
  const gap = 3;
  const barW = (width - gap * (bars - 1)) / bars;
  return (
    <div className={className} style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
        {Array.from({ length: bars }).map((_, i) => {
          const seed = (i * 137.5) % 100;
          const baseH = 18 + (seed / 100) * (height - 30);
          const delay = (i * 0.07) % 1.8;
          return (
            <rect
              key={i}
              x={i * (barW + gap)}
              y={height - baseH}
              width={barW}
              height={baseH}
              rx={1.5}
              fill={color}
              style={{
                transformOrigin: `${i * (barW + gap) + barW / 2}px ${height}px`,
                animation: `cue-bar 1.6s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </svg>
      <style>{`
        @keyframes cue-bar {
          0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
          50%      { transform: scaleY(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function LaneStripes({ height = 6, className = '' }: { height?: number; className?: string }) {
  const lanes: Array<keyof typeof TRACK_META> = ['dx', 'mx', 'fx', 'nx', 'vo'];
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {lanes.map((id) => (
        <div
          key={id}
          style={{ height, background: `linear-gradient(to right, transparent, ${TRACK_META[id].color} 30%, ${TRACK_META[id].color} 70%, transparent)` }}
          className="w-full rounded-full"
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function AudioMeter({
  size = 60,
  level = 0.7,
  color = '#E6C36B',
}: {
  size?: number;
  level?: number; // 0..1
  color?: string;
}) {
  const segments = 8;
  return (
    <div className="flex flex-col-reverse gap-[3px]" style={{ width: size / 4, height: size }}>
      {Array.from({ length: segments }).map((_, i) => {
        const lit = i < segments * level;
        const isHot = i >= segments - 2;
        return (
          <div
            key={i}
            className="rounded-sm transition-opacity"
            style={{
              flex: 1,
              background: lit ? (isHot ? '#D86B6B' : color) : 'rgba(255,255,255,0.06)',
              opacity: lit ? 1 : 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function FilmStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center gap-2 ${className}`} aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="rounded-sm bg-ink-700/80"
          style={{ width: 10, height: 14 }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Large ambient horizontal wave for hero backgrounds. Renders 3 layered
 * sine waves at decreasing opacity; intended to sit at low z under hero
 * content as a textural background.
 */
export function MarqueeWave({
  height = 200,
  color = '#E6C36B',
  className = '',
}: {
  height?: number;
  color?: string;
  className?: string;
}) {
  const w = 1200;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={className} style={{ width: '100%', height }} aria-hidden>
      <defs>
        <linearGradient id="cue-marquee-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={wavePath(w, height, height * 0.5, 12, 4)}
        fill="none"
        stroke="url(#cue-marquee-fade)"
        strokeWidth={1.4}
        opacity={0.9}
      />
      <path
        d={wavePath(w, height, height * 0.6, 18, 6)}
        fill="none"
        stroke="url(#cue-marquee-fade)"
        strokeWidth={1}
        opacity={0.5}
      />
      <path
        d={wavePath(w, height, height * 0.4, 24, 3.5)}
        fill="none"
        stroke="url(#cue-marquee-fade)"
        strokeWidth={0.8}
        opacity={0.35}
      />
    </svg>
  );
}

function wavePath(width: number, _h: number, mid: number, amp: number, freq: number): string {
  const points = 200;
  let d = '';
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    const y = mid + Math.sin((i / points) * Math.PI * 2 * freq) * amp + Math.cos((i / points) * Math.PI * freq * 0.7) * amp * 0.4;
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(2)} `;
  }
  return d;
}

/* -------------------------------------------------------------------------- */

/** Single round dot pulsing in accent — useful for "live / now playing" badges. */
export function LiveDot({ color = '#E6C36B' }: { color?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: 10, height: 10 }} aria-hidden>
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: color, animation: 'cue-pulse 1.6s ease-in-out infinite' }}
      />
      <span className="absolute inset-[2px] rounded-full" style={{ background: color }} />
      <style>{`@keyframes cue-pulse { 0%,100% { opacity: 0.25; transform: scale(1); } 50% { opacity: 1; transform: scale(1.6); } }`}</style>
    </span>
  );
}
