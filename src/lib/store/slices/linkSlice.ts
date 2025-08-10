import { StateCreator } from 'zustand';

export interface LinkState {
  isEnabled: boolean;
  isConnected: boolean;
  tempo: number;
  phase: number;
  beat: number;
  numPeers: number;
  isPlaying: boolean;
}

export interface LinkSlice {
  linkState: LinkState;
  setLinkState: (state: LinkState) => void;
  updateLinkTempo: (tempo: number) => void;
}

export const createLinkSlice: StateCreator<LinkSlice> = (set) => ({
  linkState: {
    isEnabled: false,
    isConnected: false,
    tempo: 120,
    phase: 0,
    beat: 0,
    numPeers: 0,
    isPlaying: false,
  },
  
  setLinkState: (state) => set({ linkState: state }),
  
  updateLinkTempo: (tempo) => set((state) => ({
    linkState: { ...state.linkState, tempo }
  })),
});