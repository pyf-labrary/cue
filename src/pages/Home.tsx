import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmotionWheel from '@/components/visual/EmotionWheel';
import { EMOTIONS, type Emotion } from '@/data/emotions';
import { INSTRUMENTS, getInstrument } from '@/data/instruments';
import { audioEngine } from '@/lib/audioEngine';
import { hasRecipe } from '@/lib/synth';

export default function Home() {
  const [active, setActive] = useState<Emotion>(EMOTIONS[3]); // sorrow as default opening
  const [previewing, setPreviewing] = useState<string | null>(null);
  const sigInstruments = active.signatureInstruments.slice(0, 3);

  const previewEmotion = async (e: Emotion) => {
    setActive(e);
    // Pick the first signature instrument that has a synth recipe, play its phrase.
    const first = e.signatureInstruments.find((id) => hasRecipe(id));
    if (!first) return;
    setPreviewing(e.id);
    await audioEngine.playSynth(first);
    setPreviewing((cur) => (cur === e.id ? null : cur));
  };

  return (
    <div className="relative">
      {/* HERO */}
      <section className="max-w-[1280px] mx-auto px-6 pt-16 pb-10 grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
        <div>
          <div className="h-eyebrow mb-6">A primer for directors · 影视配乐入门</div>
          <h1 className="h-display text-[64px] leading-[1.05] text-ink-100 mb-6">
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
        className="border-t border-ink-700/60"
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
              <span className="text-ink-200">提示</span>：M1 阶段只铺好了 <span className="text-accent">大提琴</span> 一件，作为示范页。
              后续会把 60 件常用乐器全数收录，并把它们和情绪、片段交叉链接起来。
            </div>
          </div>
        </div>
      </section>

      {/* 12-EMOTION INDEX STRIP */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="h-eyebrow mb-6">十二情绪索引</div>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INSTRUMENTS.map((inst) => (
            <Link
              key={inst.id}
              to={`/atlas/${inst.id}`}
              className="block p-6 rounded-2xl border border-ink-700 hover:border-accent transition group bg-ink-800/40"
            >
              <div className="h-eyebrow mb-3">{inst.family.toUpperCase()}</div>
              <div className="font-serif text-3xl text-ink-100 group-hover:text-accent transition mb-1">
                {inst.name}
              </div>
              <div className="text-ink-400 text-sm mb-4">{inst.en}</div>
              <p className="text-ink-300 text-sm leading-relaxed line-clamp-3">{inst.strength}</p>
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
