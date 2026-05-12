/**
 * Sandbox — drop loops onto 5 lanes, scrub, mute, mix.
 *
 * Composition state lives here; every edit pushes a patch into
 * compositionPlayer.patchComposition() so playback follows the UI live.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  emptyComposition,
  makeNoteClip,
  makeDroneClip,
  withClip,
  type Composition,
} from '@/lib/composition';
import { compositionPlayer, useCompositionPlayer } from '@/lib/compositionPlayer';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import type { Loop } from '@/data/loops';
import TrackEditor from '@/components/sandbox/TrackEditor';
import LoopPalette from '@/components/sandbox/LoopPalette';
import { FrequencyBars } from '@/components/visual/Decorations';

export default function Sandbox() {
  const [composition, setComposition] = useState<Composition>(() => emptyComposition(24));
  const state = useCompositionPlayer();

  // Push composition into the engine. setComposition triggers a warm; we only
  // want a full reload on initial mount — subsequent edits go through patch.
  const [warmed, setWarmed] = useState(false);
  useEffect(() => {
    void compositionPlayer.setComposition(composition).then(() => setWarmed(true));
    return () => {
      compositionPlayer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!warmed) return;
    compositionPlayer.patchComposition(composition);
  }, [composition, warmed]);

  const playing = state.status === 'playing';
  const totalClips = composition.clips.length;
  const isEmpty = totalClips === 0;

  function addLoop(loop: Loop) {
    const startSec = Math.min(state.currentSec, Math.max(0, composition.durationSec - loop.durSec));
    const clip =
      loop.kind === 'drone'
        ? makeDroneClip({
            lane: loop.suggestedLane,
            inst: loop.inst,
            hold: loop.hold!,
            startSec,
            durSec: loop.durSec,
            vel: loop.vel,
            label: loop.label,
          })
        : makeNoteClip({
            lane: loop.suggestedLane,
            inst: loop.inst,
            notes: loop.notes ?? [],
            startSec,
            durSec: loop.durSec,
            label: loop.label,
          });
    setComposition((c) => withClip(c, clip));
  }

  const durations = useMemo(() => [12, 18, 24, 30, 45, 60], []);

  function setDuration(sec: number) {
    setComposition((c) => ({ ...c, durationSec: sec }));
  }

  function clearAll() {
    setComposition((c) => ({ ...c, clips: [] }));
  }

  function loadPreset(preset: 'jaws-lite' | 'pedal' | 'march') {
    setComposition(buildPreset(preset));
  }

  useKeyboardShortcuts({ composition, onCompositionChange: setComposition });

  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="h-eyebrow text-accent">SANDBOX</div>
          <h1 className="h-display text-4xl md:text-5xl mt-2 text-ink-100">配乐试听台</h1>
          <p className="mt-3 text-ink-300 max-w-2xl leading-relaxed">
            左边乐器库点一下，它会落到右边轨道上——拖动改起点、拖右边缘改时长、双击删除。
            5 条轨道（DX/MX/FX/NX/VO）各自有独立的音量条、静音与独奏。试试同时把
            <span className="text-ink-100">「低音提琴 · Ostinato」</span> +
            <span className="text-ink-100">「定音鼓 · 心跳」</span> +
            <span className="text-ink-100">「合成 Pad · 暖」</span> 拼出来，再 mute MX 看看少了它有多不同。
          </p>
        </header>

        {/* Transport bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 rounded-2xl border border-ink-700 bg-ink-800/40 px-5 py-4">
          <button
            type="button"
            onClick={() => (playing ? compositionPlayer.pause() : compositionPlayer.play())}
            disabled={state.status === 'loading' || isEmpty}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-accent text-ink-900 hover:scale-105 transition disabled:opacity-30 disabled:hover:scale-100"
            title={isEmpty ? '先拖个 loop 进来' : playing ? '暂停' : '播放'}
          >
            {state.status === 'loading' ? (
              <span className="text-[10px] font-mono">…</span>
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
            onClick={() => compositionPlayer.stop()}
            className="text-xs text-ink-400 hover:text-ink-200 transition px-3 py-1.5 rounded-full border border-ink-700"
          >
            回到起点
          </button>
          <div className="font-mono text-sm text-ink-300 tabular-nums">
            {fmt(state.currentSec)} <span className="text-ink-500">/</span> {fmt(composition.durationSec)}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[10px] text-ink-500">总长</span>
            <select
              value={composition.durationSec}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="bg-ink-900 border border-ink-700 rounded px-2 py-1 text-xs text-ink-100"
            >
              {durations.map((d) => (
                <option key={d} value={d}>{d}s</option>
              ))}
            </select>
            <span className="mx-2 text-ink-700">|</span>
            <span className="font-mono text-[10px] text-ink-500">预设</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) loadPreset(v as 'jaws-lite' | 'pedal' | 'march');
                e.target.value = '';
              }}
              className="bg-ink-900 border border-ink-700 rounded px-2 py-1 text-xs text-ink-100"
            >
              <option value="">…装一个</option>
              <option value="jaws-lite">Jaws 式 ostinato</option>
              <option value="pedal">Interstellar 式 pedal</option>
              <option value="march">教父 慢板进行曲</option>
            </select>
            <button
              type="button"
              onClick={clearAll}
              disabled={isEmpty}
              className="ml-2 text-[11px] text-ink-400 hover:text-accent-alert transition px-2 py-1 rounded border border-ink-700 disabled:opacity-30"
            >
              清空
            </button>
          </div>
        </div>

        {/* Main layout: palette + editor */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <LoopPalette onPick={addLoop} />
          <div>
            <TrackEditor
              composition={composition}
              currentSec={state.currentSec}
              onChangeComposition={setComposition}
              onSeek={(sec) => compositionPlayer.seek(sec)}
              onAddClipAt={(_lane, _sec) => {
                // For now: clicking empty lane just seeks the playhead via Timeline.
                // Future: open an inline picker filtered to this lane.
              }}
            />
            {isEmpty && (
              <div className="mt-6 flex flex-col items-center gap-3 text-[12px] text-ink-500 italic">
                <div className="max-w-[360px] opacity-50">
                  <FrequencyBars bars={20} height={40} color="#5A5A66" />
                </div>
                轨道是空的。左边点一个 loop 试试——它会从当前播放头位置开始。
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-[11px] text-ink-500 leading-relaxed max-w-3xl">
          技术说明：所有乐器都是 Tone.Sampler 的 CC 真采样（西洋）或 FluidR3_GM 真采样（中乐 / 合唱）。
          没有 MIDI，没有跟踪，没有云端——一切在你的浏览器里跑。
        </p>
      </div>
    </div>
  );
}

