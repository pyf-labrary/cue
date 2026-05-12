import { useEffect, useMemo } from 'react';
import { scenePlayer, useScenePlayer } from '@/lib/scenePlayer';
import { TRACK_META, type Scene, type TrackId, type Annotation } from '@/data/scenes';

const TRACK_ORDER: TrackId[] = ['mx', 'fx', 'nx', 'dx', 'vo'];

export default function MultiTrackPlayer({ scene }: { scene: Scene }) {
  const state = useScenePlayer();
  const isThisScene = state.scene?.slug === scene.slug;

  // Load scene on mount; unload on unmount
  useEffect(() => {
    scenePlayer.load(scene);
    return () => {
      scenePlayer.stop();
    };
  }, [scene]);

  const playing = isThisScene && state.status === 'playing';
  const current = isThisScene ? state.currentSec : 0;
  const dur = scene.durationSec;
  const pct = Math.max(0, Math.min(100, (current / dur) * 100));

  // Pre-compute event marks per track for the lane visualization
  const trackMarks = useMemo(() => buildTrackMarks(scene), [scene]);

  // Active annotations — within ±0.4s window
  const activeAnnotations = useMemo(
    () => scene.annotations.filter((a) => Math.abs(a.at - current) < 0.6),
    [scene, current]
  );

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/40 overflow-hidden">
      {/* Transport bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-ink-700/60">
        <button
          type="button"
          onClick={() => (playing ? scenePlayer.pause() : scenePlayer.play())}
          className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-ink-900 hover:scale-105 transition disabled:opacity-50"
          disabled={state.status === 'loading'}
          aria-pressed={playing}
        >
          {state.status === 'loading' ? (
            <span className="text-[10px] tracking-wider">LOAD</span>
          ) : playing ? (
            <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden>
              <rect x="2" y="2" width="3" height="8" fill="currentColor" />
              <rect x="7" y="2" width="3" height="8" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => scenePlayer.stop()}
          className="text-xs text-ink-400 hover:text-ink-200 transition px-3 py-1 rounded-full border border-ink-700"
        >
          回到起点
        </button>
        <div className="ml-auto font-mono text-sm text-ink-300 tabular-nums">
          {fmt(current)} <span className="text-ink-500">/</span> {fmt(dur)}
        </div>
      </div>

      {/* Tracks */}
      <div className="px-6 py-5 space-y-2">
        {TRACK_ORDER.map((tid) => {
          const meta = TRACK_META[tid];
          const marks = trackMarks[tid] ?? [];
          const isMuted = isThisScene && state.muted[tid];
          const isSoloed = isThisScene && state.solo === tid;
          const otherSoloed = isThisScene && state.solo && state.solo !== tid;
          const isAudibleNow = !isMuted && !otherSoloed;
          const isEmpty = marks.length === 0 && tid !== 'nx';
          return (
            <div key={tid} className="grid grid-cols-[100px_1fr_auto] items-center gap-4">
              {/* Label */}
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{
                    color: isAudibleNow ? meta.color : 'rgba(184,184,194,0.4)',
                    background: isAudibleNow ? `${meta.color}1a` : 'transparent',
                    border: `1px solid ${isAudibleNow ? meta.color : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {meta.en}
                </span>
                <span
                  className={`text-sm ${isAudibleNow ? 'text-ink-100' : 'text-ink-500'}`}
                  title={meta.hint}
                >
                  {meta.label}
                </span>
                {tid === 'mx' && scene.mxAudio && (
                  <span className="text-[9px] tracking-wider font-mono text-accent/80">REC</span>
                )}
              </div>

              {/* Lane */}
              <div
                className="relative h-10 rounded bg-ink-900/60 overflow-hidden border border-ink-700/40"
                style={{ opacity: isAudibleNow ? 1 : 0.25 }}
              >
                {/* Mark blobs */}
                {marks.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-1.5 bottom-1.5 rounded-sm"
                    style={{
                      left: `${(m.start / dur) * 100}%`,
                      width: `max(3px, ${((m.end - m.start) / dur) * 100}%)`,
                      background: meta.color,
                      opacity: 0.35 + (m.vel ?? 0.5) * 0.5,
                    }}
                  />
                ))}
                {isEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-500">
                    （本场景无 {meta.label}）
                  </div>
                )}
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-ink-100"
                  style={{ left: `${pct}%`, transition: playing ? 'left 0.05s linear' : 'none' }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <SmallToggle
                  active={isMuted}
                  onClick={() => scenePlayer.setMuted(tid, !state.muted[tid])}
                  label="M"
                  title="静音"
                  activeColor="#D86B6B"
                />
                <SmallToggle
                  active={isSoloed}
                  onClick={() => scenePlayer.toggleSolo(tid)}
                  label="S"
                  title="独奏"
                  activeColor="#E6C36B"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Annotation strip */}
      <div className="border-t border-ink-700/60 px-6 py-4 min-h-[60px] bg-ink-900/40">
        <div className="h-eyebrow mb-2 text-ink-400">导演笔记</div>
        {activeAnnotations.length === 0 ? (
          <div className="text-sm text-ink-500 italic">···</div>
        ) : (
          activeAnnotations.map((a, i) => (
            <AnnotationRow key={`${a.at}-${i}`} annotation={a} />
          ))
        )}
      </div>

      {/* Annotation timeline preview */}
      <div className="border-t border-ink-700/60 px-6 py-3 bg-ink-800/60">
        <div className="relative h-1.5 bg-ink-700/40 rounded">
          {scene.annotations.map((a, i) => (
            <button
              key={i}
              type="button"
              className="absolute -top-1 w-2.5 h-3.5 rounded-sm hover:scale-125 transition"
              style={{
                left: `calc(${(a.at / dur) * 100}% - 5px)`,
                background: a.track ? TRACK_META[a.track].color : '#E6C36B',
              }}
              title={a.text}
              onClick={() => scenePlayer.seek(a.at)}
            />
          ))}
          <div
            className="absolute -top-1 w-px h-3.5 bg-ink-100"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SmallToggle({
  active,
  onClick,
  label,
  title,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded text-[11px] font-mono tracking-tight border transition"
      style={{
        color: active ? '#0F0F12' : '#8A8A95',
        background: active ? activeColor : 'transparent',
        borderColor: active ? activeColor : 'rgba(255,255,255,0.1)',
      }}
    >
      {label}
    </button>
  );
}

function AnnotationRow({ annotation }: { annotation: Annotation }) {
  const color = annotation.track ? TRACK_META[annotation.track].color : '#E6C36B';
  return (
    <div className="flex items-baseline gap-3 mb-1.5">
      <span
        className="font-mono text-[10px] px-1.5 py-0.5 rounded"
        style={{ color, border: `1px solid ${color}66` }}
      >
        {fmt(annotation.at)}
      </span>
      <span className="text-sm text-ink-100 leading-snug">{annotation.text}</span>
    </div>
  );
}

function fmt(s: number): string {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function buildTrackMarks(scene: Scene) {
  const marks: Record<TrackId, Array<{ start: number; end: number; vel?: number }>> = {
    mx: [],
    fx: [],
    nx: [],
    dx: [],
    vo: [],
  };
  if (scene.mxAudio) {
    // Real audio: show one solid block spanning the full scene
    marks.mx.push({ start: 0, end: scene.durationSec, vel: 0.9 });
  } else {
    for (const n of scene.tracks.mx ?? []) {
      marks.mx.push({ start: n.at, end: n.at + estimateDurSec(n.dur), vel: n.vel });
    }
  }
  for (const f of scene.tracks.fx ?? []) {
    marks.fx.push({ start: f.at, end: f.at + estimateDurSec(f.dur), vel: f.vel });
  }
  for (const d of scene.tracks.nx ?? []) {
    marks.nx.push({ start: d.startAt, end: d.endAt, vel: d.vel });
  }
  return marks;
}

/** Crude beat-to-second conversion at a default 80 BPM — good enough for blob sizing. */
function estimateDurSec(dur: string): number {
  const bpm = 80;
  const sec = 60 / bpm;
  switch (dur) {
    case '32n': return sec / 8;
    case '16n': return sec / 4;
    case '8n':  return sec / 2;
    case '8n.': return sec * 0.75;
    case '4n':  return sec;
    case '4n.': return sec * 1.5;
    case '2n':  return sec * 2;
    case '2n.': return sec * 3;
    case '1n':  return sec * 4;
    default:    return sec;
  }
}
