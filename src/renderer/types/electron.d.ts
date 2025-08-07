export interface ElectronAPI {
  saveAudioFile: (buffer: ArrayBuffer, filename: string) => Promise<any>;
  getProjectInfo: () => Promise<any>;
  
  agent: {
    sendMessage: (messages: any[]) => Promise<any>;
    streamMessage: (messages: any[], onChunk: (chunk: any) => void) => Promise<any>;
  };
  
  musicgen: {
    generate: (params: { prompt: string; duration?: number }) => Promise<any>;
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
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}