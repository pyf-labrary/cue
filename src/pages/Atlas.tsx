import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { INSTRUMENTS, type InstrumentFamily, type Culture } from '@/data/instruments';
import { EMOTIONS, type EmotionId } from '@/data/emotions';
import { audioEngine } from '@/lib/audioEngine';
import { cdn } from '@/lib/cdn';

const FAMILY_LABEL: Record<InstrumentFamily, string> = {
  strings: '弦乐',
  woodwind: '木管',
  brass: '铜管',
  percussion: '打击',
  keyboard: '键盘',
  plucked: '拨弦',
  voice: '人声',
  electronic: '电子',
};

const CULTURE_LABEL: Record<Culture, string> = {
  western: '西洋',
  chinese: '中国',
  world: '世界',
  electronic: '电子',
};

type AnyFilter = 'all';

export default function Atlas() {
  const [params, setParams] = useSearchParams();
  const family = (params.get('family') ?? 'all') as InstrumentFamily | AnyFilter;
  const culture = (params.get('culture') ?? 'all') as Culture | AnyFilter;
  const emotion = (params.get('emotion') ?? 'all') as EmotionId | AnyFilter;

  const setFilter = (key: 'family' | 'culture' | 'emotion', val: string) => {
    const next = new URLSearchParams(params);
    if (val === 'all') next.delete(key);
    else next.set(key, val);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    return INSTRUMENTS.filter((inst) => {
      if (family !== 'all' && inst.family !== family) return false;
      if (culture !== 'all' && inst.culture !== culture) return false;
      if (emotion !== 'all') {
        const v = inst.emotionRadar[emotion as EmotionId] ?? 0;
        if (v < 5) return false;
      }
      return true;
    });
  }, [family, culture, emotion]);

  const families: Array<InstrumentFamily | AnyFilter> = ['all', 'strings', 'woodwind', 'brass', 'percussion', 'keyboard', 'plucked', 'voice', 'electronic'];
  const cultures: Array<Culture | AnyFilter> = ['all', 'western', 'chinese', 'world', 'electronic'];
  const emotions: Array<EmotionId | AnyFilter> = ['all', ...EMOTIONS.map((e) => e.id as EmotionId)];

  return (
    <section className="max-w-[1280px] mx-auto px-6 py-16">
      <div className="h-eyebrow mb-3">乐器图鉴</div>
      <h1 className="h-display text-5xl text-ink-100 mb-3">
        20 件常用乐器，按你能感觉到的方式分类。
      </h1>
      <p className="text-ink-300 max-w-[640px] mb-10 leading-relaxed">
        家族、文化、年代是教科书的分法，对小白没用。我们额外加一条 <span className="text-accent">情绪轴</span>——
        每件乐器都标了它最擅长的几种情绪。点试听键就能听到它的代表 phrase。
      </p>

      {/* Filters */}
      <div className="space-y-3 mb-8 border-t border-b border-ink-700/60 py-5">
        <FilterRow label="家族">
          {families.map((f) => (
            <FilterPill key={f} active={family === f} onClick={() => setFilter('family', f)}>
              {f === 'all' ? '全部' : FAMILY_LABEL[f as InstrumentFamily]}
            </FilterPill>
          ))}
        </FilterRow>
        <FilterRow label="文化">
          {cultures.map((c) => (
            <FilterPill key={c} active={culture === c} onClick={() => setFilter('culture', c)}>
              {c === 'all' ? '全部' : CULTURE_LABEL[c as Culture]}
            </FilterPill>
          ))}
        </FilterRow>
        <FilterRow label="情绪">
          {emotions.map((eId) => {
            const e = EMOTIONS.find((x) => x.id === eId);
            return (
              <FilterPill
                key={eId}
                active={emotion === eId}
                onClick={() => setFilter('emotion', eId)}
                hue={e?.hue}
              >
                {eId === 'all' ? '全部' : e!.label}
              </FilterPill>
            );
          })}
        </FilterRow>
      </div>

      <div className="text-sm text-ink-400 mb-6">
        共 <span className="text-accent">{filtered.length}</span> 件
      </div>

      {filtered.length === 0 ? (
        <div className="text-ink-300 py-20 text-center border border-dashed border-ink-700 rounded-2xl">
          没有匹配的乐器。换个过滤条件试试？
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inst) => (
            <article
              key={inst.id}
              className="group relative p-6 rounded-2xl border border-ink-700 hover:border-ink-500 transition bg-ink-800/40"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="h-eyebrow">{FAMILY_LABEL[inst.family]}</span>
                <span className="text-[11px] text-ink-400 tracking-widest uppercase">
                  {CULTURE_LABEL[inst.culture]}
                </span>
              </div>
              <Link to={`/atlas/${inst.id}`} className="block">
                <div className="font-serif text-3xl text-ink-100 group-hover:text-accent transition mb-1">
                  {inst.name}
                </div>
                <div className="text-ink-400 text-sm mb-4">{inst.en}</div>
                <p className="text-ink-300 text-sm leading-relaxed line-clamp-3 mb-4">
                  {inst.strength}
                </p>
              </Link>

              <div className="flex items-center justify-between pt-3 border-t border-ink-700/60">
                <CardPlay id={inst.id} sample={cdn(`samples/${inst.phrase}`)} />
                <TopEmotions inst={inst} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="h-eyebrow w-12 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  hue,
  children,
}: {
  active: boolean;
  onClick: () => void;
  hue?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[12px] tracking-wide transition border ${
        active
          ? 'text-ink-900 bg-accent border-accent'
          : 'text-ink-300 border-ink-700 hover:border-ink-500 hover:text-ink-100'
      }`}
      style={active && hue ? { background: hue, borderColor: hue, color: '#0F0F12' } : undefined}
    >
      {children}
    </button>
  );
}

function CardPlay({ id, sample }: { id: string; sample: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (playing) {
          audioEngine.stop();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        await audioEngine.playSampleOrSynth(sample, id);
        setPlaying(false);
      }}
      className="flex items-center gap-2 text-sm text-ink-200 hover:text-accent transition"
    >
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-ink-500 group-hover:border-accent"
        style={playing ? { background: '#E6C36B', color: '#0F0F12', borderColor: '#E6C36B' } : undefined}
      >
        {playing ? (
          <svg width="10" height="10" viewBox="0 0 12 12">
            <rect x="2" y="2" width="3" height="8" fill="currentColor" />
            <rect x="7" y="2" width="3" height="8" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 14 14">
            <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
          </svg>
        )}
      </span>
      试听
    </button>
  );
}

function TopEmotions({ inst }: { inst: typeof INSTRUMENTS[number] }) {
  const top = Object.entries(inst.emotionRadar)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([id]) => EMOTIONS.find((e) => e.id === id))
    .filter(Boolean);
  return (
    <div className="flex gap-1">
      {top.map((e) => (
        <span
          key={e!.id}
          className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
          style={{ background: `${e!.hue}22`, color: e!.hue }}
        >
          {e!.label}
        </span>
      ))}
    </div>
  );
}
