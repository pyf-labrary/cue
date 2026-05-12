/**
 * Sidebar palette of preset loops. Click a loop → fire onPick which adds
 * a clip to the composition (the parent decides where).
 *
 * Designed as a vertical scroller next to the TrackEditor.
 */
import { loopsByFamily, type Loop } from '@/data/loops';

export default function LoopPalette({
  onPick,
  highlight,
}: {
  onPick: (loop: Loop) => void;
  highlight?: (loop: Loop) => boolean;
}) {
  const groups = loopsByFamily();
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-700/60">
        <div className="h-eyebrow text-ink-400">乐器库</div>
        <p className="mt-1 text-[11px] text-ink-500 leading-snug">
          点击一个 loop——它会落到对应的建议轨道上。<br />
          然后用鼠标拖动它改起点，拖右边缘改时长。
        </p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {groups.map(({ family, loops }) => (
          <div key={family} className="border-b border-ink-700/40">
            <div className="px-4 py-2 text-[10px] tracking-widest uppercase text-ink-500 sticky top-0 bg-ink-900/80 backdrop-blur">
              {family}
            </div>
            <div className="px-2 py-2 space-y-1">
              {loops.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onPick(l)}
                  className={`w-full text-left px-3 py-1.5 rounded transition ${
                    highlight?.(l) ? 'bg-accent/20 ring-1 ring-accent/40' : 'hover:bg-ink-700/40'
                  }`}
                  title={l.hint}
                >
                  <div className="text-sm text-ink-100">{l.label}</div>
                  <div className="text-[10px] font-mono text-ink-400 mt-0.5">
                    {l.kind === 'drone' ? '持续 · ' : 'phrase · '}
                    {l.durSec.toFixed(1)}s · {l.suggestedLane}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