function fmt(s: number): string {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/* -------------------------------------------------------------------------- */
/*  Presets                                                                   */
/* -------------------------------------------------------------------------- */

function buildPreset(kind: 'jaws-lite' | 'pedal' | 'march'): Composition {
  const comp = emptyComposition(24);
  if (kind === 'jaws-lite') {
    comp.clips.push(
      makeNoteClip({
        lane: 'mx',
        inst: 'contrabass',
        startSec: 0,
        durSec: 8,
        label: '低音 ostinato',
        notes: pulseEF(0, 8, 0.5),
      }),
      makeNoteClip({
        lane: 'fx',
        inst: 'timpani',
        startSec: 8,
        durSec: 8,
        label: '定音鼓心跳',
        notes: [
          { note: 'C2', dur: '4n', at: 0, vel: 0.7 },
          { note: 'C2', dur: '4n', at: 1, vel: 0.8 },
          { note: 'F2', dur: '4n', at: 2, vel: 0.85 },
          { note: 'F2', dur: '4n', at: 3, vel: 0.9 },
          { note: 'C2', dur: '2n', at: 4, vel: 0.95 },
        ],
      }),
      makeDroneClip({
        lane: 'nx',
        inst: 'cello',
        hold: 'C2',
        startSec: 0,
        durSec: 16,
        vel: 0.2,
        label: '水下基底',
      }),
    );
    comp.durationSec = 16;
  }
  if (kind === 'pedal') {
    comp.clips.push(
      makeDroneClip({
        lane: 'mx',
        inst: 'pipe-organ',
        hold: 'C3',
        startSec: 0,
        durSec: 20,
        vel: 0.55,
        label: '管风琴 pedal C',
      }),
      makeNoteClip({
        lane: 'mx',
        inst: 'cello',
        startSec: 4,
        durSec: 12,
        label: '大提琴和声',
        notes: [
          { note: 'E3', dur: '1n', at: 0, vel: 0.55 },
          { note: 'G3', dur: '1n', at: 4, vel: 0.6 },
          { note: 'F3', dur: '1n', at: 8, vel: 0.6 },
        ],
      }),
      makeNoteClip({
        lane: 'mx',
        inst: 'violin',
        startSec: 12,
        durSec: 8,
        label: '小提琴上行',
        notes: [
          { note: 'C5', dur: '2n.', at: 0, vel: 0.4 },
          { note: 'E5', dur: '2n.', at: 2, vel: 0.45 },
          { note: 'G5', dur: '1n', at: 4, vel: 0.5 },
        ],
      }),
      makeDroneClip({
        lane: 'nx',
        inst: 'synth-pad',
        hold: ['C3', 'G3'],
        startSec: 0,
        durSec: 20,
        vel: 0.2,
        label: 'pad 底',
      }),
    );
    comp.durationSec = 20;
  }
  if (kind === 'march') {
    comp.clips.push(
      makeNoteClip({
        lane: 'mx',
        inst: 'cello',
        startSec: 0,
        durSec: 18,
        label: '低音步伐',
        notes: marchBass(0, 18),
      }),
      makeNoteClip({
        lane: 'mx',
        inst: 'trumpet',
        startSec: 4,
        durSec: 10,
        label: '小号主题',
        notes: [
          { note: 'D4', dur: '4n.', at: 0, vel: 0.6 },
          { note: 'F4', dur: '4n', at: 1.5, vel: 0.65 },
          { note: 'A4', dur: '2n', at: 2.5, vel: 0.7 },
          { note: 'G4', dur: '4n.', at: 4.5, vel: 0.65 },
          { note: 'F4', dur: '2n', at: 6, vel: 0.6 },
          { note: 'D4', dur: '2n.', at: 7.5, vel: 0.55 },
        ],
      }),
      makeDroneClip({
        lane: 'nx',
        inst: 'cello',
        hold: 'D2',
        startSec: 0,
        durSec: 18,
        vel: 0.2,
        label: '低音底',
      }),
    );
    comp.durationSec = 18;
  }
  return comp;
}

function pulseEF(start: number, end: number, interval: number) {
  const notes = [];
  let t = 0;
  let flip = false;
  const span = end - start;
  while (t < span) {
    notes.push({
      note: flip ? 'F2' : 'E2',
      dur: '8n',
      at: t,
      vel: 0.5 + (t / span) * 0.4,
    });
    flip = !flip;
    t += interval;
  }
  return notes;
}

function marchBass(start: number, end: number) {
  const notes = [];
  const pattern = ['D2', 'A2', 'D2', 'F2'];
  let t = 0;
  let i = 0;
  const span = end - start;
  while (t < span) {
    notes.push({ note: pattern[i % pattern.length], dur: '4n.', at: t, vel: 0.55 });
    t += 1.5;
    i++;
  }
  return notes;
}
