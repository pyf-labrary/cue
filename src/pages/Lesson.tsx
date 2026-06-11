/**
 * Lesson runner. Walks through one beat at a time. Reuses M5 widgets.
 *
 * compositionPlayer is a singleton; each beat that needs playback owns it
 * exclusively while mounted. Switching beats stops + resets it.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getLesson, LESSONS, type Lesson, type LessonBeat, type QuizQuestion } from '@/data/lessons';
import { markLessonDone } from '@/lib/lessonProgress';
import { TRACK_META, type TrackId } from '@/data/scenes';
import { getInstrument } from '@/data/instruments';
import { EMOTIONS } from '@/data/emotions';
import {
  type Composition,
  type ClipNote,
  emptyComposition,
  makeNoteClip,
  makeDroneClip,
  withClip,
  nextClipStart,
} from '@/lib/composition';
import { compositionPlayer, useCompositionPlayer } from '@/lib/compositionPlayer';
import { useTransportShortcuts, useLaneShortcuts } from '@/lib/useKeyboardShortcuts';
import {
  loadFromStorage,
  saveToStorage,
  readShareFromHash,
  stripShareFromHash,
  encodeComposition,
} from '@/lib/compositionShare';
import ExportControls from '@/components/sandbox/ExportControls';
import TrackEditor from '@/components/sandbox/TrackEditor';
import LoopPalette from '@/components/sandbox/LoopPalette';
import ShareControls from '@/components/sandbox/ShareControls';
import ScrubBar from '@/components/audio/ScrubBar';
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

  // Reaching the last step marks the lesson complete (shown on the index).
  const atLastStep = !!lesson && Math.min(stepIdx, lesson.beats.length - 1) === lesson.beats.length - 1;
  useEffect(() => {
    if (lesson && atLastStep) markLessonDone(lesson.id);
  }, [lesson, atLastStep]);

  if (!lesson) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <div className="text-ink-300">没找到这节课。</div>
        <Link to="/lessons" className="text-accent hover:underline mt-3 inline-block">← 回课程列表</Link>
      </div>
    );
  }

  // Clamp: when navigating from a longer lesson to a shorter one, the render
  // with the stale stepIdx happens BEFORE the reset effect — without the clamp
  // beats[stepIdx] is undefined and the whole app white-screens.
  const total = lesson.beats.length;
  const safeIdx = Math.min(stepIdx, total - 1);
  const beat = lesson.beats[safeIdx];

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
        {safeIdx === 0 && (
          <header className="mb-8">
            <p className="text-ink-200 leading-relaxed border-l-2 border-accent/40 pl-4">
              {lesson.intro}
            </p>
          </header>
        )}

        {/* Step content */}
        <BeatView lesson={lesson} beat={beat} />

        {/* Stepper */}
        <div className="mt-10 border-t border-ink-700/60 pt-6">
          <div className="flex items-center justify-center gap-2 mb-5" role="progressbar" aria-valuenow={safeIdx + 1} aria-valuemax={total}>
            {lesson.beats.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStepIdx(i)}
                aria-label={`第 ${i + 1} 步`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === safeIdx ? 28 : 14,
                  background: i < safeIdx ? 'rgba(230,195,107,0.55)' : i === safeIdx ? '#E6C36B' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={safeIdx === 0}
              onClick={() => setStepIdx(Math.max(0, safeIdx - 1))}
              className="text-sm text-ink-400 hover:text-ink-100 disabled:opacity-30 disabled:hover:text-ink-400 transition"
            >
              ← 上一步
            </button>
            <div className="font-mono text-xs text-ink-500">
              {safeIdx + 1} / {total}
            </div>
            {safeIdx < total - 1 ? (
              <button
                type="button"
                onClick={() => setStepIdx(safeIdx + 1)}
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
      return <MixBeat key={`${lesson.id}-mix`} body={beat.body} composition={beat.composition} goal={beat.goal} soloChecklist={beat.soloChecklist} />;
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
    case 'quiz':
      return <QuizBeat key={`${lesson.id}-quiz`} body={beat.body} questions={beat.questions} />;
    case 'outro':
      return <OutroBeat key={`${lesson.id}-outro`} body={beat.body} links={beat.links} />;
  }
}

/* -------------------------------------------------------------------------- */
/*  Quiz beat — untimed, explain on answer                                    */
/* -------------------------------------------------------------------------- */

function QuizBeat({ body, questions }: { body?: string; questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answered = Object.keys(picked).length;
  const correct = questions.filter((q, i) => picked[i] === q.answer).length;

  return (
    <div className="space-y-5">
      {body && <p className="text-ink-200 leading-relaxed">{body}</p>}
      {questions.map((q, qi) => {
        const sel = picked[qi];
        const done = sel !== undefined;
        return (
          <div key={qi} className="rounded-2xl border border-ink-700 bg-ink-800/40 px-6 py-5">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-mono text-accent text-sm">Q{qi + 1}</span>
              <span className="text-ink-100 leading-relaxed">{q.q}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer;
                const isSel = sel === oi;
                let color = 'rgba(255,255,255,0.12)';
                let text = '#B8B8C2';
                if (done && isAnswer) { color = '#6BC9A6'; text = '#6BC9A6'; }
                else if (done && isSel) { color = '#D86B6B'; text = '#D86B6B'; }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={done}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className="text-left px-4 py-2.5 rounded-xl border text-sm transition disabled:cursor-default"
                    style={{ borderColor: color, color: text }}
                  >
                    <span className="font-mono text-[10px] mr-2 opacity-60">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                    {done && isAnswer && <span className="ml-2">✓</span>}
                  </button>
                );
              })}
            </div>
            {done && (
              <div
                className="mt-4 text-[13px] leading-relaxed text-ink-200 border-l-2 pl-3"
                style={{ borderColor: sel === q.answer ? '#6BC9A6' : '#D86B6B' }}
              >
                <span className="mr-2" style={{ color: sel === q.answer ? '#6BC9A6' : '#D86B6B' }}>
                  {sel === q.answer ? '答对了。' : '不对——'}
                </span>
                {q.explain}
              </div>
            )}
          </div>
        );
      })}
      {answered === questions.length && (
        <div className="text-center text-sm text-ink-300">
          {correct === questions.length
            ? `全对（${correct}/${questions.length}）。耳朵已上线。`
            : `答对 ${correct}/${questions.length}。看完解释就够了——这不是考试。`}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Outro beat — "where to go from here"                                      */
/* -------------------------------------------------------------------------- */

function OutroBeat({
  body,
  links,
}: {
  body: string;
  links: Array<{ to: string; label: string; note: string; external?: boolean }>;
}) {
  return (
    <div className="space-y-5">
      <p className="text-ink-200 leading-relaxed whitespace-pre-line border-l-2 border-accent/40 pl-4">{body}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {links.map((l) =>
          l.external ? (
            <a
              key={l.to}
              href={l.to}
              target="_blank"
              rel="noreferrer"
              className="block px-5 py-4 rounded-2xl border border-ink-700 hover:border-accent/50 transition group"
            >
              <div className="font-serif text-lg text-ink-100 group-hover:text-accent transition">
                {l.label} <span className="text-ink-500 text-xs align-super">↗</span>
              </div>
              <div className="text-[13px] text-ink-400 mt-1 leading-relaxed">{l.note}</div>
            </a>
          ) : (
            <Link
              key={l.to}
              to={l.to}
              className="block px-5 py-4 rounded-2xl border border-ink-700 hover:border-accent/50 transition group"
            >
              <div className="font-serif text-lg text-ink-100 group-hover:text-accent transition">{l.label} →</div>
              <div className="text-[13px] text-ink-400 mt-1 leading-relaxed">{l.note}</div>
            </Link>
          ),
        )}
      </div>
    </div>
  );
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

function MixBeat({
  body,
  composition,
  goal,
  soloChecklist,
}: {
  body: string;
  composition: Composition;
  goal?: string;
  soloChecklist?: boolean;
}) {
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

  // Solo checklist — light up each lane badge once the user has soloed it.
  const [soloed, setSoloed] = useState<Set<TrackId>>(() => new Set());
  useEffect(() => {
    if (comp.laneSolo) {
      const lane = comp.laneSolo;
      setSoloed((s) => (s.has(lane) ? s : new Set(s).add(lane)));
    }
  }, [comp.laneSolo]);
  const allLanes: TrackId[] = ['dx', 'mx', 'fx', 'nx', 'vo'];
  const allDone = allLanes.every((l) => soloed.has(l));

  return (
    <div className="space-y-4">
      <p className="text-ink-200 leading-relaxed">{body}</p>
      {goal && <div className="text-[12px] text-accent border-l-2 border-accent pl-3">目标 · {goal}</div>}
      {soloChecklist && (
        <div className="flex flex-wrap items-center gap-2">
          {allLanes.map((l) => {
            const done = soloed.has(l);
            const meta = TRACK_META[l];
            return (
              <span
                key={l}
                className="font-mono text-[10px] px-2 py-1 rounded-full border transition"
                style={{
                  color: done ? meta.color : 'rgba(184,184,194,0.4)',
                  borderColor: done ? meta.color : 'rgba(255,255,255,0.1)',
                  background: done ? `${meta.color}1a` : 'transparent',
                }}
              >
                {done ? '✓ ' : ''}{meta.en} 已单听
              </span>
            );
          })}
          {allDone && <span className="text-[12px] text-accent">五条都听过了——你已经会拆一场戏了。</span>}
        </div>
      )}
      <Transport playing={playing} state={state} comp={comp} />
      <TrackEditor
        composition={comp}
        currentSec={state.currentSec}
        onChangeComposition={setComp}
        onSeek={(s) => compositionPlayer.seek(s)}
        editable={false}
      />
      <TakeToSandbox getComp={() => comp} />
    </div>
  );
}

/** "Open in Playground" — carry the current example state into the sandbox. */
function TakeToSandbox({ getComp }: { getComp: () => Composition }) {
  const navigate = useNavigate();
  return (
    <div className="text-right">
      <button
        type="button"
        onClick={() => {
          const comp = getComp();
          saveToStorage('sandbox', comp);
          navigate(`/sandbox?s=${encodeComposition(comp)}`);
        }}
        className="text-[12px] px-3 py-1.5 rounded-full border border-ink-700 text-ink-400 hover:text-accent hover:border-accent transition"
        title="把当前状态原样带进完整试听台，继续自由编辑"
      >
        带着这个例子去试听台 →
      </button>
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
        {insts.map((id) => {
          const emo = dominantEmotion(id);
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className="px-3 py-1.5 rounded-full text-sm border transition"
              style={{
                color: isActive ? '#0F0F12' : emo?.hue ?? '#E3E3EA',
                background: isActive ? emo?.hue ?? '#E6C36B' : 'transparent',
                borderColor: isActive ? emo?.hue ?? '#E6C36B' : `${emo?.hue ?? '#5A5A66'}55`,
              }}
            >
              {instLabel(id)}
              {emo && <span className="ml-1.5 text-[10px] opacity-75">{emo.label}</span>}
            </button>
          );
        })}
      </div>
      <Transport playing={playing} state={state} comp={compFor} />
      <div
        className="rounded-2xl border bg-ink-800/40 px-6 py-8 transition-colors duration-300"
        style={{ borderColor: `${dominantEmotion(active)?.hue ?? '#3A3A45'}55` }}
      >
        <div className="text-center">
          <div className="h-eyebrow text-ink-400">现在演的是</div>
          <div className="h-display text-3xl text-ink-100 mt-2">{instLabel(active)}</div>
          {dominantEmotion(active) && (
            <div className="text-sm mt-2" style={{ color: dominantEmotion(active)!.hue }}>
              最擅长 · {dominantEmotion(active)!.label}
            </div>
          )}
          <div className="font-mono text-xs text-ink-500 mt-2 tabular-nums">
            {fmt(state.currentSec)} / {fmt(compFor.durationSec)}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The instrument's strongest emotion from its atlas radar — drives coloring. */
function dominantEmotion(instId: string) {
  const inst = getInstrument(instId);
  if (!inst) return null;
  let best: { id: string; v: number } | null = null;
  for (const [eid, v] of Object.entries(inst.emotionRadar)) {
    if (v != null && (!best || v > best.v)) best = { id: eid, v };
  }
  if (!best) return null;
  return EMOTIONS.find((e) => e.id === best!.id) ?? null;
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
      <TakeToSandbox getComp={() => comp} />
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
    const startSec = nextClipStart(comp, loop.suggestedLane, state.currentSec, loop.durSec);
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4">
        <div className="text-[13px] text-ink-200">
          <span className="text-accent">毕业作品</span> · 拼好之后导出成音频文件，它就是你的第一条 cue。
        </div>
        <ExportControls durationSec={comp.durationSec} getVideoEl={() => null} slug="lesson-l5" />
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
    <div className="rounded-2xl border border-ink-700 bg-ink-800/40 px-5 py-3 space-y-2">
      <div className="flex items-center gap-3">
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
        <div className="flex-1 mx-3 opacity-70 max-w-[200px] hidden sm:block">
          <SpectrumStrip height={20} />
        </div>
        <div className="ml-auto font-mono text-sm text-ink-300 tabular-nums">
          {fmt(state.currentSec)} <span className="text-ink-500">/</span> {fmt(comp.durationSec)}
        </div>
      </div>
      <ScrubBar
        durationSec={comp.durationSec}
        currentSec={state.currentSec}
        playing={playing}
      />
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
