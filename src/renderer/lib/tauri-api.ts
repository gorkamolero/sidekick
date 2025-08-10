import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { writeFile, readFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

// Replace Electron IPC with Tauri commands
export const tauriAPI = {
  async saveAudioFile(buffer: ArrayBuffer, filename: string): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const bytes = Array.from(uint8Array);
    return await invoke<string>('save_audio_file', { 
      buffer: bytes, 
      filename 
    });
  },

  async getProjectInfo(): Promise<{
    bpm: number;
    key: string;
    timeSignature: string;
  }> {
    return await invoke('get_project_info');
  },

  async getTempAudioPath(filename: string): Promise<string> {
    return await invoke<string>('get_temp_audio_path', { filename });
  },

  // File dialog
  async openFileDialog(filters?: { name: string; extensions: string[] }[]) {
    return await open({
      multiple: false,
      filters: filters || [{
        name: 'Audio Files',
        extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a']
      }]
    });
  },

  // Event listeners for drag and drop
  async onFileDrop(callback: (paths: string[]) => void) {
    return await listen('tauri://drag-drop', (event) => {
      const paths = event.payload as string[];
      callback(paths);
    });
  },

  async onDragEnter(callback: () => void) {
    return await listen('tauri://drag-enter', () => {
      callback();
    });
  },

  async onDragLeave(callback: () => void) {
    return await listen('tauri://drag-leave', () => {
      callback();
    });
  },

  // Note: Agent functionality uses AI SDK directly in hooks, no IPC needed
};

// Export for backward compatibility
export default tauriAPI;