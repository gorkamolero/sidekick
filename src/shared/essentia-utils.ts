/**
 * Utilities for Essentia.js audio analysis
 * Provides comprehensive audio feature extraction for both Node.js and browser environments
 */

export interface EssentiaAnalysisResult {
  // Rhythm features
  bpm: number;
  beats: number;
  confidence?: number;
  onsetRate?: number;
  
  // Tonal features
  key: string;
  scale: string;
  keyStrength: number;
  tuningFrequency?: number;
  
  // Energy & Dynamics
  energy: number;
  loudness: number;
  rms: number;
  dynamicComplexity?: number;
  
  // Spectral features
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  zeroCrossingRate: number;
  
  // Timbre features (MFCC)
  mfcc: number[];
  
  // Frequency bands
  melBands: number[];
  spectralContrast: number[];
  
  // Harmonic features (HPCP/Chroma)
  hpcp: number[];
  
  // High-level features
  danceability: number;
  
  // Metadata
  duration: number;
  sampleRate: number;
}

/**
 * Comprehensive Essentia analysis function
 * Extracts all relevant audio features for Gemini AI analysis
 */
export async function analyzeAudioWithEssentia(
  essentia: any,
  audioSignal: Float32Array,
  sampleRate: number = 44100
): Promise<EssentiaAnalysisResult> {
  
  // Convert to Essentia vector
  const vectorSignal = essentia.arrayToVector(audioSignal);
  
  const result: Partial<EssentiaAnalysisResult> = {
    duration: audioSignal.length / sampleRate,
    sampleRate
  };
  
  try {
    // ========== RHYTHM ANALYSIS ==========
    try {
      const percivalBpm = essentia.PercivalBpmEstimator(vectorSignal);
      result.bpm = percivalBpm.bpm;
    } catch (e) {
      // Try alternative BPM detection
      try {
        const rhythmExtractor = essentia.RhythmExtractor2013(vectorSignal);
        result.bpm = rhythmExtractor.bpm;
        result.beats = rhythmExtractor.ticks.size();
        result.confidence = rhythmExtractor.confidence;
      } catch (e2) {
        console.warn('BPM detection failed');
      }
    }
    
    // Onset detection
    try {
      const onsetRateResult = essentia.OnsetRate(vectorSignal);
      result.onsetRate = onsetRateResult.onsetRate;
    } catch (e) {
      console.warn('Onset detection failed');
    }
    
    // ========== TONAL ANALYSIS ==========
    try {
      const keyExtractor = essentia.KeyExtractor(vectorSignal);
      result.key = keyExtractor.key;
      result.scale = keyExtractor.scale;
      result.keyStrength = keyExtractor.strength;
    } catch (e) {
      console.warn('Key detection failed');
    }
    
    // Tuning frequency
    try {
      const tuningExtractor = essentia.TuningFrequencyExtractor(vectorSignal);
      result.tuningFrequency = tuningExtractor.tuningFrequency;
    } catch (e) {
      // Optional feature
    }
    
    // ========== ENERGY & DYNAMICS ==========
    const energyResult = essentia.Energy(vectorSignal);
    result.energy = energyResult.energy;
    
    const loudnessResult = essentia.Loudness(vectorSignal);
    result.loudness = loudnessResult.loudness;
    
    const rmsResult = essentia.RMS(vectorSignal);
    result.rms = rmsResult.rms;
    
    try {
      const dynamicComplexityResult = essentia.DynamicComplexity(vectorSignal);
      result.dynamicComplexity = dynamicComplexityResult.dynamicComplexity;
    } catch (e) {
      // Optional feature
    }
    
    // ========== SPECTRAL FEATURES ==========
    const centroidResult = essentia.Centroid(vectorSignal);
    result.spectralCentroid = centroidResult.centroid;
    
    const rolloffResult = essentia.RollOff(vectorSignal);
    result.spectralRolloff = rolloffResult.rollOff;
    
    const zcrResult = essentia.ZeroCrossingRate(vectorSignal);
    result.zeroCrossingRate = zcrResult.zeroCrossingRate;
    
    // ========== FRAME-BASED SPECTRAL FEATURES ==========
    // Get a representative frame for spectral analysis
    const frameSize = 2048;
    const frameCutter = essentia.FrameCutter(vectorSignal, frameSize, frameSize/2);
    const windowedFrame = essentia.Windowing(frameCutter.frame);
    const spectrum = essentia.Spectrum(windowedFrame.frame);
    
    // Spectral Flatness
    const flatnessResult = essentia.Flatness(spectrum.spectrum);
    result.spectralFlatness = flatnessResult.flatness;
    
    // MFCC for timbre
    const mfccResult = essentia.MFCC(spectrum.spectrum);
    result.mfcc = essentia.vectorToArray(mfccResult.mfcc);
    
    // Mel Bands
    const melBandsResult = essentia.MelBands(spectrum.spectrum);
    result.melBands = essentia.vectorToArray(melBandsResult.bands);
    
    // Spectral Contrast
    const contrastResult = essentia.SpectralContrast(spectrum.spectrum);
    result.spectralContrast = essentia.vectorToArray(contrastResult.spectralContrast);
    
    // HPCP (Harmonic Pitch Class Profile)
    const spectralPeaks = essentia.SpectralPeaks(spectrum.spectrum);
    const hpcpResult = essentia.HPCP(spectralPeaks.frequencies, spectralPeaks.magnitudes);
    result.hpcp = essentia.vectorToArray(hpcpResult.hpcp);
    
    // ========== HIGH-LEVEL FEATURES ==========
    const danceabilityResult = essentia.Danceability(vectorSignal);
    result.danceability = danceabilityResult.danceability;
    
    // Clean up vectors
    essentia.delete(vectorSignal);
    
    return result as EssentiaAnalysisResult;
    
  } catch (error) {
    // Clean up on error
    try {
      essentia.delete(vectorSignal);
    } catch (e) {}
    throw error;
  }
}

