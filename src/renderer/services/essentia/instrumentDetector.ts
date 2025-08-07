import { InstrumentTag, EssentiaFeatures } from './types';

export class InstrumentDetector {
  detectInstruments(features: EssentiaFeatures): InstrumentTag[] {
    const instruments: InstrumentTag[] = [];
    
    // Analyze spectral characteristics to detect instruments
    const avgSpectralCentroid = features.spectralCentroid;
    const avgEnergy = features.energy;
    const hasRegularBeat = features.beats.length > 0;
    
    // Drums/Percussion detection
    if (hasRegularBeat && features.onset.length > features.beats.length * 2) {
      instruments.push({ label: 'Drum kit', confidence: 0.85 });
    }
    
    // Bass detection (low frequency content)
    if (avgSpectralCentroid < 500 && avgEnergy > 0.3) {
      instruments.push({ label: 'Bass', confidence: 0.75 });
    }
    
    // Synthesizer detection (specific spectral patterns)
    if (features.spectralContrast && this.hasRegularSpectralPattern(features.spectralContrast)) {
      instruments.push({ label: 'Synthesizer', confidence: 0.8 });
    }
    
    // Piano/Keys detection (harmonic content)
    const hasHarmonicContent = features.chromagram.some(value => value > 0.5);
    if (hasHarmonicContent && avgSpectralCentroid > 1000 && avgSpectralCentroid < 3000) {
      instruments.push({ label: 'Piano', confidence: 0.7 });
    }
    
    // Guitar detection (mid-range with specific attack characteristics)
    if (avgSpectralCentroid > 800 && avgSpectralCentroid < 2500 && features.onset.length > 0) {
      const hasPluckedCharacteristics = features.zeroCrossingRate > 0.1;
      if (hasPluckedCharacteristics) {
        instruments.push({ label: 'Guitar', confidence: 0.65 });
      }
    }
    
    // Vocals detection (formant characteristics in MFCC)
    const vocalMfccPattern = features.mfcc[1] > 0 && features.mfcc[2] > 0 && features.mfcc[3] > 0;
    if (vocalMfccPattern && avgSpectralCentroid > 1500) {
      instruments.push({ label: 'Vocals', confidence: 0.6 });
    }
    
    // Sort by confidence
    instruments.sort((a, b) => b.confidence - a.confidence);
    
    // Return top 3 most confident
    return instruments.slice(0, 3);
  }
  
  private hasRegularSpectralPattern(spectralContrast: Float32Array): boolean {
    if (!spectralContrast || spectralContrast.length === 0) return false;
    
    // Check for regular patterns in spectral contrast
    let regularityScore = 0;
    for (let i = 1; i < spectralContrast.length; i++) {
      const diff = Math.abs(spectralContrast[i] - spectralContrast[i - 1]);
      if (diff < 0.2) regularityScore++;
    }
    
    return regularityScore > spectralContrast.length * 0.6;
  }
}