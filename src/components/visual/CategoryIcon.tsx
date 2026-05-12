/**
 * Inline SVG icons for the 6 glossary categories.
 *
 * Pure visual — no audio binding. Size scales via `size` prop.
 */
import type { GlossaryEntry } from '@/data/glossary';

export default function CategoryIcon({
  cat,
  size = 16,
  className = '',
}: {
  cat: GlossaryEntry['cat'];
  size?: number;
  className?: string;
}) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };
  switch (cat) {
    case 'concept':
      // Three dots connected — "idea / abstract"
      return (
        <svg {...props} aria-hidden>
          <circle cx="5" cy="6" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="18" r="2" />
          <line x1="6.7" y1="7" x2="17.3" y2="11.2" />
          <line x1="6.7" y1="17" x2="17.3" y2="12.8" />
        </svg>
      );
    case 'texture':
      // Two parallel waves — sustained / drone
      return (
        <svg {...props} aria-hidden>
          <path d="M3 9 C 6 6, 9 12, 12 9 S 18 6, 21 9" />
          <path d="M3 15 C 6 12, 9 18, 12 15 S 18 12, 21 15" />
        </svg>
      );
    case 'rhythm':
      // Metronome / pulse
      return (
        <svg {...props} aria-hidden>
          <path d="M7 20 L17 20 L14 4 L10 4 Z" />
          <line x1="12" y1="20" x2="15" y2="8" />
          <circle cx="15" cy="8" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'production':
      // Fader on console
      return (
        <svg {...props} aria-hidden>
          <line x1="6" y1="4" x2="6" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="18" y1="4" x2="18" y2="20" />
          <rect x="4.5" y="8" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="10.5" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="16.5" y="10" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'workflow':
      // Film strip — sprocket holes
      return (
        <svg {...props} aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="1" />
          <rect x="5" y="8" width="1.6" height="1.6" fill="currentColor" stroke="none" />
          <rect x="5" y="14.4" width="1.6" height="1.6" fill="currentColor" stroke="none" />
          <rect x="17.4" y="8" width="1.6" height="1.6" fill="currentColor" stroke="none" />
          <rect x="17.4" y="14.4" width="1.6" height="1.6" fill="currentColor" stroke="none" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'instrument':
      // Stylized G-clef / treble
      return (
        <svg {...props} aria-hidden>
          <path d="M14 3 C 8 6, 8 12, 14 12 C 18 12, 18 18, 12 19 C 8 19, 8 15, 11 15" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      );
  }
}

export const CATEGORY_HUE: Record<GlossaryEntry['cat'], string> = {
  concept:    '#7FB6D0',
  texture:    '#9B6BD8',
  rhythm:     '#D86B6B',
  production: '#E6C36B',
  workflow:   '#6BC9A6',
  instrument: '#E89968',
};
