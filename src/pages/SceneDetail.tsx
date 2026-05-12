import { Link, useParams } from 'react-router-dom';
import { getScene, CONCEPT_META } from '@/data/scenes';
import { EMOTIONS } from '@/data/emotions';
import { getInstrument } from '@/data/instruments';
import MultiTrackPlayer from '@/components/audio/MultiTrackPlayer';

export default function SceneDetail() {
  const { slug = '' } = useParams();
  const scene = getScene(slug);

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

      {/* HERO */}
      <header className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="h-eyebrow">{concept.label}</span>
            <span className="w-1 h-1 rounded-full bg-ink-500" />
            <span className="h-eyebrow">{scene.year}</span>
          </div>
          <h1 className="h-display text-[64px] leading-[1.05] text-ink-100 mb-2">{scene.title}</h1>
          <div className="font-serif text-xl text-ink-400 mb-8">
            《{scene.film}》 · {scene.composer}
          </div>
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
        <div className="h-eyebrow mb-3">五轨拆解</div>
        <h2 className="h-display text-3xl text-ink-100 mb-6">点 Solo 单听一条；点 Mute 关一条。</h2>
        <MultiTrackPlayer scene={scene} />
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
