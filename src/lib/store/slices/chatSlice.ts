import { StateCreator } from 'zustand';
import { ChatMessage, Conversation } from '../../../types';
import { ConversationStorage, conversationDB, TabStorage } from '../../db';

export interface ChatSlice {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  openTabIds: string[];
  activeView: 'chat' | 'history';
  attachedFile: File | null;
  shouldFocusPrompt: boolean;
  
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  createNewConversation: () => void;
  loadConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  closeTab: (conversationId: string) => void;
  openTab: (conversationId: string) => void;
  setActiveView: (view: 'chat' | 'history') => void;
  setAttachedFile: (file: File | null) => void;
  initializeStore: () => void;
  clearFocusPrompt: () => void;
  reorderTabs: (newOrder: string[]) => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  currentConversation: null,
  conversations: [],
  openTabIds: [],
  activeView: 'chat',
  attachedFile: null,
  shouldFocusPrompt: false,
  
  addMessage: (message) => 
    set((state) => {
      if (!state.currentConversation) {
        const newConversation: Conversation = {
          id: crypto.randomUUID(),
          messages: [message],
          title: ConversationStorage.generateTitle([message]),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        ConversationStorage.saveCurrentConversationId(newConversation.id).catch(console.error);
        const updatedConversations = [newConversation, ...state.conversations];
        ConversationStorage.saveConversations(updatedConversations).catch(console.error);
        conversationDB.saveConversation(newConversation).catch(console.error);
        
        const newTabIds = [...state.openTabIds.slice(0, 9), newConversation.id];
        TabStorage.save(newTabIds).catch(console.error);
        
        return {
          currentConversation: newConversation,
          conversations: updatedConversations,
          openTabIds: newTabIds,
        };
      }
      
      const updatedConversation = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, message],
        updatedAt: new Date(),
        title: state.currentConversation.title === 'New Conversation' && message.role === 'user'
          ? ConversationStorage.generateTitle([...state.currentConversation.messages, message])
          : state.currentConversation.title,
      };
      
      const updatedConversations = state.conversations.map(conv =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      );
      
      ConversationStorage.saveConversations(updatedConversations).catch(console.error);
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
        messages: state.currentConversation.messages.map((msg: any) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      };
      
      const updatedConversations = state.conversations.map(conv =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      );
      
      ConversationStorage.saveConversations(updatedConversations).catch(console.error);
      conversationDB.saveConversation(updatedConversation).catch(console.error);
      
      return {
        currentConversation: updatedConversation,
        conversations: updatedConversations,
      };
    }),
    
  createNewConversation: () => {
    set((state) => {
      // Check if current conversation is empty
      if (state.currentConversation && state.currentConversation.messages.length === 0) {
        // Don't create a new conversation, just focus the existing empty one
        return {
          shouldFocusPrompt: true,
        };
      }
      
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        messages: [],
        title: 'New Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedConversations = [newConversation, ...state.conversations];
      const newTabIds = [...state.openTabIds.filter(id => id !== newConversation.id).slice(0, 9), newConversation.id];
      
      ConversationStorage.saveConversations(updatedConversations).catch(console.error);
      ConversationStorage.saveCurrentConversationId(newConversation.id).catch(console.error);
      TabStorage.save(newTabIds).catch(console.error);
      conversationDB.saveConversation(newConversation).catch(console.error);
      
      return {
        currentConversation: newConversation,
        conversations: updatedConversations,
        openTabIds: newTabIds,
        shouldFocusPrompt: true,
      };
    });
  },
    
  loadConversation: (conversationId) =>
    set((state) => {
      const conversation = state.conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        ConversationStorage.saveCurrentConversationId(conversationId).catch(console.error);
        
        const newOpenTabs = state.openTabIds.includes(conversationId) 
          ? state.openTabIds 
          : [...state.openTabIds.slice(0, 9), conversationId];
        
        TabStorage.save(newOpenTabs).catch(console.error);
        
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
      
      ConversationStorage.saveConversations(updatedConversations).catch(console.error);
      conversationDB.deleteConversation(conversationId).catch(console.error);
      
      if (isCurrentConversation) {
        ConversationStorage.saveCurrentConversationId(null).catch(console.error);
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
      
      TabStorage.save(updatedTabIds).catch(console.error);
      
      if (state.currentConversation?.id === conversationId) {
        if (updatedTabIds.length > 0) {
          const nextConversation = state.conversations.find(c => c.id === updatedTabIds[0]);
          if (nextConversation) {
            ConversationStorage.saveCurrentConversationId(nextConversation.id).catch(console.error);
          }
          return {
            openTabIds: updatedTabIds,
            currentConversation: nextConversation || null,
          };
        } else {
          ConversationStorage.saveCurrentConversationId(null).catch(console.error);
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
        const newTabIds = [...state.openTabIds.slice(0, 9), conversationId];
        TabStorage.save(newTabIds).catch(console.error);
        return {
          openTabIds: newTabIds,
        };
      }
      return state;
    }),
  
  setActiveView: (view) => 
    set({ activeView: view }),
  
  setAttachedFile: (file) =>
    set({ attachedFile: file }),
  
  clearFocusPrompt: () =>
    set({ shouldFocusPrompt: false }),
  
  reorderTabs: (newOrder) => {
    TabStorage.save(newOrder).catch(console.error);
    set({ openTabIds: newOrder });
  },
    
  initializeStore: async () => {
    try {
      const conversations = await ConversationStorage.loadConversations();
      const currentConversationId = await ConversationStorage.loadCurrentConversationId();
      const currentConversation = currentConversationId 
        ? conversations.find(c => c.id === currentConversationId) || null
        : null;
      
      const savedTabIds = await TabStorage.load();
      let openTabIds = savedTabIds.filter(id => conversations.some(c => c.id === id));
      
      // If no tabs are open, create a new conversation
      if (openTabIds.length === 0) {
        const newConversation: Conversation = {
          id: crypto.randomUUID(),
          messages: [],
          title: 'New Conversation',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const updatedConversations = [newConversation, ...conversations];
        openTabIds = [newConversation.id];
        
        set({
          conversations: updatedConversations,
          currentConversation: newConversation,
          openTabIds,
        });
        
        // Save the new state
        await ConversationStorage.saveConversations(updatedConversations);
        await ConversationStorage.saveCurrentConversationId(newConversation.id);
        await TabStorage.save(openTabIds);
        await conversationDB.saveConversation(newConversation);
      } else {
        set({
          conversations,
          currentConversation,
          openTabIds,
        });
      }
      
      // Load additional conversations from IndexedDB
      await conversationDB.init();
      const allConversations = await conversationDB.loadAllConversations();
      if (allConversations.length > conversations.length) {
        set({ conversations: allConversations });
      }
    } catch (error) {
      console.error('Failed to initialize store:', error);
      // Create a default conversation on error
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        messages: [],
        title: 'New Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set({
        conversations: [newConversation],
        currentConversation: newConversation,
        openTabIds: [newConversation.id],
      });
    }
  },
});