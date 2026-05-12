/**
 * Glossary — terms grouped by category, each with optional 3s demo.
 */
import { useEffect, useMemo, useState } from 'react';
import { GLOSSARY, GLOSSARY_CATS, type GlossaryEntry } from '@/data/glossary';
import {
  emptyComposition,
  makeNoteClip,
  makeDroneClip,
} from '@/lib/composition';
import { compositionPlayer } from '@/lib/compositionPlayer';
import CategoryIcon, { CATEGORY_HUE } from '@/components/visual/CategoryIcon';

export default function Glossary() {
  const [cat, setCat] = useState<GlossaryEntry['cat'] | 'all'>('all');
  const [playing, setPlaying] = useState<string | null>(null);

  const entries = useMemo(
    () => (cat === 'all' ? GLOSSARY : GLOSSARY.filter((e) => e.cat === cat)),
    [cat],
  );

  useEffect(() => () => compositionPlayer.dispose(), []);

  async function playDemo(entry: GlossaryEntry) {
    if (!entry.demo) return;
    setPlaying(entry.term);
    const c = emptyComposition(entry.demo.durSec + 0.3);
    const clip = entry.demo.hold
      ? makeDroneClip({
          lane: 'mx',
          inst: entry.demo.inst,
          hold: entry.demo.hold,
          startSec: 0,
          durSec: entry.demo.durSec,
          vel: entry.demo.vel,
          label: entry.term,
        })
      : makeNoteClip({
          lane: 'mx',
          inst: entry.demo.inst,
          notes: entry.demo.notes ?? [],
          startSec: 0,
          durSec: entry.demo.durSec,
          label: entry.term,
        });
    c.clips.push(clip);
    await compositionPlayer.setComposition(c);
    compositionPlayer.play();
    setTimeout(() => setPlaying((p) => (p === entry.term ? null : p)), entry.demo.durSec * 1000 + 300);
  }

  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="h-eyebrow text-accent">GLOSSARY</div>
          <h1 className="h-display text-4xl md:text-5xl mt-2 text-ink-100">术语手册</h1>
          <p className="mt-3 text-ink-300 max-w-2xl leading-relaxed">
            {GLOSSARY.length} 个配乐术语，按类别分组。能听一下的，旁边都有一个小喇叭按钮——3 秒的演示。
          </p>
        </header>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <FilterPill active={cat === 'all'} onClick={() => setCat('all')} label="全部" />
          {GLOSSARY_CATS.map((c) => (
            <FilterPill
              key={c.key}
              active={cat === c.key}
              onClick={() => setCat(c.key)}
              label={c.label}
              icon={<CategoryIcon cat={c.key} size={13} />}
              hue={CATEGORY_HUE[c.key]}
            />
          ))}
        </div>

        {/* Entries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((e) => {
            const hue = CATEGORY_HUE[e.cat];
            return (
              <div
                key={e.term}
                className="rounded-xl border border-ink-700 bg-ink-800/40 px-5 py-4 hover:border-accent/40 transition relative"
              >
                <span
                  className="absolute -left-px top-4 bottom-4 w-[2px] rounded-full"
                  style={{ background: hue, opacity: 0.6 }}
                  aria-hidden
                />
                <div className="flex items-baseline gap-3">
                  <span style={{ color: hue }} title={e.cat}>
                    <CategoryIcon cat={e.cat} size={14} />
                  </span>
                  <h3 className="h-display text-lg text-ink-100">{e.term}</h3>
                  {e.en && <span className="font-mono text-[10px] text-ink-400">{e.en}</span>}
                  {e.demo && (
                    <button
                      type="button"
                      onClick={() => playDemo(e)}
                      className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border transition ${
                        playing === e.term
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-ink-600 text-ink-300 hover:border-accent/40 hover:text-accent'
                      }`}
                      title="3 秒演示"
                    >
                      {playing === e.term ? '··· 在响' : '▶ 演示'}
                    </button>
                  )}
                </div>
                <p className="text-sm text-ink-200 mt-2 leading-relaxed">{e.def}</p>
                {e.example && (
                  <p className="text-[12px] text-ink-400 mt-2 italic">{e.example}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  icon,
  hue,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  hue?: string;
}) {
  const style = active && hue
    ? { background: hue, borderColor: hue, color: '#0F0F12' }
    : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition ${
        active
          ? 'bg-accent text-ink-900 border-accent'
          : 'border-ink-700 text-ink-300 hover:border-accent/40'
      }`}
      style={style}
    >
      {icon && <span style={!active && hue ? { color: hue } : undefined}>{icon}</span>}
      {label}
    </button>
  );
}
