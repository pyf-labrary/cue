/**
 * Lessons index — the 5 entry tiles.
 */
import { Link } from 'react-router-dom';
import { LESSONS } from '@/data/lessons';
import { LaneStripes } from '@/components/visual/Decorations';

export default function Lessons() {
  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 grid md:grid-cols-[1fr_220px] gap-6 items-end">
          <div>
            <div className="h-eyebrow text-accent">LESSONS</div>
            <h1 className="h-display text-4xl md:text-5xl mt-2 text-ink-100">入门五课</h1>
            <p className="mt-3 text-ink-300 max-w-2xl leading-relaxed">
              10–15 分钟一节，全部互动——没有阅读理解，只有"听 → 试 → 听"。
              从五轨拆解到你的第一段配乐，五个台阶。建议按顺序。
            </p>
          </div>
          <LaneStripes height={5} className="hidden md:flex w-full opacity-70" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LESSONS.map((l) => (
            <Link
              key={l.id}
              to={`/lessons/${l.id}`}
              className="group block rounded-2xl border border-ink-700 bg-ink-800/40 hover:border-accent/40 transition overflow-hidden"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-ink-900">
                <img
                  src={`${import.meta.env.BASE_URL}lessons/${l.id}.jpg`}
                  alt=""
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/20 to-transparent" />
                <span className="absolute top-3 left-4 font-mono text-2xl text-accent tabular-nums drop-shadow">
                  {String(l.num).padStart(2, '0')}
                </span>
                <span className="absolute top-3 right-4 font-mono text-[10px] text-ink-100/70 tracking-widest">
                  约 {l.estMin} 分钟
                </span>
              </div>
              <div className="px-5 py-4">
                <div className="h-display text-xl text-ink-100 group-hover:text-accent transition">{l.title}</div>
                <div className="text-sm text-ink-400 mt-1.5 line-clamp-2">{l.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
