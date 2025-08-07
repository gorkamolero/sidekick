import { create } from 'zustand';
import { Generation, ProjectInfo, ChatMessage, Conversation } from '../types';
import { ConversationStorage, conversationDB } from './storage';
import { subscribeWithSelector } from 'zustand/middleware';

interface AppState {
  // Existing state
  generations: Generation[];
  currentProject: ProjectInfo | null;
  isGenerating: boolean;
  
  // Chat state
  currentConversation: Conversation | null;
  conversations: Conversation[];
  openTabIds: string[]; // Track which conversations are open as tabs
  
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
  deleteConversation: (conversationId: string) => void;
  closeTab: (conversationId: string) => void;
  openTab: (conversationId: string) => void;
  initializeStore: () => void;
}

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
  // Existing state
  generations: [],
  currentProject: null,
  isGenerating: false,
  
  // Chat state
  currentConversation: null,
  conversations: [],
  openTabIds: [],
  
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
          title: ConversationStorage.generateTitle([message]),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Save to storage
        ConversationStorage.saveCurrentConversationId(newConversation.id);
        const updatedConversations = [newConversation, ...state.conversations];
        ConversationStorage.saveConversations(updatedConversations);
        conversationDB.saveConversation(newConversation).catch(console.error);
        
        return {
          currentConversation: newConversation,
          conversations: updatedConversations,
          openTabIds: [newConversation.id, ...state.openTabIds.slice(0, 9)], // Keep max 10 tabs
        };
      }
      
      // Add message to current conversation
      const updatedConversation = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, message],
        updatedAt: new Date(),
        // Update title if it's still "New Conversation" and we have a user message
        title: state.currentConversation.title === 'New Conversation' && message.role === 'user'
          ? ConversationStorage.generateTitle([...state.currentConversation.messages, message])
          : state.currentConversation.title,
      };
      
      const updatedConversations = state.conversations.map(conv =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      );
      
      // Save to storage
      ConversationStorage.saveConversations(updatedConversations);
      conversationDB.saveConversation(updatedConversation).catch(console.error);
      
      return {
        currentConversation: updatedConversation,
        conversations: updatedConversations,
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
      
      const updatedConversations = state.conversations.map(conv =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      );
      
      // Save to storage
      ConversationStorage.saveConversations(updatedConversations);
      conversationDB.saveConversation(updatedConversation).catch(console.error);
      
      return {
        currentConversation: updatedConversation,
        conversations: updatedConversations,
      };
    }),
    
  createNewConversation: () => {
    ConversationStorage.saveCurrentConversationId(null);
    set({
      currentConversation: null,
    });
  },
    
  loadConversation: (conversationId) =>
    set((state) => {
      const conversation = state.conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        ConversationStorage.saveCurrentConversationId(conversationId);
        
        // Add to open tabs if not already there
        const newOpenTabs = state.openTabIds.includes(conversationId) 
          ? state.openTabIds 
          : [conversationId, ...state.openTabIds.slice(0, 9)];
        
        return { 
          currentConversation: conversation,
          openTabIds: newOpenTabs,
        };
      }
      return state;
    }),
    
  deleteConversation: (conversationId) =>
    set((state) => {
      const updatedConversations = state.conversations.filter(conv => conv.id !== conversationId);
      const isCurrentConversation = state.currentConversation?.id === conversationId;
      
      // Save to storage
      ConversationStorage.saveConversations(updatedConversations);
      conversationDB.deleteConversation(conversationId).catch(console.error);
      
      if (isCurrentConversation) {
        ConversationStorage.saveCurrentConversationId(null);
        return {
          conversations: updatedConversations,
          currentConversation: null,
        };
      }
      
      return { conversations: updatedConversations };
    }),
    
  closeTab: (conversationId) =>
    set((state) => {
      const updatedTabIds = state.openTabIds.filter(id => id !== conversationId);
      
      // If closing current conversation, switch to another tab
      if (state.currentConversation?.id === conversationId) {
        if (updatedTabIds.length > 0) {
          const nextConversation = state.conversations.find(c => c.id === updatedTabIds[0]);
          return {
            openTabIds: updatedTabIds,
            currentConversation: nextConversation || null,
          };
        } else {
          return {
            openTabIds: updatedTabIds,
            currentConversation: null,
          };
        }
      }
      
      return { openTabIds: updatedTabIds };
    }),
    
  openTab: (conversationId) =>
    set((state) => {
      if (!state.openTabIds.includes(conversationId)) {
        return {
          openTabIds: [conversationId, ...state.openTabIds.slice(0, 9)],
        };
      }
      return state;
    }),
    
  initializeStore: async () => {
    // Load conversations from localStorage
    const conversations = ConversationStorage.loadConversations();
    const currentConversationId = ConversationStorage.loadCurrentConversationId();
    const currentConversation = currentConversationId 
      ? conversations.find(c => c.id === currentConversationId) || null
      : null;
    
    // Set initial open tabs (current conversation + last few)
    const initialOpenTabs = currentConversation 
      ? [currentConversation.id, ...conversations.slice(0, 3).map(c => c.id).filter(id => id !== currentConversation.id)]
      : conversations.slice(0, 3).map(c => c.id);
    
    set({
      conversations,
      currentConversation,
      openTabIds: [...new Set(initialOpenTabs)].slice(0, 10),
    });
    
    // Load full history from IndexedDB in background
    try {
      await conversationDB.init();
      const allConversations = await conversationDB.loadAllConversations();
      if (allConversations.length > conversations.length) {
        set({ conversations: allConversations });
      }
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
    }
  },
})));