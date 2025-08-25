// src/store/insight.ts
import { create } from "zustand";

type InsightState = {
  panelOpen: boolean;
  region: string | null;

  setRegion: (r: string | null) => void;
  open: () => void;
  close: () => void;

  // 에디터에서 지역 단어 클릭 시 한 번에 처리(열기 + 지역설정)
  setFromEditor: (r: string) => void;
};

export const useInsightStore = create<InsightState>((set) => ({
  panelOpen: false,
  region: null,

  setRegion: (r) => set({ region: r }),
  open: () => set({ panelOpen: true }),
  close: () => set({ panelOpen: false }),

  setFromEditor: (r) => set({ region: r, panelOpen: true }),
}));
