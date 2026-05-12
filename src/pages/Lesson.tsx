/**
 * Lesson runner. Walks through one beat at a time. Reuses M5 widgets.
 *
 * compositionPlayer is a singleton; each beat that needs playback owns it
 * exclusively while mounted. Switching beats stops + resets it.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLesson, LESSONS, type Lesson, type LessonBeat } from '@/data/lessons';
import {
  type Composition,
  type ClipNote,
  emptyComposition,
  makeNoteClip,
  makeDroneClip,
  withClip,
} from '@/lib/composition';
import { compositionPlayer, useCompositionPlayer } from '@/lib/compositionPlayer';
import { useTransportShortcuts, useLaneShortcuts } from '@/lib/useKeyboardShortcuts';
import {
  loadFromStorage,
  saveToStorage,
  readShareFromHash,
  stripShareFromHash,
} from '@/lib/compositionShare';
import TrackEditor from '@/components/sandbox/TrackEditor';
import LoopPalette from '@/components/sandbox/LoopPalette';
import ShareControls from '@/components/sandbox/ShareControls';
import SpectrumStrip from '@/components/visual/SpectrumStrip';
import type { Loop } from '@/data/loops';

export default function LessonPage() {
  const { id = '' } = useParams();
  const lesson = getLesson(id);
  const [stepIdx, setStepIdx] = useState(0);
  useTransportShortcuts();

  // Reset to step 0 + stop player whenever lesson changes
  useEffect(() => {
    compositionPlayer.dispose();
    setStepIdx(0);
    return () => compositionPlayer.dispose();
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <div className="text-ink-300">没找到这节课。</div>
        <Link to="/lessons" className="text-accent hover:underline mt-3 inline-block">← 回课程列表</Link>
      </div>
    );
  }

  const beat = lesson.beats[stepIdx];
  const total = lesson.beats.length;

  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Cover banner */}
        <Link to="/lessons" className="text-xs text-ink-400 hover:text-accent transition inline-block mb-4">
          ← 五课总览
        </Link>
        <div className="relative aspect-[16/7] rounded-2xl overflow-hidden mb-8 border border-ink-700/60">
          <img
            src={`${import.meta.env.BASE_URL}lessons/${lesson.id}.jpg`}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="font-mono text-[10px] tracking-widest text-accent">课 {String(lesson.num).padStart(2, '0')}</div>
            <h1 className="h-display text-3xl md:text-5xl mt-1 text-ink-100">{lesson.title}</h1>
            <p className="mt-2 text-ink-200/90 max-w-[640px]">{lesson.subtitle}</p>
          </div>
        </div>

        {/* Intro pull-quote (only on first step) */}
        {stepIdx === 0 && (
          <header className="mb-8">
            <p className="text-ink-200 leading-relaxed border-l-2 border-accent/40 pl-4">
              {lesson.intro}
            </p>
          </header>
        )}

        {/* Step content */}
        <BeatView lesson={lesson} beat={beat} />

        {/* Stepper */}
        <div className="mt-10 flex items-center justify-between border-t border-ink-700/60 pt-6">
          <button
            type="button"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            className="text-sm text-ink-400 hover:text-ink-100 disabled:opacity-30 disabled:hover:text-ink-400 transition"
          >
            ← 上一步
          </button>
          <div className="font-mono text-xs text-ink-500">
            {stepIdx + 1} / {total}
          </div>
          {stepIdx < total - 1 ? (
            <button
              type="button"
              onClick={() => setStepIdx((i) => i + 1)}
              className="text-sm text-accent hover:underline"
            >
              下一步 →
            </button>
          ) : (
            <NextLessonLink lesson={lesson} />
          )}
        </div>
      </div>
    </div>
  );
}

