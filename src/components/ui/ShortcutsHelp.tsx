import { useEffect, useState } from 'react';

type Row = { keys: string[]; desc: string };

const TRANSPORT: Row[] = [
  { keys: ['Space'], desc: '播放 / 暂停' },
  { keys: ['←', '→'], desc: '后退 / 前进 2 秒' },
  { keys: ['Shift', '←', '→'], desc: '后退 / 前进 5 秒' },
  { keys: ['Home'], desc: '回到开头并停止' },
  { keys: ['0'], desc: '同 Home' },
  { keys: ['Esc'], desc: '停止 / 清除独奏' },
];

const LANES: Row[] = [
  { keys: ['1'], desc: '静音 DX（对白）' },
  { keys: ['2'], desc: '静音 MX（音乐）' },
  { keys: ['3'], desc: '静音 FX（音效）' },
  { keys: ['4'], desc: '静音 NX（环境）' },
  { keys: ['5'], desc: '静音 VO（旁白）' },
  { keys: ['Shift', '1-5'], desc: '独奏对应轨' },
];

const GLOBAL: Row[] = [
  { keys: ['?'], desc: '呼出 / 关闭本面板' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-ink-600 bg-ink-800 text-[11px] font-mono text-ink-100 shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]">
      {children}
    </kbd>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <div className="h-eyebrow mb-3 text-ink-400">{title}</div>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-ink-200">{r.desc}</span>
            <span className="flex items-center gap-1">
              {r.keys.map((k, j) => (
                <span key={j} className="flex items-center gap-1">
                  {j > 0 && <span className="text-ink-500 text-[11px]">+</span>}
                  <Kbd>{k}</Kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '?') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape' && open) {
        // Close panel; transport-Esc will still also fire stop, that's fine.
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="键盘快捷键"
        title="键盘快捷键（按 ?）"
        className="fixed bottom-5 right-5 z-30 w-10 h-10 rounded-full bg-ink-800/90 hover:bg-ink-700 border border-ink-600 hover:border-accent text-ink-100 hover:text-accent text-[15px] font-serif shadow-lg backdrop-blur transition flex items-center justify-center"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[520px] rounded-xl border border-ink-600 bg-ink-900 shadow-2xl p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="font-serif text-[18px] text-ink-100">键盘快捷键</div>
                <div className="text-[12px] text-ink-400 mt-1">Sandbox · Lesson · Scene Detail 通用</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-ink-100 text-xl leading-none"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Section title="走带 Transport" rows={TRANSPORT} />
              <Section title="轨道 Lanes" rows={LANES} />
            </div>

            <div className="mt-6 pt-5 border-t border-ink-700">
              <Section title="全局" rows={GLOBAL} />
            </div>

            <div className="mt-5 text-[11px] text-ink-500 leading-relaxed">
              提示：输入框中所有快捷键自动失效；轨道快捷键仅在当前页面挂载了 Composition 时生效。
            </div>
          </div>
        </div>
      )}
    </>
  );
}
