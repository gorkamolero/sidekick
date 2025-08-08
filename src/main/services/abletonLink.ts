import { BrowserWindow, ipcMain } from 'electron';

let AbletonLink: any;
let link: any = null;
let isEnabled = false;
let updateInterval: NodeJS.Timeout | null = null;

interface LinkState {
  isEnabled: boolean;
  isConnected: boolean;
  tempo: number;
  phase: number;
  beat: number;
  numPeers: number;
  isPlaying: boolean;
}

export async function initializeAbletonLink(mainWindow: BrowserWindow) {
  // DISABLED: abletonlink package won't compile
  // TODO: Find alternative solution or fix native compilation
  console.warn('Ableton Link is currently disabled - native package compilation issues');
  setupIpcHandlers();
  
  // Send mock updates so UI doesn't break
  setInterval(() => {
    const state: LinkState = {
      isEnabled: false,
      isConnected: false,
      tempo: 120,
      phase: 0,
      beat: 0,
      numPeers: 0,
      isPlaying: false
    };
    mainWindow.webContents.send('ableton-link-update', state);
  }, 1000);
}

function setupIpcHandlers() {
  ipcMain.handle('ableton-link-enable', () => {
    if (!link) return false;
    
    link.enable(true);
    isEnabled = true;
    return true;
  });

  ipcMain.handle('ableton-link-disable', () => {
    if (!link) return false;
    
    link.enable(false);
    isEnabled = false;
    return true;
  });

  ipcMain.handle('ableton-link-set-tempo', (_event, tempo: number) => {
    if (!link || !isEnabled) return false;
    
    link.setBeatForce(0);
    link.setBpm(tempo);
    return true;
  });

  ipcMain.handle('ableton-link-get-state', () => {
    if (!link) {
      return {
        isEnabled: false,
        isConnected: false,
        tempo: 120,
        phase: 0,
        beat: 0,
        numPeers: 0,
        isPlaying: false
      };
    }

    return {
      isEnabled,
      isConnected: link.getNumPeers() > 0,
      tempo: link.getBpm(),
      phase: link.getPhase(),
      beat: link.getBeat(),
      numPeers: link.getNumPeers(),
      isPlaying: link.isPlaying()
    };
  });

  ipcMain.handle('ableton-link-start-playing', (_event, beat?: number) => {
    if (!link || !isEnabled) return false;
    
    link.play();
    if (beat !== undefined) {
      link.setBeatForce(beat);
    }
    return true;
  });

  ipcMain.handle('ableton-link-stop-playing', () => {
    if (!link || !isEnabled) return false;
    
    link.stop();
    return true;
  });
}

export function cleanupAbletonLink() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  if (link) {
    link.enable(false);
    link = null;
  }
}