import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { audioEngine } from '@/lib/audioEngine';
import { SoundWave } from '@/components/visual/Decorations';
import ShortcutsHelp from '@/components/ui/ShortcutsHelp';

const NAV = [
  { to: '/', label: '情绪光谱', en: 'Spectrum' },
  { to: '/atlas', label: '乐器图鉴', en: 'Atlas' },
  { to: '/scenes', label: '场景拆解', en: 'Scenes' },
  { to: '/lessons', label: '入门五课', en: 'Lessons' },
  { to: '/sandbox', label: '试听台', en: 'Sandbox' },
  { to: '/glossary', label: '术语', en: 'Glossary' },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();
  // Close mobile menu on navigation. Depend on pathname ONLY — a fresh close
  // closure every render would re-run the effect and slam the menu shut the
  // same render it opens.
  useEffect(() => setMenuOpen(false), [loc.pathname]);

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-ink-900/80 border-b border-ink-700/60">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="inline-block w-2 h-2 rounded-full bg-accent group-hover:scale-150 transition-transform" />
            <span className="font-serif text-[15px] tracking-tightest text-ink-100">Cue</span>
            <span className="h-eyebrow hidden sm:inline ml-1">影视配乐入门</span>
          </Link>
          {/* Desktop nav */}
          <nav className="ml-auto hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-[13px] tracking-wide transition ${
                    isActive
                      ? 'text-ink-100 bg-ink-700'
                      : 'text-ink-300 hover:text-ink-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => audioEngine.stopAll()}
              className="ml-2 px-3 py-1.5 rounded-full text-[12px] tracking-wide text-ink-400 hover:text-accent border border-ink-700 hover:border-accent transition"
              title="停止所有声音"
            >
              静音
            </button>
          </nav>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="ml-auto md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-ink-700 text-ink-200"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="菜单"
            aria-expanded={menuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              {menuOpen ? (
                <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <rect x="2" y="4" width="12" height="1.4" fill="currentColor" />
                  <rect x="2" y="7.3" width="12" height="1.4" fill="currentColor" />
                  <rect x="2" y="10.6" width="12" height="1.4" fill="currentColor" />
                </>
              )}
            </svg>
          </button>
        </div>
        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-ink-700/60 bg-ink-900/95">
            <nav className="px-4 py-3 grid grid-cols-2 gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded text-sm transition ${
                      isActive
                        ? 'text-ink-100 bg-ink-700'
                        : 'text-ink-300 hover:text-ink-100'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => audioEngine.stopAll()}
                className="col-span-2 mt-2 px-3 py-2 rounded text-xs text-ink-400 hover:text-accent border border-ink-700 transition"
              >
                停止所有声音
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <ShortcutsHelp />

      <footer className="border-t border-ink-700/60 mt-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 pb-2 opacity-30">
          <SoundWave color="#E6C36B" height={28} cycles={14} amplitude={6} />
        </div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-3 gap-8 text-[13px] text-ink-300">
          <div>
            <div className="h-eyebrow mb-3">关于</div>
            <p>
              一个给小白做导演的配乐速通课。可听 &gt; 可读——每一个名词都能在一秒内播出来。
            </p>
          </div>
          <div>
            <div className="h-eyebrow mb-3">素材出处</div>
            <p>
              乐器采样：Philharmonia Orchestra Samples (CC-BY-NC)、Freesound (CC0)、Salamander Grand Piano。影视片段 ≤30s 以教学目的引用，版权归原方。
            </p>
          </div>
          <div>
            <div className="h-eyebrow mb-3">技术</div>
            <p>
              Vite · React · Tailwind · Tone.js · Howler。所有声音在你的浏览器里实时合成，
              没有后端、没有账号、不收集任何数据。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
