import { exec } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow } from 'electron';

const execAsync = promisify(exec);

export class AbletonDetector {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastStatus = false;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  async isAbletonRunning(): Promise<boolean> {
    try {
      if (process.platform === 'darwin') {
        // macOS: Check if Ableton Live is in running processes
        const { stdout } = await execAsync('ps aux | grep -i "Ableton Live" | grep -v grep');
        return stdout.trim().length > 0;
      } else if (process.platform === 'win32') {
        // Windows: Check running processes
        const { stdout } = await execAsync('tasklist | findstr /i "Ableton"');
        return stdout.trim().length > 0;
      }
      return false;
    } catch (error) {
      // If grep/findstr doesn't find anything, it returns an error
      return false;
    }
  }

  startMonitoring() {
    // Check immediately
    this.checkStatus();
    
    // Then check every 2 seconds
    this.checkInterval = setInterval(() => {
      this.checkStatus();
    }, 2000);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkStatus() {
    const isRunning = await this.isAbletonRunning();
    
    // Only send update if status changed
    if (isRunning !== this.lastStatus) {
      this.lastStatus = isRunning;
      this.mainWindow?.webContents.send('ableton-running-status', isRunning);
    }
  }
}