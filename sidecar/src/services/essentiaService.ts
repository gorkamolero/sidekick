import * as fs from 'fs/promises';
import { loadEssentia, analyzeAudioWithEssentia, decodeAudioFile } from './essentia-utils';

export class EssentiaService {
  private static instance: EssentiaService | null = null;
  private essentia: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EssentiaService {
    if (!EssentiaService.instance) {
      EssentiaService.instance = new EssentiaService();
    }
    return EssentiaService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.essentia) return;

    try {
      this.essentia = await loadEssentia();
      this.isInitialized = true;
      console.log('✅ Essentia.js initialized in main process');
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw error;
    }
  }

  async analyzeAudio(audioBuffer: Buffer): Promise<any> {
    await this.initialize();
    
    const tempFile = `/tmp/temp_audio_${Date.now()}.tmp`;
    await fs.writeFile(tempFile, audioBuffer);
    
    try {
      const { signal, sampleRate } = await decodeAudioFile(tempFile);
      const analysis = await analyzeAudioWithEssentia(this.essentia, signal, sampleRate);
      
      const result = {
        ...analysis,
        onset: analysis.onsetRate,
        chromagram: analysis.hpcp
      };
      
      await fs.unlink(tempFile);
      
      return result;
      
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempFile);
      } catch (e) {}
      throw error;
    }
  }
  
  dispose(): void {
    this.essentia = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const essentiaService = EssentiaService.getInstance();