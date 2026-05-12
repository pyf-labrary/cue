import { audioEngine, useIsPlaying } from '@/lib/audioEngine';
import { hasRecipe } from '@/lib/synth';

type Props = {
  /** Optional remote sample URL — preferred if it exists on the CDN. */
  src?: string | null;
  /** Synth recipe id — used as fallback (and as the play-state key when no src). */
  synthId?: string;
  label?: string;
  sublabel?: string;
  hue?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function PlayButton({
  src,
  synthId,
  label = '试听',
  sublabel,
  hue = '#E6C36B',
  size = 'md',
  className = '',
}: Props) {
  const trackId = src ?? (synthId ? `synth:${synthId}` : '');
  const playing = useIsPlaying(trackId);
  const dim = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const text = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base';
  const canPlay = !!src || (synthId && hasRecipe(synthId));

  const onClick = () => {
    if (!canPlay) return;
    if (playing) {
      audioEngine.stop();
      return;
    }
    audioEngine.playSampleOrSynth(src ?? null, synthId ?? '');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canPlay}
      className={`group flex items-center gap-3 ${className} ${!canPlay ? 'opacity-40 cursor-not-allowed' : ''}`}
      aria-pressed={playing}
      aria-label={label}
    >
      <span
        className={`relative inline-flex items-center justify-center rounded-full ${dim} transition`}
        style={{
          background: playing ? hue : 'transparent',
          border: `1px solid ${playing ? hue : 'rgba(255,255,255,0.18)'}`,
          color: playing ? '#0F0F12' : hue,
        }}
      >
        {playing ? <PauseGlyph /> : <PlayGlyph />}
        {playing && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: hue, opacity: 0.18 }}
            aria-hidden
          />
        )}
      </span>
      <span className="text-left">
        <span className={`block ${text} text-ink-100 group-hover:text-accent transition`}>{label}</span>
        {sublabel && <span className="block text-xs text-ink-400">{sublabel}</span>}
      </span>
    </button>
  );
}

function PlayGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <rect x="2" y="2" width="3" height="8" fill="currentColor" />
      <rect x="7" y="2" width="3" height="8" fill="currentColor" />
    </svg>
  );
}
