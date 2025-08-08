import { StateCreator } from 'zustand';
import { Generation, ProjectInfo } from '../../../types';

export interface GenerationSlice {
  generations: Generation[];
  currentProject: ProjectInfo | null;
  isGenerating: boolean;
  
  addGeneration: (generation: Generation) => void;
  setProject: (project: ProjectInfo) => void;
  updateProject: (updates: Partial<ProjectInfo>) => void;
  setGenerating: (status: boolean) => void;
}

export const createGenerationSlice: StateCreator<GenerationSlice> = (set) => ({
  generations: [],
  currentProject: null,
  isGenerating: false,
  
  addGeneration: (generation) => 
    set((state) => ({ 
      generations: [generation, ...state.generations].slice(0, 50) 
    })),
    
  setProject: (project) => set({ currentProject: project }),
  
  updateProject: (updates) => 
    set((state) => ({ 
      currentProject: state.currentProject 
        ? { ...state.currentProject, ...updates }
        : null
    })),
    
  setGenerating: (status) => set({ isGenerating: status }),
});