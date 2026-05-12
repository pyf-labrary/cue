/**
 * 5-lane track editor — the centerpiece of the M5 sandbox and the embed
 * widget that powers lessons 1, 4 and 5.
 *
 * Controlled component: the parent holds the Composition; this view emits
 * patches via onChangeComposition. Selected clip state stays local.
 */
import { useMemo, useRef, useState } from 'react';
import { TRACK_META, type TrackId } from '@/data/scenes';
import {
  type Composition,
  type Clip,
  updateClip,
  withoutClip,
  setLaneVol,
  setLaneMute,
  toggleLaneSolo,
  isLaneAudible,
} from '@/lib/composition';
import ClipBlock from './ClipBlock';
import Timeline from './Timeline';
import VolumeSlider from './VolumeSlider';

const TRACK_ORDER: TrackId[] = ['dx', 'mx', 'fx', 'nx', 'vo'];

interface Props {
  composition: Composition;
  currentSec: number;
  /** Pixels per second of timeline. */
  pxPerSec?: number;
  /** Lane height in px. */
  laneHeight?: number;
  /** Show per-lane vol slider + M/S buttons. */
  showLaneControls?: boolean;
  /** Allow drag/resize/delete on clips. */
  editable?: boolean;
  /** Click an empty area in a lane — gives parent a chance to insert a clip. */
  onAddClipAt?: (lane: TrackId, sec: number) => void;
  onChangeComposition: (next: Composition) => void;
  onSeek?: (sec: number) => void;
}

export default function TrackEditor({
  composition,
  currentSec,
  pxPerSec = 36,
  laneHeight = 44,
  showLaneControls = true,
  editable = true,
  onAddClipAt,
  onChangeComposition,
  onSeek,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clipsByLane = useMemo(() => groupByLane(composition.clips), [composition.clips]);
  const width = composition.durationSec * pxPerSec;
  const playheadLeft = Math.min(currentSec, composition.durationSec) * pxPerSec;

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/40 overflow-hidden">
      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[180px_1fr]">
        {/* Left rail: lane labels + controls */}
        <div className="border-r border-ink-700/60 bg-ink-900/40">
          <div className="h-8 border-b border-ink-700/60" />
          {TRACK_ORDER.map((tid) => {
            const meta = TRACK_META[tid];
            const audible = isLaneAudible(composition, tid);
            const muted = composition.laneMute[tid];
            const soloed = composition.laneSolo === tid;
            return (
              <div
                key={tid}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 border-b border-ink-700/40"
                style={{ height: laneHeight, opacity: audible ? 1 : 0.4 }}
              >
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    color: meta.color,
                    background: `${meta.color}1a`,
                    border: `1px solid ${meta.color}55`,
                  }}
                >
                  {meta.en}
                </span>
                <span className="hidden sm:inline text-xs text-ink-200" title={meta.hint}>
                  {meta.label}
                </span>
                {showLaneControls && (
                  <div className="ml-auto flex items-center gap-1">
                    <div className="hidden sm:block">
                      <VolumeSlider
                        value={composition.laneVol[tid]}
                        onChange={(v) => onChangeComposition(setLaneVol(composition, tid, v))}
                        color={meta.color}
                        width={44}
                      />
                    </div>
                    <SmallToggle
                      active={muted}
                      onClick={() => onChangeComposition(setLaneMute(composition, tid, !muted))}
                      label="M"
                      activeColor="#D86B6B"
                    />
                    <SmallToggle
                      active={soloed}
                      onClick={() => onChangeComposition(toggleLaneSolo(composition, tid))}
                      label="S"
                      activeColor="#E6C36B"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: timeline + lanes */}
        <div className="overflow-x-auto">
          <div ref={containerRef} className="relative" style={{ width, minWidth: '100%' }}>
            <Timeline durationSec={composition.durationSec} pxPerSec={pxPerSec} onSeek={onSeek} />
            <div className="relative">
              {TRACK_ORDER.map((tid) => {
                const audible = isLaneAudible(composition, tid);
                const clips = clipsByLane.get(tid) ?? [];
                return (
                  <div
                    key={tid}
                    className="relative border-b border-ink-700/40 bg-ink-900/30"
                    style={{ height: laneHeight, opacity: audible ? 1 : 0.4 }}
                    onClick={(e) => {
                      // Click on empty lane space → optional insert
                      if (!onAddClipAt) return;
                      if ((e.target as HTMLElement).closest('[data-clip]')) return;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const sec = Math.max(0, (e.clientX - rect.left) / pxPerSec);
                      onAddClipAt(tid, sec);
                    }}
                  >
                    {/* Faint vertical sec markers */}
                    {Array.from({ length: Math.ceil(composition.durationSec) + 1 }).map((_, s) => (
                      <div
                        key={s}
                        className="absolute top-0 bottom-0 w-px"
                        style={{ left: `${s * pxPerSec}px`, background: s % 5 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                      />
                    ))}
                    {clips.map((c) => (
                      <div key={c.id} data-clip>
                        <ClipBlock
                          clip={c}
                          pxPerSec={pxPerSec}
                          totalSec={composition.durationSec}
                          selected={selected === c.id}
                          onSelect={() => setSelected(c.id)}
                          onChange={
                            editable
                              ? (patch) => onChangeComposition(updateClip(composition, c.id, patch as Partial<Clip>))
                              : undefined
                          }
                          onDelete={editable ? () => onChangeComposition(withoutClip(composition, c.id)) : undefined}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
              {/* Playhead spans all lanes */}
              <div
                className="absolute top-0 w-px bg-accent pointer-events-none"
                style={{
                  left: `${playheadLeft}px`,
                  height: laneHeight * TRACK_ORDER.length,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function groupByLane(clips: Clip[]): Map<TrackId, Clip[]> {
  const m = new Map<TrackId, Clip[]>();
  for (const c of clips) {
    const arr = m.get(c.lane) ?? [];
    arr.push(c);
    m.set(c.lane, arr);
  }
  return m;
}

function SmallToggle({
  active,
  onClick,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-6 h-6 rounded text-[10px] font-mono tracking-tight border transition"
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
