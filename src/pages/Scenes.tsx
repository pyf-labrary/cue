import { Link, useSearchParams } from 'react-router-dom';
import { SCENES, CONCEPT_META, type SceneConcept } from '@/data/scenes';
import { EMOTIONS, type EmotionId } from '@/data/emotions';

type AnyFilter = 'all';

export default function Scenes() {
  const [params, setParams] = useSearchParams();
  const concept = (params.get('concept') ?? 'all') as SceneConcept | AnyFilter;
  const emotion = (params.get('emotion') ?? 'all') as EmotionId | AnyFilter;

  const setFilter = (key: 'concept' | 'emotion', val: string) => {
    const next = new URLSearchParams(params);
    if (val === 'all') next.delete(key);
    else next.set(key, val);
    setParams(next, { replace: true });
  };

  const filtered = SCENES.filter((s) => {
    if (concept !== 'all' && s.concept !== concept) return false;
    if (emotion !== 'all' && !s.emotions.includes(emotion as EmotionId)) return false;
    return true;
  });

  const concepts = Object.keys(CONCEPT_META) as SceneConcept[];

  return (
    <section className="max-w-[1280px] mx-auto px-6 py-16">
      <div className="h-eyebrow mb-3">场景拆解</div>
      <h1 className="h-display text-3xl sm:text-4xl md:text-5xl text-ink-100 mb-3">
        5 个不可绕开的瞬间，拆开听。
      </h1>
      <p className="text-ink-300 max-w-[640px] mb-10 leading-relaxed">
        每一条都把场景拆成 <span className="text-accent">5 条轨道</span>——对白、音乐、音效、环境、旁白——
        让你单独 solo、单独 mute，听见"导演为什么这样做"的物理理由。
      </p>

      <div className="space-y-3 mb-8 border-t border-b border-ink-700/60 py-5">
        <FilterRow label="手法">
          <Pill active={concept === 'all'} onClick={() => setFilter('concept', 'all')}>全部</Pill>
          {concepts.map((c) => (
            <Pill key={c} active={concept === c} onClick={() => setFilter('concept', c)}>
              {CONCEPT_META[c].label.split('（')[0]}
            </Pill>
          ))}
        </FilterRow>
        <FilterRow label="情绪">
          <Pill active={emotion === 'all'} onClick={() => setFilter('emotion', 'all')}>全部</Pill>
          {EMOTIONS.map((e) => (
            <Pill key={e.id} active={emotion === e.id} onClick={() => setFilter('emotion', e.id)} hue={e.hue}>
              {e.label}
            </Pill>
          ))}
        </FilterRow>
      </div>

      <div className="text-sm text-ink-400 mb-6">共 <span className="text-accent">{filtered.length}</span> 条</div>

      {filtered.length === 0 ? (
        <div className="text-ink-300 py-20 text-center border border-dashed border-ink-700 rounded-2xl">
          没有匹配的场景。换个过滤条件试试？
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map((s) => (
            <Link
              key={s.slug}
              to={`/scenes/${s.slug}`}
              className="group block rounded-2xl border border-ink-700 hover:border-accent transition bg-ink-800/40 overflow-hidden"
            >
              {/* Cover */}
              <div className="relative aspect-[16/9] overflow-hidden bg-ink-900">
                <img
                  src={`${import.meta.env.BASE_URL}scenes/${s.slug}/cover.jpg`}
                  alt={s.title}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-ink-100/80 tracking-widest">
                      {CONCEPT_META[s.concept].label.split('（')[0].toUpperCase()}
                    </div>
                    <h3 className="font-serif text-2xl text-ink-100 mt-0.5 leading-tight">
                      {s.title}
                    </h3>
                  </div>
                  <span className="font-mono text-[11px] text-ink-200/80">{s.year}</span>
                </div>
              </div>
              {/* Meta */}
              <div className="px-5 py-4">
                <div className="text-ink-400 text-sm mb-3">
                  《{s.film}》 · {s.composer}
                </div>
                <p className="text-ink-300 text-sm leading-relaxed line-clamp-2 mb-3">
                  {s.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {s.emotions.map((eid) => {
                    const e = EMOTIONS.find((x) => x.id === eid)!;
                    return (
                      <span
                        key={eid}
                        className="px-2 py-0.5 rounded-full text-[10px] tracking-wide"
                        style={{ background: `${e.hue}22`, color: e.hue }}
                      >
                        {e.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </Link>
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

function Pill({
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
