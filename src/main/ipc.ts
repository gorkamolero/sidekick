import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Handle file operations
ipcMain.handle('save-audio-file', async (event, buffer: ArrayBuffer, filename: string) => {
  const tempDir = path.join(os.tmpdir(), 'sidekick-audio');
  await fs.mkdir(tempDir, { recursive: true });
  
  const filepath = path.join(tempDir, filename);
  await fs.writeFile(filepath, Buffer.from(buffer));
  
  return filepath;
});

ipcMain.handle('get-project-info', async () => {
  // This would connect to Ableton via OSC or file parsing
  // For now, return mock data
  return {
    bpm: 120,
    key: 'C minor',
    timeSignature: '4/4'
  };
});