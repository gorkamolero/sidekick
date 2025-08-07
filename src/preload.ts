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
      
      // Clean up listener
      ipcRenderer.removeListener('agent:streamChunk', listener);
      
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
});
