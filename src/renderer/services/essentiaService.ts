import { Essentia, EssentiaWASM } from 'essentia.js';

interface EssentiaFeatures {
  bpm: number;
  key: string;
  scale: string;
  energy: number;
  danceability: number;
  loudness: number;
  spectralCentroid: number;
  mfcc: Float32Array;
  spectralRolloff: number;
  zeroCrossingRate: number;
  spectralContrast: Float32Array;
  chromagram: Float32Array;
  onset: Float32Array;
  tempo: number;
  beats: Float32Array;
  ticks: Float32Array;
}

interface AudioAnalysisResult {
  instruments: InstrumentTag[];
  style: string[];
  bpm: number;
  key: string;
  scale: string;
  energy: number;
  valence: number;
  danceability: number;
  loudness: number;
  spectralCentroid: number;
  tempo: number;
  beats: Float32Array;
  onset: Float32Array;
  mfcc: Float32Array;
  chromagram: Float32Array;
}

interface InstrumentTag {
  label: string;
  confidence: number;
}

export class EssentiaService {
  private essentia: any;
  private isInitialized = false;
  private pannsModel: any = null;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize Essentia.js
      this.essentia = new Essentia(EssentiaWASM);
      
      // Load PANNs model for instrument detection
      await this.loadPANNsModel();
      
