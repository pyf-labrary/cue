import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getScene, CONCEPT_META, type Scene } from '@/data/scenes';
import { EMOTIONS } from '@/data/emotions';
import { getInstrument } from '@/data/instruments';
import MultiTrackPlayer from '@/components/audio/MultiTrackPlayer';
import { useTransportShortcuts } from '@/lib/useKeyboardShortcuts';
import { sceneToComposition } from '@/lib/composition';
import { encodeComposition, saveToStorage } from '@/lib/compositionShare';
import { RESCORES, NO_SCORE_NOTES, type ScoreMode } from '@/data/rescores';

/** Same picture, different score — the variant fed into the player. */
function buildVariant(scene: Scene, mode: ScoreMode): Scene {
  if (mode === 'original') return scene;
  if (mode === 'none') {
    return {
      ...scene,
      mxAudio: undefined,
      tracks: { ...scene.tracks, mx: [] },
      annotations: [],
    };
  }
  const r = RESCORES[scene.slug];
  if (!r) return scene;
  return {
    ...scene,
    mxAudio: undefined,
    tracks: {
      mx: r.mx,
      fx: r.fx ?? scene.tracks.fx,
      nx: r.nx ?? scene.tracks.nx,
    },
    annotations: [],
  };
}

export default function SceneDetail() {
  const { slug = '' } = useParams();
  const scene = getScene(slug);
  const navigate = useNavigate();
  useTransportShortcuts();

  const [mode, setMode] = useState<ScoreMode>('original');
  useEffect(() => setMode('original'), [slug]);
  const variant = useMemo(() => (scene ? buildVariant(scene, mode) : undefined), [scene, mode]);

  function openInSandbox() {
    if (!scene || !variant) return;
    const comp = sceneToComposition(variant);
    // Stash to sandbox slot so even a refresh keeps it; also stuff into URL
    // so the address bar reflects what's loaded.
    saveToStorage('sandbox', comp);
    const encoded = encodeComposition(comp);
    navigate(`/sandbox?s=${encoded}`);
  }

  if (!scene) {
    return (
      <section className="max-w-[720px] mx-auto px-6 py-32">
        <div className="h-eyebrow mb-4">未找到</div>
        <h1 className="h-display text-4xl text-ink-100 mb-6">「{slug}」还没收录</h1>
        <Link to="/scenes" className="btn-ghost">回到场景列表</Link>
      </section>
    );
  }

  const concept = CONCEPT_META[scene.concept];

  return (
    <article className="max-w-[1280px] mx-auto px-6 py-16">
      <Link to="/scenes" className="h-eyebrow hover:text-accent transition inline-block mb-6">
        ← 场景拆解
      </Link>

      {/* Cover banner */}
      <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-10 bg-ink-900 border border-ink-700/60">
        <img
          src={`${import.meta.env.BASE_URL}scenes/${scene.slug}/cover.jpg`}
          alt={scene.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="font-mono text-[10px] text-accent tracking-widest mb-2">
            {concept.label.toUpperCase()}
          </div>
          <h1 className="h-display text-4xl md:text-6xl leading-[1.05] text-ink-100">{scene.title}</h1>
          <div className="font-serif text-base md:text-xl text-ink-200/80 mt-2">
            《{scene.film}》 · {scene.year} · {scene.composer}
          </div>
        </div>
      </div>

      {/* HERO */}
      <header className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start mb-12">
        <div>
          {scene.description.split('\n\n').map((para, i) => (
            <p key={i} className="text-ink-200 text-[15px] leading-relaxed mb-4 max-w-[560px]">
              {para}
            </p>
          ))}

          <div className="mt-6 flex flex-wrap gap-2">
            {scene.emotions.map((eid) => {
              const e = EMOTIONS.find((x) => x.id === eid)!;
              return (
                <span
                  key={eid}
                  className="px-3 py-1 rounded-full text-xs tracking-wide"
                  style={{ background: `${e.hue}1f`, color: e.hue, border: `1px solid ${e.hue}55` }}
                >
                  {e.label}
                </span>
              );
            })}
          </div>
        </div>

        <aside className="lg:pt-4">
          <div className="rounded-2xl border border-accent/40 bg-ink-800/40 p-6">
            <div className="h-eyebrow mb-3 text-accent">本场景演示的手法</div>
            <h2 className="font-serif text-2xl text-ink-100 mb-3">{concept.label}</h2>
            <p className="text-ink-200 leading-relaxed text-[15px]">{concept.def}</p>
          </div>

          <div className="mt-6">
            <div className="h-eyebrow mb-3">用到的乐器</div>
            <div className="space-y-2">
              {scene.instruments.map((id) => {
                const inst = getInstrument(id);
                if (!inst) return null;
                return (
                  <Link
                    key={id}
                    to={`/atlas/${id}`}
                    className="flex items-baseline gap-3 px-4 py-2.5 rounded-xl border border-ink-700 hover:border-accent transition group"
                  >
                    <span className="font-serif text-lg text-ink-100 group-hover:text-accent transition">
                      {inst.name}
                    </span>
                    <span className="text-ink-400 text-sm">{inst.en}</span>
                    <span className="ml-auto text-ink-400 text-xs">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </header>

      {/* PLAYER */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="h-eyebrow">五轨拆解</div>
            <h2 className="h-display text-3xl text-ink-100 mt-1">点 Solo 单听一条；点 Mute 关一条。</h2>
          </div>
          <button
            type="button"
            onClick={openInSandbox}
            className="text-[12px] px-3 py-1.5 rounded-full border border-ink-700 text-ink-300 hover:text-accent hover:border-accent transition"
            title="复制当前配法到试听台，自由增删 clip"
          >
            在试听台打开 →
          </button>
        </div>

        <RescoreSwitch scene={scene} mode={mode} onChange={setMode} />

        <MultiTrackPlayer scene={variant ?? scene} />
        <p className="mt-4 text-ink-400 text-sm max-w-[640px] leading-relaxed">
          这段配乐是在浏览器里用我们图鉴中的乐器合成出来的——不是从原片剪的。所以你可以拆开听 MX
          只剩 NX、可以单 solo FX 听清每一次 stinger，是配乐教学场景，不是版权片段。
        </p>
      </section>

      {/* All annotations */}
      <section>
        <div className="h-eyebrow mb-3">导演笔记 · 完整时间轴</div>
        <h2 className="h-display text-3xl text-ink-100 mb-6">逐条看一遍</h2>
        <div className="space-y-3">
          {scene.annotations.map((a, i) => (
            <div
              key={i}
              className="grid grid-cols-[80px_60px_1fr] gap-4 p-4 rounded-xl border border-ink-700 hover:border-ink-500 transition"
            >
              <div className="font-mono text-accent text-sm">{fmt(a.at)}</div>
              <div>
                {a.track && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                    {a.track.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-ink-100 leading-relaxed">{a.text}</div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/* -------------------------------------------------------------------------- */
/*  Re-score switch — same picture, three scores                              */
/* -------------------------------------------------------------------------- */

function RescoreSwitch({
  scene,
  mode,
  onChange,
}: {
  scene: Scene;
  mode: ScoreMode;
  onChange: (m: ScoreMode) => void;
}) {
  const rescore = RESCORES[scene.slug];
  if (!rescore) return null;

  const origEmotion = EMOTIONS.find((e) => e.id === scene.emotions[0])!;
  const altEmotion = EMOTIONS.find((e) => e.id === rescore.emotion)!;

  const options: Array<{ id: ScoreMode; label: string; sub: string; hue: string }> = [
    { id: 'original', label: '原配', sub: origEmotion.label, hue: origEmotion.hue },
    { id: 'alt', label: rescore.label, sub: altEmotion.label, hue: altEmotion.hue },
    { id: 'none', label: '无配乐', sub: '只剩画面', hue: '#8A8A95' },
  ];
  const active = options.find((o) => o.id === mode)!;
  const note =
    mode === 'original'
      ? '这是原配的思路。点上面任何一个换配法——画面与播放进度不动，只换音乐。同一场戏会变成另一个故事。'
      : mode === 'alt'
        ? rescore.note
        : NO_SCORE_NOTES[scene.slug] ?? '没有音乐的版本。';

  return (
    <div className="mb-4 rounded-2xl border border-ink-700 bg-ink-800/40 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="h-eyebrow mr-2 text-ink-400">换一种配法</span>
        {options.map((o) => {
          const isActive = o.id === mode;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className="px-3.5 py-1.5 rounded-full text-[13px] border transition"
              style={{
                color: isActive ? '#0F0F12' : o.hue,
                background: isActive ? o.hue : 'transparent',
                borderColor: isActive ? o.hue : `${o.hue}66`,
              }}
            >
              {o.label}
              <span className="ml-1.5 text-[10px] opacity-70 font-mono">{o.sub}</span>
            </button>
          );
        })}
      </div>
      <p
        className="text-[13px] leading-relaxed text-ink-200 border-l-2 pl-3"
        style={{ borderColor: active.hue }}
      >
        {note}
      </p>
    </div>
  );
}
