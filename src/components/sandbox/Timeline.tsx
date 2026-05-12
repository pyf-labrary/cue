/**
 * Top time ruler over the lane grid. Renders tick marks every second and
 * labeled ticks at 5s intervals. The playhead is drawn by TrackEditor on
 * top of the lanes, not here — this stays pure scaling.
 */
export default function Timeline({
  durationSec,
  pxPerSec,
  onSeek,
}: {
  durationSec: number;
  pxPerSec: number;
  onSeek?: (sec: number) => void;
}) {
  const total = Math.ceil(durationSec);
  const ticks = [];
  for (let s = 0; s <= total; s++) {
    const major = s % 5 === 0;
    ticks.push(
      <div
        key={s}
        className="absolute top-0 bottom-0"
        style={{ left: `${s * pxPerSec}px`, width: 0 }}
      >
        <div
          className={major ? 'absolute top-3 bottom-0 w-px bg-ink-500' : 'absolute top-5 bottom-0 w-px bg-ink-700'}
        />
        {major && (
          <div className="absolute top-0 left-1 font-mono text-[10px] text-ink-400 tabular-nums">
            {fmt(s)}
          </div>
        )}
      </div>,
    );
  }
  return (
    <div
      className="relative h-8 border-b border-ink-700/60 cursor-pointer select-none"
      style={{ width: `${durationSec * pxPerSec}px` }}
      onClick={(e) => {
        if (!onSeek) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const sec = Math.max(0, Math.min(durationSec, (e.clientX - rect.left) / pxPerSec));
        onSeek(sec);
      }}
    >
      {ticks}
    </div>
  );
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
