import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmotionWheel from '@/components/visual/EmotionWheel';
import { FrequencyBars, SoundWave, LaneStripes } from '@/components/visual/Decorations';
import { EMOTIONS, type Emotion } from '@/data/emotions';
import { INSTRUMENTS, getInstrument } from '@/data/instruments';
import { audioEngine } from '@/lib/audioEngine';

/** Resolve an emotion's 15s preview mp3 (public/emotions/<id>.mp3) under BASE_URL. */
function previewSrc(e: Emotion): string | null {
  return e.loop ? `${import.meta.env.BASE_URL}${e.loop}` : null;
}

export default function Home() {
  const [active, setActive] = useState<Emotion>(EMOTIONS[3]); // sorrow as default opening
  const sigInstruments = active.signatureInstruments.slice(0, 3);

  // Drive the preview straight through the audio engine: each emotion plays its
  // own MiniMax-generated 15s instrumental mp3. Subscribe to the engine so the
  // "播放中…" / "听一下 →" toggle reflects which clip is actually sounding.
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);
  useEffect(() => audioEngine.subscribe(setPlayingSrc), []);
  const previewing = EMOTIONS.find((e) => previewSrc(e) === playingSrc)?.id ?? null;

  const previewEmotion = (e: Emotion) => {
    setActive(e);
    const src = previewSrc(e);
    if (src) audioEngine.play(src, { fadeMs: 250, volume: 0.9 });
  };

  // Stop any preview when leaving the page so it doesn't bleed into a scene.
  useEffect(() => () => audioEngine.stop(), []);

  return (
    <div className="relative isolate">
      {/* Background hero image, faded — sits behind content */}
      <div className="absolute inset-x-0 top-0 h-[820px] overflow-hidden pointer-events-none z-0">
        <img
          src={`${import.meta.env.BASE_URL}home/hero.jpg`}
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/30 via-ink-900/70 to-ink-900" />
      </div>

      {/* HERO */}
      <section className="relative z-10 max-w-[1280px] mx-auto px-6 pt-16 pb-10 grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
        <div>
          <div className="h-eyebrow mb-6">A primer for directors · 影视配乐入门</div>
          <h1 className="h-display text-[40px] sm:text-[52px] md:text-[64px] leading-[1.08] text-ink-100 mb-6">
            音色是<span className="text-accent">情绪</span>的载体。<br />
            学配乐，先学<span className="text-accent">听</span>。
          </h1>
          <p className="text-ink-200 text-lg leading-relaxed max-w-[480px] mb-8">
            旋转下面这只轮盘——12 种最常用的情绪，每一种背后都站着几件最擅长讲它的乐器。
            导演不一定要会作曲，但必须先认得这些声音。
          </p>
          <div className="flex gap-3">
            <Link to="/lessons" className="btn-ghost">入门五课</Link>
            <Link to="/atlas" className="btn-ghost">乐器图鉴</Link>
          </div>
          <div className="mt-10 max-w-[420px] opacity-70">
            <FrequencyBars bars={28} height={50} color={active.hue} />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <EmotionWheel
              active={active}
              onHover={setActive}
              onSelect={previewEmotion}
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-center">
              <button
                type="button"
                onClick={() => previewEmotion(active)}
                className="px-4 py-1.5 rounded-full text-[12px] tracking-widest uppercase font-mono border transition"
                style={{
                  borderColor: active.hue,
                  color: previewing === active.id ? '#0F0F12' : active.hue,
                  background: previewing === active.id ? active.hue : 'transparent',
                }}
              >
                {previewing === active.id ? '播放中…' : '听一下 →'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE EMOTION DETAIL */}
      <section
        className="relative z-10 border-t border-ink-700/60"
        style={{
          background: `linear-gradient(180deg, ${active.hue}14 0%, transparent 60%)`,
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-16 grid lg:grid-cols-[1fr_1.2fr] gap-12">
          <div>
            <div className="h-eyebrow mb-3" style={{ color: active.hue }}>
              当下情绪
            </div>
            <h2 className="h-display text-5xl text-ink-100 mb-4">{active.label}</h2>
            <p className="text-ink-200 text-lg leading-relaxed mb-8">{active.blurb}</p>

            <div className="border-l-2 pl-5 py-2 text-ink-200 italic" style={{ borderColor: active.hue }}>
              <div className="h-eyebrow not-italic mb-1" style={{ color: active.hue }}>
                导演笔记
              </div>
              <div className="font-serif text-[17px] leading-relaxed">{active.directorNote}</div>
            </div>
          </div>

          <div>
            <div className="h-eyebrow mb-4">代表乐器</div>
            <div className="space-y-3">
              {sigInstruments.map((id) => {
                const inst = getInstrument(id);
                const hasPage = !!inst;
                const body = (
                  <div className="flex items-baseline gap-4 p-5 rounded-2xl border border-ink-700 hover:border-ink-500 hover:bg-ink-800/60 transition group">
                    <div className="font-serif text-2xl text-ink-100 group-hover:text-accent transition">
                      {inst?.name ?? prettyName(id)}
                    </div>
                    <div className="text-ink-400 text-sm">{inst?.en ?? id}</div>
                    <div className="ml-auto text-ink-300 text-sm">
                      {inst?.strength ?? '条目即将上线'}
                    </div>
                  </div>
                );
                return hasPage ? (
                  <Link key={id} to={`/atlas/${id}`}>
                    {body}
                  </Link>
                ) : (
                  <div key={id} className="opacity-70">
                    {body}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 text-ink-400 text-sm leading-relaxed">
              <span className="text-ink-200">提示</span>：点开任意乐器名进入它的图鉴页——
              <span className="text-accent">{INSTRUMENTS.length} 件乐器</span>现已全部上线，每件都配了 MiniMax 真演奏试听与音色拆解。
              后续会继续扩充乐器，并把它们和情绪、片段交叉链接起来。
            </div>
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div className="max-w-[1280px] mx-auto px-6 py-2">
        <SoundWave color="rgba(230,195,107,0.35)" height={20} cycles={8} amplitude={6} />
      </div>

      {/* 12-EMOTION INDEX STRIP */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-6">
          <div className="h-eyebrow">十二情绪索引</div>
          <LaneStripes height={2} className="w-32 opacity-50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {EMOTIONS.map((e) => {
            const isActive = e.id === active.id;
            return (
              <button
                key={e.id}
                onClick={() => previewEmotion(e)}
                onMouseEnter={() => setActive(e)}
                className={`text-left p-4 rounded-xl border transition ${
                  isActive ? 'border-transparent' : 'border-ink-700 hover:border-ink-500'
                }`}
                style={
                  isActive
                    ? { background: `${e.hue}22`, boxShadow: `inset 0 0 0 1px ${e.hue}66` }
                    : undefined
                }
              >
                <div
                  className="h-eyebrow mb-2"
                  style={{ color: isActive ? e.hue : undefined }}
                >
                  {e.en}
                </div>
                <div className="font-serif text-xl text-ink-100">{e.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ATLAS PREVIEW */}
      <section className="max-w-[1280px] mx-auto px-6 pb-24">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <div className="h-eyebrow mb-2">乐器图鉴 · 示范</div>
            <h2 className="h-display text-3xl text-ink-100">已上线条目</h2>
          </div>
          <Link to="/atlas" className="text-ink-300 hover:text-accent text-sm">
            进入图鉴 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {INSTRUMENTS.map((inst) => (
            <Link
              key={inst.id}
              to={`/atlas/${inst.id}`}
              className="group block rounded-xl border border-ink-700 hover:border-accent transition bg-ink-800/40 overflow-hidden"
            >
              <div className="relative aspect-square overflow-hidden bg-ink-900">
                <img
                  src={`${import.meta.env.BASE_URL}atlas/${inst.id}.jpg`}
                  alt={inst.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <div className="font-serif text-lg text-ink-100 group-hover:text-accent transition leading-tight">
                    {inst.name}
                  </div>
                  <div className="text-[10px] text-ink-300/80 font-mono tracking-wider">{inst.en}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function prettyName(id: string) {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
