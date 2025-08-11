import { Essentia, EssentiaWASM } from 'essentia.js';
import decode from 'audio-decode';

export interface ChordResult {
  chord: string;
  confidence: number;
  timestamp: number;
}

export interface ChordProgression {
  chords: ChordResult[];
  key?: string;
  tempo?: number;
}

export class ChordDetectionService {
  private essentia: any;
  private isInitialized = false;
  private frameSize = 4096;
  private hopSize = 2048;
  private sampleRate = 44100;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const essentiaWasm = await EssentiaWASM();
      this.essentia = new Essentia(essentiaWasm);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw new Error('Chord detection service initialization failed');
    }
  }

  async analyzeAudioBuffer(audioBuffer: ArrayBuffer): Promise<ChordProgression> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const audioData = await decode(audioBuffer);
      const monoData = this.convertToMono(audioData);
      const audioVector = this.essentia.arrayToVector(monoData);
      
      const chords = this.detectChords(audioVector);
      const key = this.detectKey(audioVector);
      
      audioVector.delete();
      
      return {
        chords,
        key,
        tempo: this.calculateTempo(audioData)
      };
    } catch (error) {
      console.error('Chord analysis failed:', error);
      throw new Error('Failed to analyze audio for chord progression');
    }
  }

  private convertToMono(audioData: any): Float32Array {
    if (audioData.numberOfChannels === 1) {
      return audioData.getChannelData(0);
    }
    
    const left = audioData.getChannelData(0);
    const right = audioData.getChannelData(1);
    const mono = new Float32Array(left.length);
    
    for (let i = 0; i < left.length; i++) {
      mono[i] = (left[i] + right[i]) / 2;
    }
    
    return mono;
  }

  private detectChords(audioVector: any): ChordResult[] {
    const results: ChordResult[] = [];
    
    const frames = this.essentia.FrameGenerator(
      audioVector,
      this.frameSize,
      this.hopSize
    );

    const timeStep = this.hopSize / this.sampleRate;

    for (let i = 0; i < frames.size(); i++) {
      const frame = frames.get(i);
      
      try {
        const windowed = this.essentia.Windowing(frame, {
          type: 'blackmanharris62',
          size: this.frameSize,
          zeroPadding: 0,
          normalized: true
        });

        const spectrum = this.essentia.Spectrum(windowed.frame, {
          size: this.frameSize
        });

        const peaks = this.essentia.SpectralPeaks(spectrum.spectrum, {
          sampleRate: this.sampleRate,
          maxPeaks: 100,
          threshold: 0.00001,
          minFrequency: 40,
          maxFrequency: 5000,
          orderBy: 'magnitude'
        });

        const whitened = this.essentia.SpectralWhitening(
          spectrum.spectrum,
          peaks.frequencies,
          peaks.magnitudes,
          {
            sampleRate: this.sampleRate,
            maxFrequency: 5000
          }
        );

        const hpcp = this.essentia.HPCP(
          whitened.magnitudes,
          whitened.frequencies,
          {
            size: 12,
            referenceFrequency: 440,
            harmonics: 4,
            bandPreset: false,
            minFrequency: 40,
            maxFrequency: 5000,
            splitFrequency: 500,
            weightType: 'squaredCosine',
            nonLinear: false,
            normalized: 'unitSum',
            windowSize: 1.0
          }
        );

        const chord = this.essentia.ChordsDetection(hpcp.hpcp, {
          hopSize: this.hopSize,
          sampleRate: this.sampleRate,
          windowSize: 2.0
        });

        if (chord.chords && chord.chords !== 'N') {
          results.push({
            chord: chord.chords,
            confidence: chord.strength || 0,
            timestamp: i * timeStep
          });
        }

        frame.delete();
        windowed.frame.delete();
        spectrum.spectrum.delete();
        peaks.frequencies.delete();
        peaks.magnitudes.delete();
        whitened.magnitudes.delete();
        whitened.frequencies.delete();
        hpcp.hpcp.delete();
      } catch (error) {
        console.warn(`Frame ${i} processing failed:`, error);
        frame.delete();
      }
    }

    frames.delete();
    return this.smoothChordProgression(results);
  }

  private detectKey(audioVector: any): string {
    try {
      const frames = this.essentia.FrameGenerator(
        audioVector,
        this.frameSize * 4,
        this.hopSize * 4
      );

      const hpcpSum = new Array(12).fill(0);
      let frameCount = 0;

      for (let i = 0; i < frames.size(); i++) {
        const frame = frames.get(i);
        
        try {
          const windowed = this.essentia.Windowing(frame, { type: 'hann' });
          const spectrum = this.essentia.Spectrum(windowed.frame);
          const peaks = this.essentia.SpectralPeaks(spectrum.spectrum);
          
          const hpcp = this.essentia.HPCP(
            peaks.magnitudes,
            peaks.frequencies,
            { size: 12, harmonics: 4, normalized: 'unitSum' }
          );

          const hpcpArray = this.essentia.vectorToArray(hpcp.hpcp);
          for (let j = 0; j < 12; j++) {
            hpcpSum[j] += hpcpArray[j];
          }
          frameCount++;

          frame.delete();
          windowed.frame.delete();
          spectrum.spectrum.delete();
          peaks.frequencies.delete();
          peaks.magnitudes.delete();
          hpcp.hpcp.delete();
        } catch (error) {
          frame.delete();
        }
      }

      frames.delete();

      if (frameCount === 0) return 'C';

      for (let i = 0; i < 12; i++) {
        hpcpSum[i] /= frameCount;
      }

      const avgHpcp = this.essentia.arrayToVector(hpcpSum);
      const keyResult = this.essentia.Key(avgHpcp);
      const detectedKey = keyResult.key;
      
      avgHpcp.delete();
      
      return detectedKey || 'C';
    } catch (error) {
      console.warn('Key detection failed:', error);
      return 'C';
    }
  }

  private calculateTempo(audioData: any): number {
    try {
      const monoData = this.convertToMono(audioData);
      const audioVector = this.essentia.arrayToVector(monoData);
      
      const tempoResult = this.essentia.RhythmExtractor2013(audioVector);
      const bpm = tempoResult.bpm;
      
      audioVector.delete();
      
      return Math.round(bpm) || 120;
    } catch (error) {
      console.warn('Tempo detection failed:', error);
      return 120;
    }
  }

  private smoothChordProgression(chords: ChordResult[]): ChordResult[] {
    if (chords.length <= 2) return chords;

    const smoothed: ChordResult[] = [];
    let currentChord = chords[0];
    let chordStart = currentChord.timestamp;
    let confidenceSum = currentChord.confidence;
    let count = 1;

    for (let i = 1; i < chords.length; i++) {
      if (chords[i].chord === currentChord.chord) {
        confidenceSum += chords[i].confidence;
        count++;
      } else {
        if (count >= 3 || (i - count + 1 === 0)) {
          smoothed.push({
            chord: currentChord.chord,
            confidence: confidenceSum / count,
            timestamp: chordStart
          });
        }
        
        currentChord = chords[i];
        chordStart = currentChord.timestamp;
        confidenceSum = currentChord.confidence;
        count = 1;
      }
    }

    if (count >= 3) {
      smoothed.push({
        chord: currentChord.chord,
        confidence: confidenceSum / count,
        timestamp: chordStart
      });
    }

    return smoothed;
  }

  async analyzeFile(filePath: string): Promise<ChordProgression> {
    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      return this.analyzeAudioBuffer(arrayBuffer);
    } catch (error) {
      console.error('Failed to analyze file:', error);
      throw new Error('Failed to load and analyze audio file');
    }
  }

  dispose(): void {
    this.isInitialized = false;
  }
}

export const chordDetectionService = new ChordDetectionService();