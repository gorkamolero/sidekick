import { create } from 'zustand';
import { Generation, ProjectInfo, ChatMessage, Conversation } from '../types';

interface AppState {
  // Existing state
  generations: Generation[];
  currentProject: ProjectInfo | null;
  isGenerating: boolean;
  
  // Chat state
  currentConversation: Conversation | null;
  conversations: Conversation[];
  
  // Actions
  addGeneration: (generation: Generation) => void;
  setProject: (project: ProjectInfo) => void;
  updateProject: (updates: Partial<ProjectInfo>) => void;
  setGenerating: (status: boolean) => void;
  
  // Chat actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  createNewConversation: () => void;
  loadConversation: (conversationId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Existing state
  generations: [],
  currentProject: null,
  isGenerating: false,
  
  // Chat state
  currentConversation: null,
  conversations: [],
  
  // Existing actions
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
  
  // Chat actions
  addMessage: (message) => 
    set((state) => {
      if (!state.currentConversation) {
        // Create a new conversation if none exists
        const newConversation: Conversation = {
          id: crypto.randomUUID(),
          messages: [message],
          title: 'New Conversation',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return {
          currentConversation: newConversation,
          conversations: [newConversation, ...state.conversations],
        };
      }
      
      // Add message to current conversation
      const updatedConversation = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, message],
        updatedAt: new Date(),
      };
      
      return {
        currentConversation: updatedConversation,
        conversations: state.conversations.map(conv =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        ),
      };
    }),
    
  updateMessage: (messageId, updates) =>
    set((state) => {
      if (!state.currentConversation) return state;
      
      const updatedConversation = {
        ...state.currentConversation,
        messages: state.currentConversation.messages.map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      };
      
      return {
        currentConversation: updatedConversation,
        conversations: state.conversations.map(conv =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        ),
      };
    }),
    
  createNewConversation: () =>
    set({
      currentConversation: null,
    }),
    
  loadConversation: (conversationId) =>
    set((state) => {
      const conversation = state.conversations.find(conv => conv.id === conversationId);
      return conversation ? { currentConversation: conversation } : state;
    }),
}));