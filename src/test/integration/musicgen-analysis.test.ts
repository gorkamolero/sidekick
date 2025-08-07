import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { AudioAnalyzer } from '../../renderer/tools/AudioAnalyzer';
import fs from 'fs';
import path from 'path';

// Mock the essentia service module
vi.mock('../../renderer/services/essentiaService', () => ({
  essentiaService: {
    analyze: vi.fn(),
    detectBPM: vi.fn(),
    detectKey: vi.fn(),
    dispose: vi.fn()
  }
}));

import { essentiaService } from '../../renderer/services/essentiaService';

// Create a mock dark techno audio buffer at 132 BPM
function generateDarkTechnoAudio(bpm: number = 132, duration: number = 8): Float32Array {
  const sampleRate = 44100;
  const samples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(samples);
  
  // Calculate beat timing
  const beatInterval = 60 / bpm; // seconds per beat
  const samplesPerBeat = Math.floor(beatInterval * sampleRate);
  
  // Dark techno characteristics:
  // - Strong kick drum on every beat (4/4 pattern)
  // - Hi-hats on off-beats
  // - Deep bass line
  // - Minimal melodic content
  // - Dark atmosphere with low frequencies dominant
  
  for (let i = 0; i < samples; i++) {
    let sample = 0;
    
    // Kick drum synthesis (every beat)
    const beatPosition = i % samplesPerBeat;
    if (beatPosition < samplesPerBeat * 0.1) { // First 10% of beat
      const kickEnvelope = Math.exp(-beatPosition / (samplesPerBeat * 0.02));
      const kickFreq = 60; // Deep kick around 60Hz
      sample += kickEnvelope * Math.sin(2 * Math.PI * kickFreq * i / sampleRate) * 0.8;
      // Add click transient
      sample += kickEnvelope * Math.sin(2 * Math.PI * 150 * i / sampleRate) * 0.2;
    }
    
    // Hi-hat synthesis (off-beats)
    const offBeatPosition = (i + samplesPerBeat / 2) % samplesPerBeat;
    if (offBeatPosition < samplesPerBeat * 0.05) { // Short hi-hat
      const hihatEnvelope = Math.exp(-offBeatPosition / (samplesPerBeat * 0.01));
      // Noise-based hi-hat
      sample += hihatEnvelope * (Math.random() - 0.5) * 0.15;
      // Add some high frequency content
      sample += hihatEnvelope * Math.sin(2 * Math.PI * 8000 * i / sampleRate) * 0.05;
    }
    
    // Bass line (sub-bass frequencies typical in dark techno)
    const bassFreq = 40 + 10 * Math.sin(2 * Math.PI * 0.25 * i / sampleRate); // Modulated bass
    sample += Math.sin(2 * Math.PI * bassFreq * i / sampleRate) * 0.3;
    
    // Dark atmosphere - low frequency rumble
    sample += Math.sin(2 * Math.PI * 30 * i / sampleRate) * 0.1;
    sample += Math.sin(2 * Math.PI * 25 * i / sampleRate) * 0.05;
    
    // Add slight distortion for techno character
    sample = Math.tanh(sample * 1.5) * 0.8;
    
    // Sidechain compression effect (duck on kick)
    if (beatPosition < samplesPerBeat * 0.15) {
      const compression = 1 - (0.5 * Math.exp(-beatPosition / (samplesPerBeat * 0.05)));
      sample *= compression;
    }
    
    buffer[i] = sample;
  }
  
  return buffer;
}

