/**
 * One draggable / resizable clip rectangle on a lane.
 *
 * Interactions:
 *   - body drag       → change startSec
 *   - right-edge grab → change durSec
 *   - double-click    → delete (parent decides whether to confirm)
 *
 * The component stays controlled — it never mutates the clip itself; it
 * just emits `onChange(partial)` / `onDelete()` for the editor to apply.
 */
import { useRef, useState } from 'react';
import type { Clip } from '@/lib/composition';
import { TRACK_META } from '@/data/scenes';

interface Props {
  clip: Clip;
  pxPerSec: number;
  totalSec: number;
  selected?: boolean;
  onSelect?: () => void;
  onChange?: (patch: { startSec?: number; durSec?: number }) => void;
  onDelete?: () => void;
  /** Snap interval in seconds. Default 0.25. */
  snap?: number;
}

export default function ClipBlock({
  clip,
  pxPerSec,
  totalSec,
  selected,
  onSelect,
  onChange,
  onDelete,
  snap = 0.25,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
  const startRef = useRef<{ x: number; orig: number } | null>(null);

  const color = clip.color ?? TRACK_META[clip.lane].color;
  const left = clip.startSec * pxPerSec;
  const width = Math.max(8, clip.durSec * pxPerSec);

  function snapTo(v: number): number {
    return Math.round(v / snap) * snap;
  }

  function onPointerDown(mode: 'move' | 'resize', e: React.PointerEvent) {
    if (!onChange) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onSelect?.();
    setDragging(mode);
    startRef.current = {
      x: e.clientX,
      orig: mode === 'move' ? clip.startSec : clip.durSec,
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !startRef.current || !onChange) return;
    const dx = (e.clientX - startRef.current.x) / pxPerSec;
    if (dragging === 'move') {
      const next = snapTo(Math.max(0, Math.min(totalSec - clip.durSec, startRef.current.orig + dx)));
      onChange({ startSec: next });
    } else {
      const next = snapTo(Math.max(0.1, Math.min(totalSec - clip.startSec, startRef.current.orig + dx)));
      onChange({ durSec: next });
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    setDragging(null);
    startRef.current = null;
  }

  const labelText = clip.label ?? ('inst' in clip ? clip.inst : clip.kind);

  return (
    <div
      ref={ref}
      className={`absolute top-1 bottom-1 rounded-md group transition ${selected ? 'ring-2 ring-accent z-10' : 'ring-1 ring-white/10 hover:ring-white/30'}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        background: `${color}33`,
        borderLeft: `3px solid ${color}`,
        cursor: dragging === 'move' ? 'grabbing' : 'grab',
        opacity: clip.muted ? 0.35 : 1,
      }}
      onPointerDown={(e) => onPointerDown('move', e)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDelete?.();
      }}
      title={`${labelText}  ${clip.startSec.toFixed(2)}s → ${(clip.startSec + clip.durSec).toFixed(2)}s`}
    >
      <div className="px-2 py-1 text-[10px] font-mono text-ink-100 truncate" style={{ color }}>
        {labelText}
      </div>
      {/* Right-edge resize handle */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100"
        style={{ background: color }}
        onPointerDown={(e) => onPointerDown('resize', e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