      this.isInitialized = true;
      console.log('✅ Essentia.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw new Error(`Essentia.js initialization failed: ${error}`);
    }
  }
  
  private async loadPANNsModel(): Promise<void> {
    try {
      // PANNs model loading would go here
      // For now, we'll use Essentia's built-in classifiers
      console.log('PANNs model placeholder - using Essentia classifiers');
    } catch (error) {
      console.error('Failed to load PANNs model:', error);
    }
  }
  
  async analyze(audioInput: File | ArrayBuffer | Float32Array): Promise<AudioAnalysisResult> {
    await this.ensureInitialized();
    
    try {
      // Convert input to Float32Array
      const audioSignal = await this.loadAudio(audioInput);
      
      // Extract all features using Essentia.js
      const features = this.extractFeatures(audioSignal);
      
      // Detect instruments using spectral features
      const instruments = this.detectInstruments(features);
      
      // Map features to musical style
      const style = this.mapToStyle(features);
      
      // Calculate valence from features
      const valence = this.calculateValence(features);
      
      return {
        instruments,
        style,
        bpm: features.bpm,
        key: features.key,
        scale: features.scale,
        energy: features.energy,
        valence,
        danceability: features.danceability,
        loudness: features.loudness,
        spectralCentroid: features.spectralCentroid,
        tempo: features.tempo,
        beats: features.beats,
        onset: features.onset,
        mfcc: features.mfcc,
        chromagram: features.chromagram,
      };
    } catch (error) {
      console.error('Audio analysis failed:', error);
      throw new Error(`Failed to analyze audio: ${error}`);
    }
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  private async loadAudio(input: File | ArrayBuffer | Float32Array): Promise<Float32Array> {
    if (input instanceof Float32Array) {
      return input;
    }
    
    if (input instanceof File) {
      const arrayBuffer = await input.arrayBuffer();
      return await this.decodeAudioData(arrayBuffer);
    }
    
    if (input instanceof ArrayBuffer) {
      return await this.decodeAudioData(input);
    }
    
    throw new Error('Invalid audio input type');
  }
  
  private async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to mono by averaging channels
    const channelData = audioBuffer.getChannelData(0);
    if (audioBuffer.numberOfChannels > 1) {
      const secondChannel = audioBuffer.getChannelData(1);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (channelData[i] + secondChannel[i]) / 2;
      }
    }
    
    await audioContext.close();
    return channelData;
  }
  
  private extractFeatures(audioSignal: Float32Array): EssentiaFeatures {
    // Frame-based processing parameters
    const frameSize = 2048;
    const hopSize = 1024;
    const sampleRate = 44100;
    
    // Compute rhythm features
    const rhythmExtractor = this.essentia.RhythmExtractor2013({
      signal: audioSignal,
      sampleRate: sampleRate
    });
    
    // Compute key and scale
    const keyExtractor = this.essentia.KeyExtractor({
      signal: audioSignal,
      sampleRate: sampleRate
    });
    
    // Compute spectral features
    const spectralCentroid = this.essentia.SpectralCentroid({
      array: audioSignal.slice(0, frameSize)
    });
    
    // Compute MFCC
    const mfcc = this.computeMFCC(audioSignal, frameSize, hopSize);
    
    // Compute energy
    const energy = this.essentia.Energy({ array: audioSignal });
    
    // Compute loudness
    const loudness = this.essentia.Loudness({ signal: audioSignal });
    
    // Compute spectral rolloff
    const spectralRolloff = this.essentia.RollOff({
      array: audioSignal.slice(0, frameSize)
    });
    
    // Compute zero crossing rate
    const zcr = this.essentia.ZeroCrossingRate({
      signal: audioSignal.slice(0, frameSize)
    });
    
    // Compute spectral contrast
    const spectralContrast = this.computeSpectralContrast(audioSignal, frameSize);
    
    // Compute chromagram
    const chromagram = this.computeChromagram(audioSignal, frameSize, hopSize, sampleRate);
    
    // Onset detection
    const onsetDetection = this.essentia.OnsetDetection({
      signal: audioSignal,
      sampleRate: sampleRate
    });
    
    // Calculate danceability based on rhythm regularity and tempo
    const danceability = this.calculateDanceability(
      rhythmExtractor.bpm,
      rhythmExtractor.beats,
      energy
    );
    
    return {
      bpm: rhythmExtractor.bpm,
      tempo: rhythmExtractor.bpm,
      beats: rhythmExtractor.beats,
      key: keyExtractor.key,
      scale: keyExtractor.scale,
      energy: energy,
      danceability: danceability,
      loudness: loudness.loudness,
      spectralCentroid: spectralCentroid.centroid,
      mfcc: mfcc,
      spectralRolloff: spectralRolloff.rolloff,
      zeroCrossingRate: zcr.zeroCrossingRate,
      spectralContrast: spectralContrast,
      chromagram: chromagram,
      onset: onsetDetection.onsets
    };
  }
  
  private computeMFCC(signal: Float32Array, frameSize: number, hopSize: number): Float32Array {
    const mfccFrames: number[] = [];
    const numFrames = Math.floor((signal.length - frameSize) / hopSize) + 1;
    
    for (let i = 0; i < numFrames; i++) {
      const start = i * hopSize;
      const frame = signal.slice(start, start + frameSize);
      
      if (frame.length === frameSize) {
        const mfccFrame = this.essentia.MFCC({
          signal: frame,
          sampleRate: 44100
        });
        mfccFrames.push(...mfccFrame.mfcc);
      }
    }
    
    return new Float32Array(mfccFrames);
  }
  
  private computeSpectralContrast(signal: Float32Array, frameSize: number): Float32Array {
    const frame = signal.slice(0, frameSize);
    const spectrum = this.essentia.Spectrum({ signal: frame });
    const spectralContrast = this.essentia.SpectralContrast({
      spectrum: spectrum.spectrum
    });
    return spectralContrast.spectralContrast;
  }
  
  private computeChromagram(signal: Float32Array, frameSize: number, hopSize: number, sampleRate: number): Float32Array {
    const chromaFrames: number[] = [];
    const numFrames = Math.floor((signal.length - frameSize) / hopSize) + 1;
    
    for (let i = 0; i < numFrames; i++) {
      const start = i * hopSize;
      const frame = signal.slice(start, start + frameSize);
      
      if (frame.length === frameSize) {
        const spectrum = this.essentia.Spectrum({ signal: frame });
        const chromagram = this.essentia.Chromagram({
          spectrum: spectrum.spectrum,
          sampleRate: sampleRate
        });
        chromaFrames.push(...chromagram.chromagram);
      }
    }
    
    return new Float32Array(chromaFrames);
  }
  
  private calculateDanceability(bpm: number, beats: Float32Array, energy: number): number {
    let danceability = 0;
    
    // Optimal dance tempo range (100-130 BPM)
    if (bpm >= 100 && bpm <= 130) {
      danceability = 1.0;
    } else if (bpm >= 90 && bpm <= 140) {
      danceability = 0.8;
    } else if (bpm >= 80 && bpm <= 150) {
      danceability = 0.6;
    } else {
      danceability = 0.4;
    }
    
    // Factor in beat regularity
    if (beats && beats.length > 1) {
      const beatIntervals = [];
      for (let i = 1; i < beats.length; i++) {
        beatIntervals.push(beats[i] - beats[i - 1]);
      }
      const avgInterval = beatIntervals.reduce((a, b) => a + b, 0) / beatIntervals.length;
      const variance = beatIntervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - avgInterval, 2);
      }, 0) / beatIntervals.length;
      const regularity = 1 / (1 + variance);
      danceability *= (0.7 + 0.3 * regularity);
    }
    
    // Factor in energy
    danceability *= (0.5 + 0.5 * Math.min(energy * 2, 1));
    
    return Math.min(Math.max(danceability, 0), 1);
  }
  
  private detectInstruments(features: EssentiaFeatures): InstrumentTag[] {
    const instruments: InstrumentTag[] = [];
    
    // Use spectral features to detect instrument presence
    // This is a simplified approach - real PANNs would be more accurate
    
    const centroid = features.spectralCentroid;
    const mfcc = features.mfcc;
    const spectralContrast = features.spectralContrast;
    
    // Bass detection (low frequency energy)
    if (centroid < 500) {
      instruments.push({ label: 'Bass guitar', confidence: 0.8 });
      instruments.push({ label: 'Kick drum', confidence: 0.7 });
    }
    
    // Mid-range instruments
    if (centroid >= 500 && centroid < 2000) {
      instruments.push({ label: 'Piano', confidence: 0.6 });
      instruments.push({ label: 'Electric guitar', confidence: 0.6 });
      instruments.push({ label: 'Synthesizer', confidence: 0.7 });
    }
    
    // High frequency instruments
    if (centroid >= 2000) {
      instruments.push({ label: 'Hi-hat', confidence: 0.7 });
      instruments.push({ label: 'Cymbal', confidence: 0.6 });
    }
    
    // Drum detection based on onset patterns
    if (features.onset && features.onset.length > 10) {
      instruments.push({ label: 'Drum kit', confidence: 0.8 });
      instruments.push({ label: 'Snare drum', confidence: 0.7 });
    }
    
    // Electronic detection based on spectral regularity
    if (spectralContrast && this.hasRegularSpectralPattern(spectralContrast)) {
      instruments.push({ label: 'Synthesizer', confidence: 0.8 });
      instruments.push({ label: 'Synth pad', confidence: 0.6 });
    }
    
    // Sort by confidence and return top instruments
    return instruments
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }
  
  private hasRegularSpectralPattern(spectralContrast: Float32Array): boolean {
    if (!spectralContrast || spectralContrast.length < 2) return false;
    
    // Check for regular patterns in spectral contrast
    let changes = 0;
    for (let i = 1; i < spectralContrast.length; i++) {
      if (Math.abs(spectralContrast[i] - spectralContrast[i - 1]) > 0.1) {
        changes++;
      }
    }
    
    // Regular pattern if few changes
    return changes < spectralContrast.length / 3;
  }
  
  private mapToStyle(features: EssentiaFeatures): string[] {
    const styles: string[] = [];
    const bpm = features.bpm;
    const key = features.key;
    const energy = features.energy;
    
    // Electronic genres based on tempo
    if (bpm >= 120 && bpm <= 130) {
      styles.push('house');
    }
    if (bpm >= 128 && bpm <= 135) {
      styles.push('techno');
    }
    if (bpm >= 138 && bpm <= 145) {
      styles.push('trance');
    }
    if (bpm >= 170 && bpm <= 180) {
      styles.push('drum and bass');
    }
    if (bpm >= 140 && bpm <= 150) {
      styles.push('dubstep');
    }
    
    // Hip-hop and trap
    if (bpm >= 60 && bpm <= 80) {
      styles.push('trap');
    }
    if (bpm >= 85 && bpm <= 95) {
      styles.push('hip hop');
    }
    
    // Rock and pop
    if (bpm >= 100 && bpm <= 140 && energy > 0.6) {
      styles.push('rock');
    }
    if (bpm >= 90 && bpm <= 120 && energy < 0.6) {
      styles.push('pop');
    }
    
    // Jazz (wider tempo range)
    if (bpm >= 100 && bpm <= 280 && key.includes('minor')) {
      styles.push('jazz');
    }
    
    // Ambient
    if (bpm < 90 && energy < 0.3) {
      styles.push('ambient');
    }
    
    // Lo-fi
    if (bpm >= 70 && bpm <= 90 && energy < 0.5) {
      styles.push('lo-fi hip hop');
    }
    
    // Default to electronic if no clear match
    if (styles.length === 0) {
      styles.push('electronic');
    }
    
    return styles;
  }
  
  private calculateValence(features: EssentiaFeatures): number {
    let valence = 0.5;
    
    // Major keys generally sound happier
    if (features.scale.toLowerCase().includes('major')) {
      valence += 0.2;
    } else if (features.scale.toLowerCase().includes('minor')) {
      valence -= 0.2;
    }
    
    // Higher energy contributes to valence
    valence += features.energy * 0.2;
    
    // Brightness (spectral centroid) affects mood
    const brightness = Math.min(features.spectralCentroid / 5000, 1);
    valence += brightness * 0.1;
    
    // Tempo affects perceived mood
    if (features.bpm >= 120 && features.bpm <= 140) {
      valence += 0.1; // Upbeat tempo
    } else if (features.bpm < 80) {
      valence -= 0.1; // Slow tempo
    }
    
    return Math.min(Math.max(valence, 0), 1);
  }
  
  // Public utility methods
  async detectBPM(audioFile: File | ArrayBuffer | Float32Array): Promise<number> {
    await this.ensureInitialized();
    const audioSignal = await this.loadAudio(audioFile);
    const rhythmExtractor = this.essentia.RhythmExtractor2013({
      signal: audioSignal,
      sampleRate: 44100
    });
    return rhythmExtractor.bpm;
  }
  
  async detectKey(audioFile: File | ArrayBuffer | Float32Array): Promise<string> {
    await this.ensureInitialized();
    const audioSignal = await this.loadAudio(audioFile);
    const keyExtractor = this.essentia.KeyExtractor({
      signal: audioSignal,
      sampleRate: 44100
    });
    return `${keyExtractor.key} ${keyExtractor.scale}`;
  }
  
  dispose(): void {
    this.isInitialized = false;
    this.essentia = null;
    this.pannsModel = null;
  }
}

export const essentiaService = new EssentiaService();