function NextLessonLink({ lesson }: { lesson: Lesson }) {
  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const next = LESSONS[idx + 1];
  if (!next) {
    return <Link to="/lessons" className="text-sm text-accent hover:underline">回课程列表 →</Link>;
  }
  return (
    <Link to={`/lessons/${next.id}`} className="text-sm text-accent hover:underline">
      下一课：{next.title} →
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Beat dispatcher                                                           */
/* -------------------------------------------------------------------------- */

function BeatView({ lesson, beat }: { lesson: Lesson; beat: LessonBeat }) {
  switch (beat.kind) {
    case 'text':
      return <TextBeat heading={beat.heading} body={beat.body} />;
    case 'mix':
      return <MixBeat key={`${lesson.id}-mix`} body={beat.body} composition={beat.composition} goal={beat.goal} />;
    case 'inst-swap':
      return (
        <InstSwapBeat
          key={`${lesson.id}-iswap`}
          body={beat.body}
          phrase={beat.phrase}
          durSec={beat.durSec}
          insts={beat.insts}
          drone={beat.drone}
        />
      );
    case 'ab':
      return (
        <ABBeat
          key={`${lesson.id}-ab`}
          body={beat.body}
          aLabel={beat.aLabel}
          bLabel={beat.bLabel}
          a={beat.a}
          b={beat.b}
          reveal={beat.reveal}
        />
      );
    case 'hit-point':
      return (
        <HitPointBeat
          key={`${lesson.id}-hp`}
          body={beat.body}
          composition={beat.composition}
          hits={beat.hits}
        />
      );
    case 'sandbox':
      return <SandboxBeat key={`${lesson.id}-sb`} body={beat.body} starter={beat.starter} />;
  }
}

function TextBeat({ heading, body }: { heading?: string; body: string }) {
  return (
    <div className="rounded-2xl bg-ink-800/40 border border-ink-700 px-7 py-6">
      {heading && <h2 className="h-display text-2xl text-ink-100 mb-3">{heading}</h2>}
      <p className="text-ink-200 leading-relaxed whitespace-pre-line">{body}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mix beat — TrackEditor + transport                                        */
/* -------------------------------------------------------------------------- */

function MixBeat({ body, composition, goal }: { body: string; composition: Composition; goal?: string }) {
  const [comp, setComp] = useState<Composition>(composition);
  const state = useCompositionPlayer();
  const playing = state.status === 'playing';
  useLaneShortcuts({ composition: comp, onCompositionChange: setComp });

  useEffect(() => {
    void compositionPlayer.setComposition(composition);
    setComp(composition);
    return () => compositionPlayer.dispose();
  }, [composition]);

  useEffect(() => {
    compositionPlayer.patchComposition(comp);
  }, [comp]);

  return (
    <div className="space-y-4">
      <p className="text-ink-200 leading-relaxed">{body}</p>
      {goal && <div className="text-[12px] text-accent border-l-2 border-accent pl-3">目标 · {goal}</div>}
      <Transport playing={playing} state={state} comp={comp} />
      <TrackEditor
        composition={comp}
        currentSec={state.currentSec}
        onChangeComposition={setComp}
        onSeek={(s) => compositionPlayer.seek(s)}
        editable={false}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Instrument-swap beat                                                      */
/* -------------------------------------------------------------------------- */

function InstSwapBeat({
  body,
  phrase,
  durSec,
  insts,
  drone,
}: {
  body: string;
  phrase: ClipNote[];
  durSec: number;
  insts: string[];
  drone?: { inst: string; hold: string | string[]; vel?: number };
}) {
  const [active, setActive] = useState(insts[0]);
  const state = useCompositionPlayer();
  const playing = state.status === 'playing';

  const compFor = useMemo(() => {
    const c = emptyComposition(durSec + 0.5);
    const phraseClip = makeNoteClip({
      lane: 'mx',
      inst: active,
      label: instLabel(active),
      startSec: 0,
      durSec,
      notes: phrase,
    });
    c.clips.push(phraseClip);
    if (drone) {
      c.clips.push(
        makeDroneClip({
          lane: 'nx',
          inst: drone.inst,
          hold: drone.hold,
          startSec: 0,
          durSec: durSec + 0.5,
          vel: drone.vel ?? 0.3,
          label: 'pad',
        }),
      );
    }
    return c;
  }, [active, phrase, durSec, drone]);

  useEffect(() => {
    void compositionPlayer.setComposition(compFor);
    return () => compositionPlayer.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    compositionPlayer.patchComposition(compFor);
  }, [compFor]);

  return (
    <div className="space-y-4">
      <p className="text-ink-200 leading-relaxed">{body}</p>
      <div className="flex flex-wrap gap-2">
        {insts.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              active === id
                ? 'bg-accent text-ink-900 border-accent'
                : 'border-ink-700 text-ink-200 hover:border-accent/50'
            }`}
          >
            {instLabel(id)}
          </button>
        ))}
      </div>
      <Transport playing={playing} state={state} comp={compFor} />
      <div className="rounded-2xl border border-ink-700 bg-ink-800/40 px-6 py-8">
        <div className="text-center">
          <div className="h-eyebrow text-ink-400">现在演的是</div>
          <div className="h-display text-3xl text-ink-100 mt-2">{instLabel(active)}</div>
          <div className="font-mono text-xs text-ink-500 mt-2 tabular-nums">
            {fmt(state.currentSec)} / {fmt(compFor.durationSec)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  A/B beat                                                                  */
/* -------------------------------------------------------------------------- */

function ABBeat({
  body,
  aLabel,
  bLabel,
  a,
  b,
  reveal,
}: {
  body: string;
  aLabel: string;
  bLabel: string;
  a: Composition;
  b: Composition;
  reveal: string;
}) {
  const [side, setSide] = useState<'a' | 'b' | null>(null);
  const [heardBoth, setHeardBoth] = useState({ a: false, b: false });
  const state = useCompositionPlayer();

  useEffect(() => {
    return () => compositionPlayer.dispose();
  }, []);

  function load(which: 'a' | 'b') {
    setSide(which);
    setHeardBoth((h) => ({ ...h, [which]: true }));
    void compositionPlayer.setComposition(which === 'a' ? a : b).then(() => compositionPlayer.play());
  }

  return (
    <div className="space-y-4">
      <p className="text-ink-200 leading-relaxed">{body}</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => load('a')}
          className={`rounded-2xl border px-6 py-8 text-left transition ${
            side === 'a' ? 'border-accent bg-accent/10' : 'border-ink-700 bg-ink-800/40 hover:border-accent/40'
          }`}
        >
          <div className="h-eyebrow text-ink-400">{heardBoth.a ? '已听' : '点这里'}</div>
          <div className="h-display text-2xl text-ink-100 mt-2">{aLabel}</div>
        </button>
        <button
          type="button"
          onClick={() => load('b')}
          className={`rounded-2xl border px-6 py-8 text-left transition ${
            side === 'b' ? 'border-accent bg-accent/10' : 'border-ink-700 bg-ink-800/40 hover:border-accent/40'
          }`}
        >
          <div className="h-eyebrow text-ink-400">{heardBoth.b ? '已听' : '点这里'}</div>
          <div className="h-display text-2xl text-ink-100 mt-2">{bLabel}</div>
        </button>
      </div>
      <div className="flex items-center gap-3 text-sm text-ink-400">
        <button
          type="button"
          onClick={() => (state.status === 'playing' ? compositionPlayer.pause() : compositionPlayer.play())}
          disabled={!side}
          className="px-3 py-1 rounded-full border border-ink-700 hover:border-accent/40 disabled:opacity-30"
        >
          {state.status === 'playing' ? '暂停' : '继续播放'}
        </button>
        <button
          type="button"
          onClick={() => compositionPlayer.stop()}
          disabled={!side}
          className="px-3 py-1 rounded-full border border-ink-700 hover:border-accent/40 disabled:opacity-30"
        >
          停
        </button>
        <span className="font-mono text-xs text-ink-500 tabular-nums ml-2">{fmt(state.currentSec)}</span>
      </div>
      {heardBoth.a && heardBoth.b && (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 px-5 py-4 text-ink-100 leading-relaxed whitespace-pre-line">
          <div className="h-eyebrow text-accent mb-2">揭晓</div>
          {reveal}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hit-point beat                                                            */
/* -------------------------------------------------------------------------- */

function HitPointBeat({ body, composition, hits }: { body: string; composition: Composition; hits: number[] }) {
  const [comp, setComp] = useState<Composition>(composition);
  const state = useCompositionPlayer();
  const playing = state.status === 'playing';
  useLaneShortcuts({ composition: comp, onCompositionChange: setComp });

  useEffect(() => {
    void compositionPlayer.setComposition(composition);
    setComp(composition);
    return () => compositionPlayer.dispose();
  }, [composition]);

  useEffect(() => {
    compositionPlayer.patchComposition(comp);
  }, [comp]);

  const pct = (state.currentSec / comp.durationSec) * 100;
  const activeHit = hits.findIndex((h) => Math.abs(h - state.currentSec) < 0.25);

  return (
    <div className="space-y-4">
      <p className="text-ink-200 leading-relaxed whitespace-pre-line">{body}</p>
      <Transport playing={playing} state={state} comp={comp} />

      {/* Hit-point strip */}
      <div className="rounded-2xl border border-ink-700 bg-ink-800/40 px-6 py-5">
        <div className="h-eyebrow text-ink-400 mb-3">剪辑卡点</div>
        <div className="relative h-12">
          <div className="absolute inset-x-0 top-5 h-px bg-ink-700" />
          {hits.map((h, i) => {
            const isActive = i === activeHit;
            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${(h / comp.durationSec) * 100}%`, top: 0 }}
              >
                <div
                  className="w-3 h-3 rounded-full transition"
                  style={{
                    background: isActive ? '#E6C36B' : '#D86B6B',
                    boxShadow: isActive ? '0 0 12px #E6C36B' : 'none',
                  }}
                />
                <div className="h-3 w-px bg-ink-500 mt-0.5" />
                <div className={`font-mono text-[10px] mt-1 ${isActive ? 'text-accent' : 'text-ink-400'} tabular-nums`}>
                  {h.toFixed(1)}s
                </div>
              </div>
            );
          })}
          <div
            className="absolute top-0 w-px h-full bg-ink-100"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>

      <TrackEditor
        composition={comp}
        currentSec={state.currentSec}
        onChangeComposition={setComp}
        onSeek={(s) => compositionPlayer.seek(s)}
        editable={false}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sandbox beat (lesson 5)                                                   */
/* -------------------------------------------------------------------------- */

function SandboxBeat({ body, starter }: { body: string; starter: Composition }) {
  const storageKey = 'lesson:l5';
  const [comp, setComp] = useState<Composition>(() => {
    const shared = readShareFromHash();
    if (shared) {
      stripShareFromHash();
      return shared;
    }
    return loadFromStorage(storageKey) ?? starter;
  });
  const state = useCompositionPlayer();
  const playing = state.status === 'playing';
  useLaneShortcuts({ composition: comp, onCompositionChange: setComp });

  // Initial warm — only on first mount or when the starter identity changes
  // (lesson switch). We don't want to clobber the user's edits.
  const [warmed, setWarmed] = useState(false);
  useEffect(() => {
    void compositionPlayer.setComposition(comp).then(() => setWarmed(true));
    return () => compositionPlayer.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starter]);
  useEffect(() => {
    if (!warmed) return;
    compositionPlayer.patchComposition(comp);
    saveToStorage(storageKey, comp);
  }, [comp, warmed]);

  function addLoop(loop: Loop) {
    const startSec = Math.min(state.currentSec, Math.max(0, comp.durationSec - loop.durSec));
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
    setComp((c) => withClip(c, clip));
  }
  return (
    <div className="space-y-4">
      <p className="text-ink-200 leading-relaxed whitespace-pre-line">{body}</p>
      <Transport playing={playing} state={state} comp={comp} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-500 -mt-1">
        <span>你的编辑会自动保存；分享按钮把它编码成链接，对方打开就能听到。</span>
        <ShareControls
          composition={comp}
          storageKey={storageKey}
          compact
          onReset={() => setComp(starter)}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        <LoopPalette onPick={addLoop} />
        <TrackEditor
          composition={comp}
          currentSec={state.currentSec}
          onChangeComposition={setComp}
          onSeek={(s) => compositionPlayer.seek(s)}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared transport bar                                                      */
/* -------------------------------------------------------------------------- */

function Transport({
  playing,
  state,
  comp,
}: {
  playing: boolean;
  state: { status: string; currentSec: number };
  comp: Composition;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800/40 px-5 py-3">
      <button
        type="button"
        onClick={() => (playing ? compositionPlayer.pause() : compositionPlayer.play())}
        disabled={state.status === 'loading'}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-ink-900 hover:scale-105 transition disabled:opacity-30"
        title={playing ? '暂停' : '播放'}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <rect x="2" y="2" width="3" height="8" fill="currentColor" />
            <rect x="7" y="2" width="3" height="8" fill="currentColor" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={() => compositionPlayer.stop()}
        className="text-xs text-ink-400 hover:text-ink-200 transition px-3 py-1 rounded-full border border-ink-700"
      >
        回起点
      </button>
      <div className="flex-1 mx-3 opacity-70 max-w-[260px] hidden sm:block">
        <SpectrumStrip height={20} />
      </div>
      <div className="ml-auto font-mono text-sm text-ink-300 tabular-nums">
        {fmt(state.currentSec)} <span className="text-ink-500">/</span> {fmt(comp.durationSec)}
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

const INST_LABELS: Record<string, string> = {
  cello: '大提琴',
  violin: '小提琴',
  contrabass: '低音提琴',
  flute: '长笛',
  clarinet: '单簧管',
  oboe: '双簧管',
  'french-horn': '圆号',
  trumpet: '小号',
  piano: '钢琴',
  'pipe-organ': '管风琴',
  xylophone: '木琴',
  celesta: '钢片琴',
  timpani: '定音鼓',
  taiko: '太鼓',
  erhu: '二胡',
  pipa: '琵琶',
  guzheng: '古筝',
  guqin: '古琴',
  choir: '合唱',
  'synth-pad': '合成 Pad',
  'pizzicato-strings': '拨弦',
};

function instLabel(id: string): string {
  return INST_LABELS[id] ?? id;
}
