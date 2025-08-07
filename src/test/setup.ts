// Vitest setup file
import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock Web Audio API for tests
beforeAll(() => {
  // Mock AudioContext
  global.AudioContext = class MockAudioContext {
    sampleRate = 44100;
    
    async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<any> {
      // Create a mock audio buffer
      const length = Math.floor(arrayBuffer.byteLength / 4); // Assuming 32-bit float samples
      const channelData = new Float32Array(length);
      
      // Fill with mock audio data (sine wave for testing)
      for (let i = 0; i < length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / 44100); // 440Hz sine wave
      }
      
      return {
        length,
        duration: length / 44100,
        sampleRate: 44100,
        numberOfChannels: 1,
        getChannelData: (channel: number) => channelData
      };
    }
    
    async close(): Promise<void> {
      // Mock close
    }
  } as any;

  // Add webkitAudioContext as fallback
  (global as any).webkitAudioContext = global.AudioContext;
});

// Clean up after each test
afterEach(() => {
  // Clear any test artifacts
});

// Global cleanup
afterAll(() => {
  // Final cleanup
});