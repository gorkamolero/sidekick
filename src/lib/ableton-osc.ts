import { invoke } from '@tauri-apps/api/core';

export interface AbletonInfo {
  tempo: number;
  is_playing: boolean;
  current_time: number;
  scene_count: number;
  track_count: number;
  signature_numerator: number;
  signature_denominator: number;
}

export interface InstallResult {
  success: boolean;
  message: string;
  path?: string;
}

export class AbletonOSC {
  private static instance: AbletonOSC;
  private isConnected = false;
  private connectionCheckInterval?: NodeJS.Timeout;

  private constructor() {}

  static getInstance(): AbletonOSC {
    if (!AbletonOSC.instance) {
      AbletonOSC.instance = new AbletonOSC();
    }
    return AbletonOSC.instance;
  }

  /**
   * Install AbletonOSC to Ableton's Remote Scripts folder
   */
  async install(): Promise<InstallResult> {
    try {
      const result = await invoke<InstallResult>('install_ableton_osc');
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to install AbletonOSC: ${error}`,
      };
    }
  }

  /**
   * Check if AbletonOSC is installed
   */
  async checkInstalled(): Promise<boolean> {
    try {
      return await invoke<boolean>('check_ableton_osc_installed');
    } catch (error) {
      console.error('Failed to check AbletonOSC installation:', error);
      return false;
    }
  }

  /**
   * Test connection to Ableton via OSC
   */
  async testConnection(): Promise<boolean> {
    try {
      const connected = await invoke<boolean>('test_ableton_connection');
      this.isConnected = connected;
      return connected;
    } catch (error) {
      console.error('Failed to test Ableton connection:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get current Ableton Live info
   */
  async getInfo(): Promise<AbletonInfo | null> {
    try {
      const info = await invoke<AbletonInfo>('get_ableton_info');
      this.isConnected = true;
      return info;
    } catch (error) {
      console.error('Failed to get Ableton info:', error);
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Start/stop playback in Ableton
   */
  async setPlaying(playing: boolean): Promise<void> {
    try {
      await invoke('set_ableton_playing', { playing });
    } catch (error) {
      console.error('Failed to set playback state:', error);
      throw error;
    }
  }

  /**
   * Set tempo in Ableton
   */
  async setTempo(tempo: number): Promise<void> {
    try {
      await invoke('set_ableton_tempo', { tempo });
    } catch (error) {
      console.error('Failed to set tempo:', error);
      throw error;
    }
  }

  /**
   * Start automatic connection checking
   */
  startConnectionMonitoring(callback: (connected: boolean) => void, interval = 5000): void {
    this.stopConnectionMonitoring();
    
    // Initial check
    this.testConnection().then(callback);
    
    // Set up interval
    this.connectionCheckInterval = setInterval(async () => {
      const connected = await this.testConnection();
      callback(connected);
    }, interval);
  }

  /**
   * Stop automatic connection checking
   */
  stopConnectionMonitoring(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = undefined;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Execute arbitrary Python code in Ableton's Live API context
   * This gives full control over Ableton through code
   */
  async executeCode(code: string, context?: Record<string, any>): Promise<{
    success: boolean;
    result?: string;
    error?: string;
  }> {
    try {
      const response = await invoke('execute_ableton_code', {
        code,
        context: context ? JSON.stringify(context) : undefined
      });
      return response as any;
    } catch (error) {
      console.error('Failed to execute Ableton code:', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * Evaluate a Python expression in Ableton
   */
  async evaluateExpression(expression: string): Promise<{
    success: boolean;
    value?: any;
    error?: string;
  }> {
    try {
      const response = await invoke('evaluate_ableton_expression', {
        expression
      });
      return response as any;
    } catch (error) {
      console.error('Failed to evaluate expression:', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  }

}