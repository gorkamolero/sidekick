import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  saveAudioFile: (buffer: ArrayBuffer, filename: string) => 
    ipcRenderer.invoke('save-audio-file', buffer, filename),
  getProjectInfo: () => 
    ipcRenderer.invoke('get-project-info'),
});
