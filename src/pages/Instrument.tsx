import { useParams, Link } from 'react-router-dom';
import { getInstrument, midiToNoteName } from '@/data/instruments';
import EmotionRadar from '@/components/visual/EmotionRadar';
import PlayButton from '@/components/audio/PlayButton';
import { cdn } from '@/lib/cdn';
import { isSurrogate } from '@/lib/synth';

/**
 * Instruments whose Tone.Sampler map uses a GM/Western surrogate but have a
 * MiniMax-generated real solo demo at /samples/<id>-real.mp3. Adds a second
 * "听真乐器" play button so users can A/B against the synth phrase.
 */
const REAL_DEMO_IDS = new Set(['erhu', 'guzheng', 'guqin', 'choir']);

const FAMILY_LABEL: Record<string, string> = {
  strings: '弦乐',
  woodwind: '木管',
  brass: '铜管',
  percussion: '打击',
  keyboard: '键盘',
  plucked: '拨弦',
  voice: '人声',
  electronic: '电子',
};

export default function Instrument() {
  const { id = '' } = useParams();
  const inst = getInstrument(id);

  if (!inst) {
    return (
      <section className="max-w-[720px] mx-auto px-6 py-32">
        <div className="h-eyebrow mb-4">未找到</div>
        <h1 className="h-display text-4xl text-ink-100 mb-6">「{id}」还没收录</h1>
        <Link to="/atlas" className="btn-ghost">回到图鉴</Link>
      </section>
    );
  }

  const [lo, hi] = inst.rangeMidi;

  return (
    <article className="max-w-[1280px] mx-auto px-6 py-16">
      <Link to="/atlas" className="h-eyebrow hover:text-accent transition inline-block mb-6">
        ← 乐器图鉴
      </Link>

      {/* HERO */}
      <header className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center mb-20">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-eyebrow">{FAMILY_LABEL[inst.family]}</span>
            <span className="w-1 h-1 rounded-full bg-ink-500" />
            <span className="h-eyebrow">{inst.culture}</span>
          </div>
          <h1 className="h-display text-[56px] sm:text-[72px] md:text-[88px] leading-none text-ink-100 mb-2">{inst.name}</h1>
          <div className="font-serif text-2xl text-ink-400 mb-8">{inst.en}</div>
          <p className="text-ink-200 text-lg leading-relaxed mb-8 max-w-[520px]">{inst.timbre}</p>

          <PlayButton
            src={cdn(`samples/${inst.phrase}`)}
            synthId={inst.id}
            label="代表 phrase"
            sublabel={isSurrogate(inst.id) ? '采样代用：用近似乐器的真录音过渡' : '3–4s 代表乐句'}
            size="lg"
          />

          {REAL_DEMO_IDS.has(inst.id) && (
            <div className="mt-4">
              <PlayButton
                src={`${import.meta.env.BASE_URL}samples/${inst.id}-real.mp3`}
                label="听一段真乐器"
                sublabel="MiniMax music-1.5 真录音演奏 · 12s"
                hue="#7FB6D0"
                size="md"
              />
            </div>
          )}

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            <Capsule title="它擅长" body={inst.strength} accent="#E6C36B" />
            <Capsule title="它容易翻车" body={inst.caveat} accent="#D86B6B" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden border border-ink-700/60 bg-ink-900">
            <img
              src={`${import.meta.env.BASE_URL}atlas/${inst.id}.jpg`}
              alt={inst.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />
          </div>
          <div className="flex flex-col items-center">
            <EmotionRadar values={inst.emotionRadar} size={340} />
            <div className="h-eyebrow mt-2">情绪雷达</div>
          </div>
        </div>
      </header>

      {/* RANGE */}
      <section className="mb-20">
        <div className="h-eyebrow mb-3">音域</div>
        <h2 className="h-display text-3xl text-ink-100 mb-6">{midiToNoteName(lo)} 到 {midiToNoteName(hi)}</h2>
        <PianoRange lo={lo} hi={hi} />
        <p className="text-ink-400 text-sm mt-3">
          高亮区段就是这件乐器的"声音落点"。注意它和人声中低音区的重叠——这就是为什么大提琴常常被形容成"会唱歌"。
        </p>
      </section>

      {/* FILMS */}
      <section>
        <div className="h-eyebrow mb-3">在哪些片子里听见</div>
        <h2 className="h-display text-3xl text-ink-100 mb-8">三个非看不可的瞬间</h2>
        <div className="space-y-4">
          {inst.films.map((f, i) => (
            <div
              key={i}
              className="grid lg:grid-cols-[140px_1fr_2fr] gap-6 p-6 rounded-2xl border border-ink-700 hover:border-ink-500 transition"
            >
              <div className="font-serif text-5xl text-accent leading-none">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div className="font-serif text-2xl text-ink-100 mb-1">{f.film}</div>
                <div className="text-ink-400 text-sm">{f.year} · {f.composer}</div>
              </div>
              <p className="text-ink-200 leading-relaxed">{f.why}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

function Capsule({ title, body, accent }: { title: string; body: string; accent: string }) {
  return (
    <div className="p-5 rounded-xl border border-ink-700">
      <div className="h-eyebrow mb-2" style={{ color: accent }}>{title}</div>
      <p className="text-ink-200 leading-relaxed text-[15px]">{body}</p>
    </div>
  );
}

function PianoRange({ lo, hi }: { lo: number; hi: number }) {
  // C2 (36) to C7 (96) for context
  const start = 36;
  const end = 96;
  const whiteKeys: number[] = [];
  for (let m = start; m <= end; m++) {
    const pc = m % 12;
    if ([0, 2, 4, 5, 7, 9, 11].includes(pc)) whiteKeys.push(m);
  }
  const W = 720;
  const H = 80;
  const keyW = W / whiteKeys.length;

  // Map midi -> white-key index (or use neighbor)
  const midiToWhiteIdx = (m: number) => {
    const pc = m % 12;
    if ([0, 2, 4, 5, 7, 9, 11].includes(pc)) {
      return whiteKeys.indexOf(m);
    }
    // black key sits between two whites; use the lower white
    return whiteKeys.indexOf(m - 1);
  };

  const loIdx = midiToWhiteIdx(lo);
  const hiIdx = midiToWhiteIdx(hi);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="音域钢琴键示意">
      {/* highlight band */}
      <rect
        x={loIdx * keyW}
        y={0}
        width={(hiIdx - loIdx + 1) * keyW}
        height={H}
        fill="#E6C36B"
        fillOpacity={0.12}
      />
      {/* white keys */}
      {whiteKeys.map((m, i) => {
        const inRange = m >= lo && m <= hi;
        const isC = m % 12 === 0;
        return (
          <g key={m}>
            <rect
              x={i * keyW}
              y={0}
              width={keyW}
              height={H}
              fill={inRange ? '#1C1C22' : '#15151A'}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
            {isC && (
              <text
                x={i * keyW + keyW / 2}
                y={H - 8}
                textAnchor="middle"
                style={{ fontSize: 9, fill: 'rgba(184,184,194,0.5)' }}
              >
                {midiToNoteName(m)}
              </text>
            )}
          </g>
        );
      })}
      {/* black keys (purely cosmetic) */}
      {Array.from({ length: end - start + 1 }, (_, k) => k + start)
        .filter((m) => [1, 3, 6, 8, 10].includes(m % 12))
        .map((m) => {
          const whiteIdx = whiteKeys.indexOf(m - 1);
          if (whiteIdx === -1) return null;
          const x = (whiteIdx + 1) * keyW - keyW * 0.3;
          const inRange = m >= lo && m <= hi;
          return (
            <rect
              key={m}
              x={x}
              y={0}
              width={keyW * 0.6}
              height={H * 0.6}
              fill={inRange ? '#3A3A45' : '#0A0A0C'}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
          );
        })}
    </svg>
  );
}
