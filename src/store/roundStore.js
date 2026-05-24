import { create } from 'zustand';

export const useRoundStore = create((set) => ({
  currentRound: null,
  globalStats: null,
  potSOL: 0,

  setCurrentRound: (round) => set({ currentRound: round, potSOL: round?.currentPotSOL || 0 }),
  setGlobalStats: (stats) => set({ globalStats: stats }),
  setPot: (pot) => set({ potSOL: pot }),
}));
