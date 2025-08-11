import Dexie, { type EntityTable } from 'dexie'
import type { Message } from 'ai'

export interface ConversationDB {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface TabsDB {
  id: string
  tabIds: string[]
}

export interface SettingsDB {
  id: string
  value: any
}

const db = new Dexie('SidekickDB') as Dexie & {
  conversations: EntityTable<ConversationDB, 'id'>
  tabs: EntityTable<TabsDB, 'id'>
  settings: EntityTable<SettingsDB, 'id'>
}

db.version(1).stores({
  conversations: '&id, title, createdAt, updatedAt',
  tabs: '&id',
  settings: '&id'
})

export async function saveConversation(id: string, title: string, messages: Message[], createdAt?: Date) {
  await db.conversations.put({
    id,
    title,
    messages,
    createdAt: createdAt || new Date(),
    updatedAt: new Date()
  })
}

export async function loadConversation(id: string) {
  return await db.conversations.get(id)
}

export async function updateConversationMessages(id: string, messages: Message[]) {
  await db.conversations.update(id, {
    messages,
    updatedAt: new Date()
  })
}

export async function updateConversation(id: string, updates: Partial<ConversationDB>) {
  await db.conversations.update(id, {
    ...updates,
    updatedAt: new Date()
  })
}

export async function getAllConversations() {
  return await db.conversations.toArray()
}

export async function deleteConversation(id: string) {
  await db.conversations.delete(id)
}

// Tab management
export async function saveOpenTabs(tabIds: string[]) {
  await db.tabs.put({ id: 'openTabs', tabIds })
}

export async function loadOpenTabs(): Promise<string[]> {
  const tabs = await db.tabs.get('openTabs')
  return tabs?.tabIds || []
}

// Settings management
export async function saveSetting(key: string, value: any) {
  await db.settings.put({ id: key, value })
}

export async function loadSetting(key: string): Promise<any> {
  const setting = await db.settings.get(key)
  return setting?.value
}

// Convenience functions that match the old API
export const ConversationStorage = {
  async saveConversations(conversations: Conversation[]): Promise<void> {
    for (const conv of conversations.slice(0, 20)) {
      await saveConversation(conv.id, conv.title, conv.messages as any, conv.createdAt)
    }
  },

  async loadConversations(): Promise<Conversation[]> {
    return await getAllConversations() as any
  },

  async saveCurrentConversationId(id: string | null): Promise<void> {
    await saveSetting('currentConversationId', id)
  },

  async loadCurrentConversationId(): Promise<string | null> {
    return await loadSetting('currentConversationId')
  },

  generateTitle(messages: ChatMessage[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return 'New Conversation'
    const content = firstUserMessage.content
    const title = content.split('\n')[0].substring(0, 50)
    return title.length < content.length ? `${title}...` : title
  }
}

export const TabStorage = {
  async save(tabIds: string[]): Promise<void> {
    await saveOpenTabs(tabIds)
  },

  async load(): Promise<string[]> {
    return await loadOpenTabs()
  }
}

export const conversationDB = {
  saveConversation: async (conversation: Conversation) => {
    await saveConversation(
      conversation.id,
      conversation.title,
      conversation.messages as any,
      conversation.createdAt
    )
  },
  loadAllConversations: getAllConversations,
  deleteConversation,
  init: async () => {}
}

export { db }