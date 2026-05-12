import { NavLink, Outlet, Link } from 'react-router-dom';
import { audioEngine } from '@/lib/audioEngine';

const NAV = [
  { to: '/', label: '情绪光谱', en: 'Spectrum' },
  { to: '/atlas', label: '乐器图鉴', en: 'Atlas' },
  { to: '/scenes', label: '场景拆解', en: 'Scenes' },
  { to: '/lessons', label: '入门五课', en: 'Lessons' },
  { to: '/sandbox', label: '试听台', en: 'Sandbox' },
  { to: '/glossary', label: '术语', en: 'Glossary' },
];

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-ink-900/80 border-b border-ink-700/60">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="inline-block w-2 h-2 rounded-full bg-accent group-hover:scale-150 transition-transform" />
            <span className="font-serif text-[15px] tracking-tightest text-ink-100">Cue</span>
            <span className="h-eyebrow hidden sm:inline ml-1">影视配乐入门</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
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
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-700/60 mt-24">
        <div className="max-w-[1280px] mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-[13px] text-ink-300">
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
              Vite · React · Tailwind · Howler · Wavesurfer。大文件托管在
              <span className="text-ink-100"> ftp.ssbx.site</span>。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
