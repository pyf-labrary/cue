/**
 * Generic draggable transport bar. Click anywhere to seek; press-and-drag
 * to scrub continuously. Uses Pointer Events so the same code path drives
 * mouse, touch, and pen without surprises around passive listeners.
 */
import { useRef } from 'react';
import { compositionPlayer } from '@/lib/compositionPlayer';

interface Props {
  durationSec: number;
  currentSec: number;
  /** Visual indication: are we mid-playback? Controls the playhead transition. */
  playing?: boolean;
  /** Optional ticks rendered above the bar (e.g. annotation hot points). */
  ticks?: Array<{ at: number; color?: string; title?: string }>;
  className?: string;
}

export default function ScrubBar({ durationSec, currentSec, playing, ticks, className }: Props) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const pct = durationSec > 0 ? Math.max(0, Math.min(100, (currentSec / durationSec) * 100)) : 0;

  function seekFromClientX(clientX: number) {
    const el = barRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    compositionPlayer.seek(p * durationSec);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const el = barRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
    function move(ev: PointerEvent) {
      seekFromClientX(ev.clientX);
    }
    function up(ev: PointerEvent) {
      try { el!.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  return (
    <div
      ref={barRef}
      onPointerDown={onPointerDown}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={durationSec}
      aria-valuenow={currentSec}
      className={`relative h-2 rounded-full bg-ink-700/60 cursor-pointer select-none group touch-none ${className ?? ''}`}
    >
      <div
        className="absolute top-0 bottom-0 left-0 rounded-full bg-accent/60 group-hover:bg-accent transition-colors"
        style={{ width: `${pct}%`, transition: playing ? 'width 0.05s linear' : 'none' }}
      />
      {ticks?.map((t, i) => (
        <div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded-sm pointer-events-none"
          style={{ left: `${(t.at / durationSec) * 100}%`, background: t.color ?? '#E6C36B' }}
          title={t.title}
        />
      ))}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow ring-2 ring-ink-900 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
