import { AudioAnalyzer } from '../tools/AudioAnalyzer';

// Initialize analyzer
const audioAnalyzer = new AudioAnalyzer();

// Set up IPC listener for audio analysis requests
export function setupAudioAnalysisListener() {
  // Check if electron API is available
  if (!window.electron?.ipcRenderer) {
    console.warn('Electron IPC not available, audio analysis listener not set up');
    return;
  }
  
  window.electron.ipcRenderer.on('audio:analyze', async (event, { audioData, fileName, responseChannel }) => {
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
      
      // Send response back
      window.electron?.ipcRenderer.send(responseChannel, {
        analysis,
        error: null
      });
    } catch (error) {
      console.error('Audio analysis failed:', error);
      window.electron?.ipcRenderer.send(responseChannel, {
        analysis: null,
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
    }
  });
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