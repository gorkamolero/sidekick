import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  saveAudioFile: (buffer: ArrayBuffer, filename: string) => 
    ipcRenderer.invoke('save-audio-file', buffer, filename),
  getProjectInfo: () => 
    ipcRenderer.invoke('get-project-info'),
  
  // Mastra agent methods
  agent: {
    sendMessage: (messages: any[]) => 
      ipcRenderer.invoke('agent:sendMessage', { messages }),
    streamMessage: async (messages: any[], onChunk: (chunk: any) => void) => {
      // Set up listener for stream chunks
      const listener = (event: any, chunk: any) => onChunk(chunk);
      ipcRenderer.on('agent:streamChunk', listener);
      
      // Start streaming
      const result = await ipcRenderer.invoke('agent:streamMessage', { messages });
      
      // DON'T remove the listener here - it needs to stay active for streaming!
      // The renderer will handle cleanup when needed
      
      return result;
    },
  },
  
  // MusicGen methods
  musicgen: {
    generate: (params: { prompt: string; duration?: number }) =>
      ipcRenderer.invoke('musicgen:generate', params),
    onGenerate: (callback: (event: any, data: any) => void) => {
      ipcRenderer.on('musicgen:generate', callback);
      return () => ipcRenderer.removeListener('musicgen:generate', callback);
    },
  },
  
  // Audio methods
  audio: {
    onGenerated: (callback: (event: any, data: any) => void) => {
      ipcRenderer.on('audio:generated', callback);
      return () => ipcRenderer.removeListener('audio:generated', callback);
    },
  },
  
  // IPC renderer for general communication
  ipcRenderer: {
    on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
      ipcRenderer.on(channel, callback);
    },
    once: (channel: string, callback: (event: any, ...args: any[]) => void) => {
      ipcRenderer.once(channel, callback);
    },
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    removeListener: (channel: string, callback: (event: any, ...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },
});
