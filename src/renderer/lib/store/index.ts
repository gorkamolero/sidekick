import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GenerationSlice, createGenerationSlice } from './slices/generationSlice';
import { ChatSlice, createChatSlice } from './slices/chatSlice';
import { LinkSlice, createLinkSlice } from './slices/linkSlice';

export type AppState = GenerationSlice & ChatSlice & LinkSlice;

export const useStore = create<AppState>()(
  subscribeWithSelector((...a) => ({
    ...createGenerationSlice(...a),
    ...createChatSlice(...a),
    ...createLinkSlice(...a),
  }))
);