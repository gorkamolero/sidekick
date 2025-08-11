/**
 * Node.js utilities for Essentia.js audio analysis
 * Provides comprehensive audio feature extraction
 */

import * as fs from 'fs/promises';
import audioDecode from 'audio-decode';

/**
 * Smooth chord progression to avoid rapid transitions
 */
function smoothChordProgression(chords) {
  if (chords.length <= 2) return chords;
  
  const smoothed = [];
  let currentChord = chords[0];
  let chordStart = currentChord.timestamp;
  let confidenceSum = currentChord.confidence;
  let count = 1;
  
  for (let i = 1; i < chords.length; i++) {
    if (chords[i].chord === currentChord.chord) {
      confidenceSum += chords[i].confidence;
      count++;
    } else {
      // Only keep chord if it appears at least 3 times or is at the beginning
      if (count >= 3 || smoothed.length === 0) {
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
  
  // Add the last chord if it's significant
  if (count >= 3) {
    smoothed.push({
      chord: currentChord.chord,
      confidence: confidenceSum / count,
      timestamp: chordStart
    });
  }
  
  return smoothed;
}

/**
 * Decode audio file to mono Float32Array
 */
export async function decodeAudioFile(filePath) {
  const audioBuffer = await fs.readFile(filePath);
  const audioData = await audioDecode(audioBuffer);
  
  // Convert to mono if stereo
  let monoSignal;
  if (audioData.numberOfChannels > 1) {
    const channelData = [];
    for (let i = 0; i < audioData.numberOfChannels; i++) {
      channelData.push(audioData.getChannelData(i));
    }
    
    // Mix down to mono
    monoSignal = new Float32Array(channelData[0].length);
    for (let i = 0; i < monoSignal.length; i++) {
      let sum = 0;
      for (let channel = 0; channel < channelData.length; channel++) {
        sum += channelData[channel][i];
      }
      monoSignal[i] = sum / channelData.length;
    }
  } else {
    monoSignal = audioData.getChannelData(0);
  }
  
  return {
    signal: monoSignal,
    sampleRate: audioData.sampleRate
  };
}

/**
 * Comprehensive Essentia analysis function
 * Extracts all relevant audio features for Gemini AI analysis
 */
export async function analyzeAudioWithEssentia(essentia, audioSignal, sampleRate = 44100) {
  // Convert to Essentia vector
  const vectorSignal = essentia.arrayToVector(audioSignal);
  
  const result = {
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
    
    // Tuning frequency (skip for now - returns VectorFloat, needs special handling)
    // try {
    //   const tuningExtractor = essentia.TuningFrequencyExtractor(vectorSignal);
    //   const tuningArray = essentia.vectorToArray(tuningExtractor.tuningFrequency);
    //   if (tuningArray.length > 0) {
    //     result.tuningFrequency = tuningArray.reduce((a, b) => a + b, 0) / tuningArray.length;
    //   }
    // } catch (e) {
    //   // Optional feature
    // }
    
    // ========== ENERGY & DYNAMICS ==========
    const energyResult = essentia.Energy(vectorSignal);
    result.energy = energyResult.energy;
    
    const loudnessResult = essentia.Loudness(vectorSignal);
    result.loudness = loudnessResult.loudness;
    
    const rmsResult = essentia.RMS(vectorSignal);
    result.rms = rmsResult.rms;
    
    try {
      const dynamicComplexityResult = essentia.DynamicComplexity(vectorSignal);
      result.dynamicComplexity = dynamicComplexityResult.dynamicComplexity || dynamicComplexityResult;
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
    
    // ========== CHORD DETECTION ==========
    try {
      // Frame-by-frame chord detection
      const frameSize = 4096;
      const hopSize = 2048;
      const frames = essentia.FrameGenerator(vectorSignal, frameSize, hopSize);
      const chords = [];
      const timeStep = hopSize / sampleRate;
      
      for (let i = 0; i < frames.size(); i++) {
        const frame = frames.get(i);
        
        try {
          const windowed = essentia.Windowing(frame, {
            type: 'blackmanharris62',
            size: frameSize,
            zeroPadding: 0,
            normalized: true
          });
          
          const frameSpectrum = essentia.Spectrum(windowed.frame, {
            size: frameSize
          });
          
          const framePeaks = essentia.SpectralPeaks(frameSpectrum.spectrum, {
            sampleRate: sampleRate,
            maxPeaks: 100,
            threshold: 0.00001,
            minFrequency: 40,
            maxFrequency: 5000,
            orderBy: 'magnitude'
          });
          
          const whitened = essentia.SpectralWhitening(
            frameSpectrum.spectrum,
            framePeaks.frequencies,
            framePeaks.magnitudes,
            {
              sampleRate: sampleRate,
              maxFrequency: 5000
            }
          );
          
          const frameHpcp = essentia.HPCP(
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
          
          const chordDetection = essentia.ChordsDetection(frameHpcp.hpcp, {
            hopSize: hopSize,
            sampleRate: sampleRate,
            windowSize: 2.0
          });
          
          if (chordDetection.chords && chordDetection.chords !== 'N') {
            chords.push({
              chord: chordDetection.chords,
              confidence: chordDetection.strength || 0,
              timestamp: i * timeStep
            });
          }
          
          // Clean up frame resources
          frame.delete();
          windowed.frame.delete();
          frameSpectrum.spectrum.delete();
          framePeaks.frequencies.delete();
          framePeaks.magnitudes.delete();
          whitened.magnitudes.delete();
          whitened.frequencies.delete();
          frameHpcp.hpcp.delete();
        } catch (frameError) {
          console.warn(`Frame ${i} chord detection failed:`, frameError);
          frame.delete();
        }
      }
      
      frames.delete();
      
      // Smooth chord progression
      result.chords = smoothChordProgression(chords);
      console.log(`Detected ${result.chords.length} unique chord changes`);
      
    } catch (chordError) {
      console.warn('Chord detection failed:', chordError);
      result.chords = [];
    }
    
    // ========== HIGH-LEVEL FEATURES ==========
    const danceabilityResult = essentia.Danceability(vectorSignal);
    result.danceability = danceabilityResult.danceability;
    
    return result;
    
  } catch (error) {
    throw error;
  }
}

/**
 * Load and initialize Essentia
 */
export async function loadEssentia() {
  const EssentiaModule = await import('essentia.js');
  const { Essentia, EssentiaWASM } = EssentiaModule;
  const essentia = new Essentia(EssentiaWASM);
  await new Promise(resolve => setTimeout(resolve, 100));
  return essentia;
}

/**
 * Format Essentia analysis results for display
 */
export function formatEssentiaResults(analysis) {
  const lines = [
    '🎵 RHYTHM',
    `  BPM: ${analysis.bpm?.toFixed(1) || 'N/A'}`,
    `  Beats: ${analysis.beats || 'N/A'}`,
    analysis.onsetRate ? `  Onset Rate: ${analysis.onsetRate.toFixed(2)} onsets/sec` : null,
    '',
    '🎹 TONAL',
    `  Key: ${analysis.key || 'N/A'} ${analysis.scale || ''}`.trim(),
    `  Key Strength: ${analysis.keyStrength?.toFixed(3) || 'N/A'}`,
    analysis.tuningFrequency ? `  Tuning: ${analysis.tuningFrequency.toFixed(2)} Hz` : null,
    '',
    '📊 ENERGY',
    `  Energy: ${analysis.energy.toFixed(4)}`,
    `  Loudness: ${analysis.loudness.toFixed(2)}`,
    `  RMS: ${analysis.rms.toFixed(4)}`,
    analysis.dynamicComplexity ? `  Dynamic Complexity: ${analysis.dynamicComplexity.toFixed(4)}` : '',
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
    analysis.chords && analysis.chords.length > 0 ? `  Chord Progression: ${analysis.chords.map(c => c.chord).join(' → ')}` : '',
    analysis.chords && analysis.chords.length > 0 ? `  Chord Changes: ${analysis.chords.length}` : '',
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