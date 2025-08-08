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

declare global {
  interface Window {
    electron: {
      saveAudioFile: (buffer: ArrayBuffer, filename: string) => Promise<string>;
      getProjectInfo: () => Promise<ProjectInfo>;
      agent: {
        sendMessage: (messages: any[]) => Promise<{ success: boolean; response?: any; error?: string }>;
        streamMessage: (messages: any[], onChunk: (chunk: any) => void) => Promise<{ success: boolean; error?: string }>;
      };
      musicgen: {
        generate: (params: { prompt: string; duration?: number }) => 
          Promise<{ success: boolean; result?: any; error?: string }>;
        onGenerate: (callback: (event: any, data: any) => void) => () => void;
      };
      audio: {
        onGenerated: (callback: (event: any, data: any) => void) => () => void;
      };
      ipcRenderer: {
        on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
        once: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
        send: (channel: string, ...args: any[]) => void;
        removeListener: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
      };
      startDrag: (filePath: string, imageData?: string) => void;
      abletonLink: {
        enable: () => Promise<boolean>;
        disable: () => Promise<boolean>;
        setTempo: (tempo: number) => Promise<boolean>;
        getState: () => Promise<{
          isEnabled: boolean;
          isConnected: boolean;
          tempo: number;
          phase: number;
          beat: number;
          numPeers: number;
          isPlaying: boolean;
        }>;
        startPlaying: (beat?: number) => Promise<boolean>;
        stopPlaying: () => Promise<boolean>;
        onUpdate: (callback: (state: {
          isEnabled: boolean;
          isConnected: boolean;
          tempo: number;
          phase: number;
          beat: number;
          numPeers: number;
          isPlaying: boolean;
        }) => void) => () => void;
        onAbletonStatus: (callback: (isRunning: boolean) => void) => () => void;
      };
    };
  }
}