/**
 * Format Essentia analysis results for display
 */
export function formatEssentiaResults(analysis: EssentiaAnalysisResult): string {
  const lines = [
    '🎵 RHYTHM',
    `  BPM: ${analysis.bpm?.toFixed(1) || 'N/A'}`,
    `  Beats: ${analysis.beats || 'N/A'}`,
    analysis.onsetRate ? `  Onset Rate: ${analysis.onsetRate.toFixed(2)} onsets/sec` : '',
    '',
    '🎹 TONAL',
    `  Key: ${analysis.key} ${analysis.scale}`,
    `  Key Strength: ${analysis.keyStrength?.toFixed(3) || 'N/A'}`,
    analysis.tuningFrequency ? `  Tuning: ${analysis.tuningFrequency.toFixed(2)} Hz` : '',
    '',
    '📊 ENERGY',
    `  Energy: ${analysis.energy.toFixed(4)}`,
    `  Loudness: ${analysis.loudness.toFixed(2)}`,
    `  RMS: ${analysis.rms.toFixed(4)}`,
    '',
    '🌈 SPECTRAL',
    `  Centroid: ${analysis.spectralCentroid.toFixed(2)}`,
    `  Rolloff: ${analysis.spectralRolloff.toFixed(2)} Hz`,
    `  Flatness: ${analysis.spectralFlatness.toFixed(4)} (0=tonal, 1=noise)`,
    `  Zero Crossing Rate: ${analysis.zeroCrossingRate.toFixed(4)}`,
    '',
    '🎨 TIMBRE',
    `  MFCC (${analysis.mfcc.length} coeffs): [${analysis.mfcc.slice(0, 5).map(v => v.toFixed(2)).join(', ')}...]`,
    `  Mel Bands: ${analysis.melBands.length} bands`,
    `  Spectral Contrast: ${analysis.spectralContrast.length} bands`,
    '',
    '🎼 HARMONIC',
    `  HPCP/Chroma: [${analysis.hpcp.map(v => v.toFixed(2)).join(', ')}]`,
    '',
    '💃 PRODUCTION',
    `  Danceability: ${(analysis.danceability * 100).toFixed(1)}%`,
    '',
    '📋 METADATA',
    `  Duration: ${analysis.duration.toFixed(2)} seconds`,
    `  Sample Rate: ${analysis.sampleRate} Hz`
  ];
  
  return lines.filter(line => line).join('\n');
}