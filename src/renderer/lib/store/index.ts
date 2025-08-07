import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GenerationSlice, createGenerationSlice } from './slices/generationSlice';
import { ChatSlice, createChatSlice } from './slices/chatSlice';

export type AppState = GenerationSlice & ChatSlice;

export const useStore = create<AppState>()(
  subscribeWithSelector((...a) => ({
    ...createGenerationSlice(...a),
    ...createChatSlice(...a),
  }))
);