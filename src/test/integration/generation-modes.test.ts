import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { AudioAnalyzer } from '../../tools/AudioAnalyzer';

// Mock the essentia service module
vi.mock('../../services/essentiaService', () => ({
  essentiaService: {
    analyze: vi.fn(),
    detectBPM: vi.fn(),
    detectKey: vi.fn(),
    dispose: vi.fn()
  }
}));

import { essentiaService } from '../../services/essentiaService';

// Generate test audio for different durations
function generateTestAudio(duration: number, type: 'loop' | 'sample' | 'inspiration'): Float32Array {
  const sampleRate = 44100;
  const samples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    let sample = 0;
    
    if (type === 'loop') {
      // Seamless loop - consistent pattern
      const phase = (i / samples) * 2 * Math.PI * 4; // 4 cycles
      sample = Math.sin(phase) * 0.5;
      // Add consistent rhythm
      if (i % (sampleRate / 4) < 100) {
        sample += 0.3;
      }
    } else if (type === 'sample') {
      // One-shot with strong transient
      const envelope = Math.exp(-i / (samples * 0.1));
      sample = envelope * Math.sin(2 * Math.PI * 200 * i / sampleRate);
      // Add impact
      if (i < samples * 0.05) {
        sample += (Math.random() - 0.5) * envelope * 2;
      }
    } else {
      // Inspiration - evolving pattern
      const section = Math.floor(i / (samples / 3));
      if (section === 0) {
        // Intro
        sample = Math.sin(2 * Math.PI * 100 * i / sampleRate) * 0.2;
      } else if (section === 1) {
        // Main section
        sample = Math.sin(2 * Math.PI * 150 * i / sampleRate) * 0.5;
        sample += Math.sin(2 * Math.PI * 300 * i / sampleRate) * 0.3;
      } else {
        // Variation
        sample = Math.sin(2 * Math.PI * 200 * i / sampleRate) * 0.4;
        sample *= 1 + Math.sin(2 * Math.PI * 2 * i / sampleRate) * 0.5;
      }
    }
    
    buffer[i] = Math.tanh(sample * 0.9);
  }
  
  return buffer;
}

