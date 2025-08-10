import { AudioAnalyzer } from '../tools/AudioAnalyzer';
import { listen } from '@tauri-apps/api/event';
import { emit } from '@tauri-apps/api/event';

// Initialize analyzer
const audioAnalyzer = new AudioAnalyzer();

// Set up Tauri event listener for audio analysis requests
export async function setupAudioAnalysisListener() {
  try {
    await listen('audio:analyze', async (event) => {
      const { audioData, fileName, responseChannel } = event.payload as { 
        audioData: string; 
        fileName: string; 
        responseChannel: string 
      };
      
      try {
        console.log('Received audio analysis request:', fileName);
        
        // Convert base64 back to ArrayBuffer
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;
        
        // Analyze the audio
        const analysis = await audioAnalyzer.analyze(arrayBuffer);
        
        // Send response back via Tauri event
        await emit(responseChannel, {
          analysis,
          error: null
        });
      } catch (error) {
        console.error('Audio analysis failed:', error);
        await emit(responseChannel, {
          analysis: null,
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      }
    });
  } catch (error) {
    console.warn('Failed to set up audio analysis listener:', error);
  }
}

// Also provide a direct method for renderer components to use
export async function analyzeAudioFile(file: File): Promise<any> {
  try {
    const analysis = await audioAnalyzer.analyze(file);
    return analysis;
  } catch (error) {
    console.error('Direct audio analysis failed:', error);
    throw error;
  }
}