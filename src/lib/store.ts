import { create } from 'zustand';
import type { EmotionId } from '@/data/emotions';

type UiState = {
  globalMute: boolean;
  hoveredEmotion: EmotionId | null;
  setMute: (m: boolean) => void;
  setHoveredEmotion: (id: EmotionId | null) => void;
};

export const useUi = create<UiState>((set) => ({
  globalMute: false,
  hoveredEmotion: null,
  setMute: (globalMute) => set({ globalMute }),
  setHoveredEmotion: (hoveredEmotion) => set({ hoveredEmotion }),
}));
