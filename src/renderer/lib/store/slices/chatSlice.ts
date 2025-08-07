import { StateCreator } from 'zustand';
import { ChatMessage, Conversation } from '../../types';
import { ConversationStorage, conversationDB } from '../../storage';

export interface ChatSlice {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  openTabIds: string[];
  activeView: 'chat' | 'history';
  
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  createNewConversation: () => void;
  loadConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  closeTab: (conversationId: string) => void;
  openTab: (conversationId: string) => void;
  setActiveView: (view: 'chat' | 'history') => void;
  initializeStore: () => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  currentConversation: null,
  conversations: [],
  openTabIds: [],
  activeView: 'chat',
  
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
        
        ConversationStorage.saveCurrentConversationId(newConversation.id);
        const updatedConversations = [newConversation, ...state.conversations];
        ConversationStorage.saveConversations(updatedConversations);
        conversationDB.saveConversation(newConversation).catch(console.error);
        
        const newTabIds = [newConversation.id, ...state.openTabIds.slice(0, 9)];
        localStorage.setItem('openTabIds', JSON.stringify(newTabIds));
        
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
        
        const newOpenTabs = state.openTabIds.includes(conversationId) 
          ? state.openTabIds 
          : [conversationId, ...state.openTabIds.slice(0, 9)];
        
        localStorage.setItem('openTabIds', JSON.stringify(newOpenTabs));
        
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
      
      localStorage.setItem('openTabIds', JSON.stringify(updatedTabIds));
      
      if (state.currentConversation?.id === conversationId) {
        if (updatedTabIds.length > 0) {
          const nextConversation = state.conversations.find(c => c.id === updatedTabIds[0]);
          if (nextConversation) {
            ConversationStorage.saveCurrentConversationId(nextConversation.id);
          }
          return {
            openTabIds: updatedTabIds,
            currentConversation: nextConversation || null,
          };
        } else {
          ConversationStorage.saveCurrentConversationId(null);
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
        const newTabIds = [conversationId, ...state.openTabIds.slice(0, 9)];
        localStorage.setItem('openTabIds', JSON.stringify(newTabIds));
        return {
          openTabIds: newTabIds,
        };
      }
      return state;
    }),
  
  setActiveView: (view) => 
    set({ activeView: view }),
    
  initializeStore: async () => {
    const conversations = ConversationStorage.loadConversations();
    const currentConversationId = ConversationStorage.loadCurrentConversationId();
    const currentConversation = currentConversationId 
      ? conversations.find(c => c.id === currentConversationId) || null
      : null;
    
    const savedTabIds = localStorage.getItem('openTabIds');
    let openTabIds: string[] = [];
    
    if (savedTabIds) {
      const parsedTabIds = JSON.parse(savedTabIds) as string[];
      openTabIds = parsedTabIds.filter(id => conversations.some(c => c.id === id));
    }
    
    if (openTabIds.length === 0 && currentConversation) {
      openTabIds = [currentConversation.id];
    }
    
    set({
      conversations,
      currentConversation,
      openTabIds,
    });
    
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
});