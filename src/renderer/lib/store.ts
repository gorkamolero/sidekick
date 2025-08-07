import { create } from 'zustand';
import { Generation, ProjectInfo } from '../types';

interface AppState {
  generations: Generation[];
  currentProject: ProjectInfo | null;
  isGenerating: boolean;
  addGeneration: (generation: Generation) => void;
  setProject: (project: ProjectInfo) => void;
  setGenerating: (status: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  generations: [],
  currentProject: null,
  isGenerating: false,
  addGeneration: (generation) => 
    set((state) => ({ 
      generations: [generation, ...state.generations].slice(0, 50) 
    })),
  setProject: (project) => set({ currentProject: project }),
  setGenerating: (status) => set({ isGenerating: status }),
}));