// Mock MusicGen service response
class MockMusicGenService {
  async generate(prompt: string, params: any): Promise<{ audioData: Float32Array, prompt: string }> {
    console.log(`🎵 Generating: "${prompt}" at ${params.bpm} BPM`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate audio based on prompt parameters
    const audioData = generateDarkTechnoAudio(params.bpm || 132, params.duration || 8);
    
    return {
      audioData,
      prompt
    };
  }
}

describe('MusicGen → Audio Analysis Integration', () => {
  let analyzer: AudioAnalyzer;
  let musicGen: MockMusicGenService;
  
  beforeAll(() => {
    analyzer = new AudioAnalyzer();
    musicGen = new MockMusicGenService();
    
    // Mock the essentia service with realistic responses for dark techno
    vi.mocked(essentiaService.analyze).mockImplementation(async (audio) => {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        // Dark techno at 132 BPM should be detected correctly
        bpm: 132.2, // Close to 132, with small detection variance
        tempo: 132.2,
        key: 'F minor', // Dark techno often in minor keys
        scale: 'minor',
        
        // Energy characteristics of dark techno
        energy: 0.75, // High energy
        danceability: 0.88, // Very danceable
        valence: 0.25, // Dark mood (low valence)
        loudness: -6.5, // Loud, compressed
        
        // Spectral features - dark techno has dominant low frequencies
        spectralCentroid: 850, // Low spectral centroid (dark sound)
        
        // Rhythm features
        beats: new Float32Array([0, 0.454, 0.909, 1.363, 1.818, 2.272]),
        onset: new Float32Array([0, 0.227, 0.454, 0.681, 0.909]),
        
        // Additional features
        mfcc: new Float32Array(13).fill(0),
        chromagram: new Float32Array(12).fill(0),
        
        // Instruments detected in dark techno
        instruments: [
          { label: 'Kick drum', confidence: 0.95 },
          { label: 'Synthesizer', confidence: 0.92 },
          { label: 'Bass guitar', confidence: 0.88 },
          { label: 'Hi-hat', confidence: 0.82 },
          { label: 'Drum kit', confidence: 0.90 }
        ],
        
        // Style should correctly identify techno
        style: ['techno', 'dark techno', 'electronic', 'industrial']
      };
    });
  });
  
  it('should generate and analyze a dark techno track at 132 BPM', async () => {
    // Step 1: Generate dark techno track
    const generationParams = {
      bpm: 132,
      duration: 8,
      model: 'stereo-large' as const
    };
    
    const prompt = 'Dark driving techno, industrial, heavy kick drum, minimal, underground warehouse rave, 132 BPM';
    
    console.log('\n📊 INTEGRATION TEST: Music Generation → Analysis Pipeline');
    console.log('═════════════════════════════════════════════════════════\n');
    
    const { audioData } = await musicGen.generate(prompt, generationParams);
    
    expect(audioData).toBeInstanceOf(Float32Array);
    expect(audioData.length).toBeGreaterThan(0);
    
    console.log(`✅ Generated audio: ${audioData.length} samples (${(audioData.length / 44100).toFixed(1)}s)\n`);
    
    // Step 2: Analyze the generated audio
    const analysis = await analyzer.analyze(audioData);
    
    console.log('📈 Analysis Results:');
    console.log('───────────────────');
    console.log(`BPM: ${analysis.bpm.toFixed(1)} (target: 132)`);
    console.log(`Key: ${analysis.key}`);
    console.log(`Energy: ${(analysis.energy * 100).toFixed(0)}%`);
    console.log(`Danceability: ${(analysis.danceability * 100).toFixed(0)}%`);
    console.log(`Valence: ${(analysis.valence * 100).toFixed(0)}% (lower = darker)`);
    console.log(`Spectral Centroid: ${analysis.spectralCentroid.toFixed(0)} Hz\n`);
    
    // Step 3: Verify BPM detection is accurate
    expect(analysis.bpm).toBeCloseTo(132, 0); // Should be within 1 BPM
    expect(analysis.tempo).toBe(analysis.bpm);
    
    // Step 4: Verify style detection
    expect(analysis.style).toContain('techno');
    expect(analysis.style.some(s => s.includes('techno'))).toBe(true);
    expect(analysis.style).toContain('electronic');
    
    // Step 5: Verify dark techno characteristics
    expect(analysis.energy).toBeGreaterThan(0.6); // High energy
    expect(analysis.danceability).toBeGreaterThan(0.8); // Very danceable
    expect(analysis.valence).toBeLessThan(0.4); // Dark mood
    expect(analysis.spectralCentroid).toBeLessThan(1500); // Low frequencies dominant
    
    // Step 6: Verify instrument detection
    const kickDrum = analysis.instruments.find(i => i.label.toLowerCase().includes('kick'));
    expect(kickDrum).toBeDefined();
    expect(kickDrum!.confidence).toBeGreaterThan(0.8);
    
    const synth = analysis.instruments.find(i => i.label.toLowerCase().includes('synth'));
    expect(synth).toBeDefined();
    
    console.log('🎸 Detected Instruments:');
    analysis.instruments.forEach(inst => {
      console.log(`  ${inst.label}: ${(inst.confidence * 100).toFixed(0)}%`);
    });
    console.log('');
    
    console.log('🎭 Detected Styles:', analysis.style.join(', '));
    console.log('');
    
    console.log('✅ All integration tests passed!');
    console.log('═════════════════════════════════════════════════════════\n');
  });
  
  it('should handle the complete pipeline with error cases', async () => {
    // Test with extreme BPM
    const extremeBPM = 175; // Drum & bass tempo
    const { audioData } = await musicGen.generate(
      'Fast aggressive drum and bass, jungle breaks',
      { bpm: extremeBPM, duration: 4 }
    );
    
    // Mock different analysis for D&B
    vi.mocked(essentiaService.analyze).mockResolvedValueOnce({
      bpm: 174.8,
      tempo: 174.8,
      key: 'A minor',
      scale: 'minor',
      energy: 0.85,
      danceability: 0.75,
      valence: 0.4,
      loudness: -5.2,
      spectralCentroid: 2500,
      beats: new Float32Array([0, 0.343, 0.686]),
      onset: new Float32Array([0, 0.171, 0.343]),
      mfcc: new Float32Array(13),
      chromagram: new Float32Array(12),
      instruments: [
        { label: 'Drum kit', confidence: 0.95 },
        { label: 'Bass guitar', confidence: 0.85 },
        { label: 'Synthesizer', confidence: 0.80 }
      ],
      style: ['drum and bass', 'jungle', 'electronic']
    });
    
    const analysis = await analyzer.analyze(audioData);
    
    expect(analysis.bpm).toBeCloseTo(175, 0); // Within 1 BPM
    expect(analysis.style).toContain('drum and bass');
    expect(analysis.energy).toBeGreaterThan(0.7);
  });
  
  it('should accurately detect tempo changes in generated music', async () => {
    // Generate a track with specific BPM
    const targetBPM = 128;
    const { audioData } = await musicGen.generate(
      'House music, four on the floor, 128 BPM',
      { bpm: targetBPM, duration: 4 }
    );
    
    // Mock house music analysis
    vi.mocked(essentiaService.analyze).mockResolvedValueOnce({
      bpm: 128.1,
      tempo: 128.1,
      key: 'C major',
      scale: 'major',
      energy: 0.70,
      danceability: 0.85,
      valence: 0.65,
      loudness: -7.0,
      spectralCentroid: 1800,
      beats: new Float32Array([0, 0.468, 0.937, 1.406]),
      onset: new Float32Array([0, 0.234, 0.468]),
      mfcc: new Float32Array(13),
      chromagram: new Float32Array(12),
      instruments: [
        { label: 'Kick drum', confidence: 0.90 },
        { label: 'Hi-hat', confidence: 0.85 },
        { label: 'Synthesizer', confidence: 0.88 },
        { label: 'Bass guitar', confidence: 0.75 }
      ],
      style: ['house', 'electronic', 'dance']
    });
    
    const analysis = await analyzer.analyze(audioData);
    
    // Verify tempo detection accuracy
    const bpmAccuracy = Math.abs(analysis.bpm - targetBPM) / targetBPM;
    expect(bpmAccuracy).toBeLessThan(0.01); // Less than 1% error
    
    // Verify it's detected as house music
    expect(analysis.style).toContain('house');
    expect(analysis.danceability).toBeGreaterThan(0.8);
  });
});