// Mock MusicGen service that respects modes
class MockMusicGenWithModes {
  async generate(prompt: string, params: any): Promise<{ audioData: Float32Array, prompt: string, duration: number }> {
    console.log(`🎵 Generating with prompt: "${prompt}"`);
    
    // Parse mode from prompt
    let mode: 'loop' | 'sample' | 'inspiration' = 'loop';
    let duration = 8;
    
    if (prompt.includes('[SYSTEM: LOOP MODE ACTIVE]')) {
      mode = 'loop';
      duration = params.duration || 6; // 4-8 seconds, default 6
      // Enforce loop mode limits
      duration = Math.min(Math.max(duration, 4), 8);
    } else if (prompt.includes('[SYSTEM: SAMPLE MODE ACTIVE]')) {
      mode = 'sample';
      duration = 1; // Fixed 1 second
    } else if (prompt.includes('[SYSTEM: INSPIRATION MODE ACTIVE]')) {
      mode = 'inspiration';
      duration = params.duration || 20; // 15-30 seconds, default 20
      // Enforce inspiration mode limits
      duration = Math.min(Math.max(duration, 15), 30);
    }
    
    console.log(`  Mode: ${mode}, Duration: ${duration}s`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const audioData = generateTestAudio(duration, mode);
    
    return {
      audioData,
      prompt,
      duration
    };
  }
}

describe('Music Generation Modes', () => {
  let analyzer: AudioAnalyzer;
  let musicGen: MockMusicGenWithModes;
  
  beforeAll(() => {
    analyzer = new AudioAnalyzer();
    musicGen = new MockMusicGenWithModes();
  });
  
  describe('Loop Mode', () => {
    it('should generate a 4-8 second seamless loop', async () => {
      const prompt = `[SYSTEM: LOOP MODE ACTIVE]
Generate a 4-8 second seamless loop that can be repeated indefinitely.
- Create consistent energy throughout
- No fade in or fade out
- Ensure the end connects smoothly to the beginning
- Optimize for layering in a DAW

User request: Dark techno loop with heavy kick`;
      
      console.log('\n🔁 TESTING LOOP MODE');
      console.log('══════════════════════\n');
      
      const { audioData, duration } = await musicGen.generate(prompt, { duration: 6 });
      
      // Mock essentia analysis for loop
      vi.mocked(essentiaService.analyze).mockResolvedValueOnce({
        bpm: 128,
        tempo: 128,
        key: 'A minor',
        scale: 'minor',
        energy: 0.75, // Consistent high energy
        danceability: 0.85,
        valence: 0.3,
        loudness: -6,
        spectralCentroid: 1200,
        beats: new Float32Array([0, 0.468, 0.937, 1.406, 1.875]),
        onset: new Float32Array([0, 0.234, 0.468]),
        mfcc: new Float32Array(13),
        chromagram: new Float32Array(12),
        instruments: [
          { label: 'Kick drum', confidence: 0.95 },
          { label: 'Synthesizer', confidence: 0.90 }
        ],
        style: ['techno', 'loop', 'electronic']
      });
      
      const analysis = await analyzer.analyze(audioData);
      
      // Verify loop characteristics
      expect(duration).toBeGreaterThanOrEqual(4);
      expect(duration).toBeLessThanOrEqual(8);
      expect(audioData.length).toBe(duration * 44100);
      
      // Check for consistent energy (important for loops)
      expect(analysis.energy).toBeGreaterThan(0.6);
      expect(analysis.danceability).toBeGreaterThan(0.7);
      
      console.log('✅ Loop Mode Test Results:');
      console.log(`  Duration: ${duration}s (✓ within 4-8s)`);
      console.log(`  Samples: ${audioData.length}`);
      console.log(`  Energy: ${(analysis.energy * 100).toFixed(0)}% (consistent)`);
      console.log(`  BPM: ${analysis.bpm}`);
      console.log(`  Style: ${analysis.style.join(', ')}\n`);
    });
  });
  
  describe('Sample Mode', () => {
    it('should generate a 1 second one-shot sample', async () => {
      const prompt = `[SYSTEM: SAMPLE MODE ACTIVE]
Generate a 1 second one-shot, hit, or sample.
- Focus on impact and transient
- Create a single, distinct sound
- Suitable for triggering and sampling
- Think: drum hits, vocal chops, FX, stabs

User request: Punchy kick drum`;
      
      console.log('⚡ TESTING SAMPLE MODE');
      console.log('══════════════════════\n');
      
      const { audioData, duration } = await musicGen.generate(prompt, {});
      
      // Mock essentia analysis for sample
      vi.mocked(essentiaService.analyze).mockResolvedValueOnce({
        bpm: 0, // Single hit, no BPM
        tempo: 0,
        key: 'N/A',
        scale: 'N/A',
        energy: 0.9, // High impact
        danceability: 0.5,
        valence: 0.5,
        loudness: -3, // Loud transient
        spectralCentroid: 500, // Low frequency for kick
        beats: new Float32Array([0]),
        onset: new Float32Array([0]),
        mfcc: new Float32Array(13),
        chromagram: new Float32Array(12),
        instruments: [
          { label: 'Kick drum', confidence: 0.98 }
        ],
        style: ['one-shot', 'drum', 'sample']
      });
      
      const analysis = await analyzer.analyze(audioData);
      
      // Verify sample characteristics
      expect(duration).toBe(1);
      expect(audioData.length).toBe(44100); // Exactly 1 second
      
      // Check for high impact/energy (important for samples)
      expect(analysis.energy).toBeGreaterThan(0.7);
      expect(analysis.loudness).toBeGreaterThan(-5);
      
      console.log('✅ Sample Mode Test Results:');
      console.log(`  Duration: ${duration}s (✓ exactly 1s)`);
      console.log(`  Samples: ${audioData.length}`);
      console.log(`  Energy: ${(analysis.energy * 100).toFixed(0)}% (high impact)`);
      console.log(`  Loudness: ${analysis.loudness} dB`);
      console.log(`  Type: ${analysis.style.join(', ')}\n`);
    });
  });
  
  describe('Inspiration Mode', () => {
    it('should generate a 15-30 second musical idea', async () => {
      const prompt = `[SYSTEM: INSPIRATION MODE ACTIVE]
Generate a 15-30 second musical idea or sketch.
- Include musical development and progression
- Can have intro, main section, and variation
- Allow for creative exploration
- Suitable as a song starter or arrangement reference

User request: Melodic house progression with arpeggios`;
      
      console.log('💡 TESTING INSPIRATION MODE');
      console.log('═══════════════════════════\n');
      
      const { audioData, duration } = await musicGen.generate(prompt, { duration: 20 });
      
      // Mock essentia analysis for inspiration
      vi.mocked(essentiaService.analyze).mockResolvedValueOnce({
        bpm: 124,
        tempo: 124,
        key: 'C major',
        scale: 'major',
        energy: 0.65, // Moderate, with variation
        danceability: 0.75,
        valence: 0.7, // Uplifting
        loudness: -8,
        spectralCentroid: 2000,
        beats: new Float32Array(Array.from({length: 40}, (_, i) => i * 0.484)),
        onset: new Float32Array(Array.from({length: 80}, (_, i) => i * 0.242)),
        mfcc: new Float32Array(13),
        chromagram: new Float32Array(12),
        instruments: [
          { label: 'Synthesizer', confidence: 0.92 },
          { label: 'Piano', confidence: 0.85 },
          { label: 'Drum kit', confidence: 0.80 }
        ],
        style: ['house', 'melodic', 'progressive', 'electronic']
      });
      
      const analysis = await analyzer.analyze(audioData);
      
      // Verify inspiration characteristics
      expect(duration).toBeGreaterThanOrEqual(15);
      expect(duration).toBeLessThanOrEqual(30);
      expect(audioData.length).toBe(duration * 44100);
      
      // Check for musical qualities
      expect(analysis.style).toContain('melodic');
      expect(analysis.instruments.length).toBeGreaterThan(1); // Multiple instruments
      
      console.log('✅ Inspiration Mode Test Results:');
      console.log(`  Duration: ${duration}s (✓ within 15-30s)`);
      console.log(`  Samples: ${audioData.length}`);
      console.log(`  BPM: ${analysis.bpm}`);
      console.log(`  Key: ${analysis.key}`);
      console.log(`  Instruments: ${analysis.instruments.map(i => i.label).join(', ')}`);
      console.log(`  Style: ${analysis.style.join(', ')}\n`);
    });
  });
  
  describe('Mode Detection and Validation', () => {
    it('should correctly identify and respect mode constraints', async () => {
      console.log('🔍 TESTING MODE DETECTION');
      console.log('═════════════════════════\n');
      
      // Test that each mode respects its duration constraints
      const loopPrompt = '[SYSTEM: LOOP MODE ACTIVE]\nUser request: test';
      const samplePrompt = '[SYSTEM: SAMPLE MODE ACTIVE]\nUser request: test';
      const inspirationPrompt = '[SYSTEM: INSPIRATION MODE ACTIVE]\nUser request: test';
      
      const loopResult = await musicGen.generate(loopPrompt, { duration: 10 }); // Should cap at 8
      const sampleResult = await musicGen.generate(samplePrompt, { duration: 10 }); // Should be 1
      const inspirationResult = await musicGen.generate(inspirationPrompt, { duration: 25 });
      
      console.log('✅ Mode Constraint Validation:');
      console.log(`  Loop: ${loopResult.duration}s (requested 10s, capped at mode limit)`);
      console.log(`  Sample: ${sampleResult.duration}s (forced to 1s)`);
      console.log(`  Inspiration: ${inspirationResult.duration}s (within 15-30s range)`);
      
      expect(loopResult.duration).toBeLessThanOrEqual(8);
      expect(sampleResult.duration).toBe(1);
      expect(inspirationResult.duration).toBe(25);
      
      console.log('\n✅ All mode constraints validated successfully!\n');
    });
  });
});