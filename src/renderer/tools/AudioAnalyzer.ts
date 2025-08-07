import { essentiaService } from '../services/essentiaService';

interface AudioAnalysisResult {
  instruments: InstrumentTag[];
  style: string[];
  bpm: number;
  key: string;
  energy: number;
  valence: number;
  danceability: number;
  loudness: number;
  spectralCentroid: number;
  tempo?: number;
  beats?: Float32Array;
  onset?: Float32Array;
  mfcc?: Float32Array;
  chromagram?: Float32Array;
}

interface InstrumentTag {
  label: string;
  confidence: number;
}

export class AudioAnalyzer {
  constructor() {
    // Essentia service handles initialization
  }

  async analyze(audioFile: File | ArrayBuffer | Float32Array): Promise<AudioAnalysisResult> {
    try {
      // Use the Essentia service for proper analysis
      const analysis = await essentiaService.analyze(audioFile);
      return analysis;
    } catch (error) {
      console.error('Audio analysis failed:', error);
      throw new Error(`Failed to analyze audio: ${error}`);
    }
  }

  // Public utility methods
  async detectBPM(audioFile: File | ArrayBuffer | Float32Array): Promise<number> {
    return await essentiaService.detectBPM(audioFile);
  }

  async detectKey(audioFile: File | ArrayBuffer | Float32Array): Promise<string> {
    return await essentiaService.detectKey(audioFile);
  }

  // Cleanup method
  dispose(): void {
    essentiaService.dispose();
  }
}

// Export singleton instance for easy usage
export const audioAnalyzer = new AudioAnalyzer();