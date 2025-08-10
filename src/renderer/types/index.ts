export interface Generation {
  id: string;
  prompt: string;
  timestamp: Date;
  audioUrl: string;
  filePath?: string;
  duration: number;
  bpm: number;
  key: string;
  tags: string[];
}

export interface ProjectInfo {
  bpm: number;
  key: string;
  timeSignature: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: any[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// Removed electron types - now using Tauri APIs