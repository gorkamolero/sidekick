import { Conversation, ChatMessage } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'sidekick_conversations',
  CURRENT_CONVERSATION_ID: 'sidekick_current_conversation',
  SETTINGS: 'sidekick_settings',
} as const;

export class ConversationStorage {
  // Save conversations to localStorage (keeps last 20)
  static saveConversations(conversations: Conversation[]): void {
    try {
      // Keep only the last 20 conversations in localStorage for quick access
      const recentConversations = conversations.slice(0, 20);
      localStorage.setItem(
        STORAGE_KEYS.CONVERSATIONS,
        JSON.stringify(recentConversations.map(conv => ({
          ...conv,
          // Convert dates to strings for JSON
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
        })))
      );
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  // Load conversations from localStorage
  static loadConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((conv: any) => ({
        ...conv,
        // Convert strings back to dates
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  // Save current conversation ID
  static saveCurrentConversationId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
    }
  }

  // Load current conversation ID
  static loadCurrentConversationId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
  }

  // Clear all storage
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Generate a title from the first user message
  static generateTitle(messages: ChatMessage[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Conversation';
    
    const content = firstUserMessage.content;
    // Take first 50 chars or until first newline
    const title = content.split('\n')[0].substring(0, 50);
    return title.length < content.length ? `${title}...` : title;
  }
}

// IndexedDB for full history (future implementation)
export class ConversationDB {
  private dbName = 'SidekickDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const store = db.createObjectStore('conversations', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Create audio metadata store
        if (!db.objectStoreNames.contains('audioMetadata')) {
          const store = db.createObjectStore('audioMetadata', { keyPath: 'id' });
          store.createIndex('conversationId', 'conversationId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      
      const request = store.put({
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversation.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadAllConversations(): Promise<Conversation[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const index = store.index('updatedAt');
      
      const request = index.openCursor(null, 'prev'); // Sort by most recent
      const conversations: Conversation[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const conv = cursor.value;
          conversations.push({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          });
          cursor.continue();
        } else {
          resolve(conversations);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const conversationDB = new ConversationDB();