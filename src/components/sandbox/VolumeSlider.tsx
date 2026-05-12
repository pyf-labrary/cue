/**
 * Compact horizontal volume slider, 0..1. Used for lane vol and clip vol.
 * Native range input under a custom thin track for design consistency.
 */
export default function VolumeSlider({
  value,
  onChange,
  color = '#E6C36B',
  width = 70,
  label,
  title,
}: {
  value: number;
  onChange: (v: number) => void;
  color?: string;
  width?: number;
  label?: string;
  title?: string;
}) {
  return (
    <label
      className="inline-flex items-center gap-2"
      style={{ width: width + (label ? 32 : 8) }}
      title={title ?? `vol ${(value * 100).toFixed(0)}%`}
    >
      {label && <span className="font-mono text-[9px] text-ink-400 w-6">{label}</span>}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="appearance-none h-1 rounded-full"
        style={{
          width,
          background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 100}%, rgba(255,255,255,0.08) ${value * 100}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 12px; width: 12px;
          border-radius: 50%;
          background: #E3E3EA;
          border: 1px solid rgba(0,0,0,0.4);
          cursor: pointer;
        }
        input[type='range']::-moz-range-thumb {
          height: 12px; width: 12px;
          border-radius: 50%;
          background: #E3E3EA;
          border: 1px solid rgba(0,0,0,0.4);
          cursor: pointer;
        }
      `}</style>
    </label>
  );
}
