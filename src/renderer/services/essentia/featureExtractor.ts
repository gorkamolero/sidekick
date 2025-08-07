import { EssentiaFeatures } from './types';

export class FeatureExtractor {
  constructor(private essentia: any) {}
  
  extractFeatures(audioSignal: Float32Array): EssentiaFeatures {
    const sampleRate = 44100;
    const frameSize = 2048;
    const hopSize = 1024;
    
    // Rhythm analysis
    const percivalBpmEstimator = this.essentia.PercivalBpmEstimator(audioSignal, frameSize, hopSize, sampleRate);
    const bpm = percivalBpmEstimator.bpm;
    const ticks = percivalBpmEstimator.ticks;
    
    // Additional rhythm analysis for beats
    const beatTracker = this.essentia.BeatTrackerDegara(audioSignal, sampleRate);
    const beats = beatTracker.beats;
    const tempo = beatTracker.bpm || bpm;
    
    // Onset detection
    const onsetRate = this.essentia.OnsetRate(audioSignal);
    const onset = onsetRate.onsets;
    
    // Key detection
    const keyExtractor = this.essentia.KeyExtractor(audioSignal, sampleRate);
    const key = keyExtractor.key;
    const scale = keyExtractor.scale;
    
    // Energy calculation
    const energy = this.essentia.Energy(audioSignal);
    
    // Loudness estimation
    const loudness = this.essentia.Loudness(audioSignal);
    
    // Spectral analysis
    const spectralCentroid = this.essentia.SpectralCentroidTime(audioSignal, sampleRate);
    const spectralRolloff = this.essentia.RollOff(audioSignal, sampleRate);
    const zeroCrossingRate = this.essentia.ZeroCrossingRate(audioSignal);
    
    // Compute additional features
    const mfcc = this.computeMFCC(audioSignal, frameSize, hopSize);
    const spectralContrast = this.computeSpectralContrast(audioSignal, frameSize);
    const chromagram = this.computeChromagram(audioSignal, frameSize, hopSize, sampleRate);
    
    // Calculate danceability based on multiple factors
    const danceability = this.calculateDanceability(bpm, beats, energy);
    
    return {
      bpm,
      tempo,
      beats,
      ticks,
      onset,
      key,
      scale,
      energy,
      loudness,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc,
      spectralContrast,
      chromagram,
      danceability
    };
  }
  
  private computeMFCC(signal: Float32Array, frameSize: number, hopSize: number): Float32Array {
    try {
      const mfccFrames = this.essentia.MFCC(signal, {
        inputSize: frameSize,
        hopSize: hopSize,
        numberCoefficients: 13
      });
      
      // Average MFCCs across frames
      const avgMfcc = new Float32Array(13);
      for (let i = 0; i < mfccFrames.mfcc.length; i++) {
        for (let j = 0; j < 13; j++) {
          avgMfcc[j] += mfccFrames.mfcc[i][j];
        }
      }
      for (let j = 0; j < 13; j++) {
        avgMfcc[j] /= mfccFrames.mfcc.length;
      }
      return avgMfcc;
    } catch (error) {
      console.error('MFCC computation failed:', error);
      return new Float32Array(13);
    }
  }
  
  private computeSpectralContrast(signal: Float32Array, frameSize: number): Float32Array {
    try {
      const contrast = this.essentia.SpectralContrast(signal, { frameSize });
      return contrast.spectralContrast || new Float32Array(7);
    } catch (error) {
      console.error('Spectral contrast computation failed:', error);
      return new Float32Array(7);
    }
  }
  
  private computeChromagram(signal: Float32Array, frameSize: number, hopSize: number, sampleRate: number): Float32Array {
    try {
      const chromagram = this.essentia.Chromagram(signal, {
        frameSize,
        hopSize,
        sampleRate,
        numberBins: 12
      });
      
      // Average chromagram across frames
      const avgChroma = new Float32Array(12);
      for (let i = 0; i < chromagram.chromagram.length; i++) {
        for (let j = 0; j < 12; j++) {
          avgChroma[j] += chromagram.chromagram[i][j];
        }
      }
      for (let j = 0; j < 12; j++) {
        avgChroma[j] /= chromagram.chromagram.length;
      }
      return avgChroma;
    } catch (error) {
      console.error('Chromagram computation failed:', error);
      return new Float32Array(12);
    }
  }
  
  private calculateDanceability(bpm: number, beats: Float32Array, energy: number): number {
    // Ideal dance BPM range: 120-130 for house, 140-150 for trance, 170-180 for DnB
    const idealBpmRanges = [
      { min: 120, max: 130, weight: 1.0 },
      { min: 90, max: 110, weight: 0.8 },  // Hip-hop
      { min: 140, max: 150, weight: 0.9 },  // Trance
      { min: 170, max: 180, weight: 0.85 }, // DnB
      { min: 60, max: 80, weight: 0.6 },    // Slow/ballad
    ];
    
    let bpmScore = 0.3; // Base score
    for (const range of idealBpmRanges) {
      if (bpm >= range.min && bpm <= range.max) {
        bpmScore = range.weight;
        break;
      }
    }
    
    // Beat regularity score (more regular = more danceable)
    let beatRegularity = 0;
    if (beats.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < beats.length; i++) {
        intervals.push(beats[i] - beats[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      beatRegularity = 1 / (1 + variance); // Lower variance = higher regularity
    }
    
    // Combine factors
    const danceability = (bpmScore * 0.4) + (beatRegularity * 0.3) + (energy * 0.3);
    
    return Math.min(1, Math.max(0, danceability));
  }
}