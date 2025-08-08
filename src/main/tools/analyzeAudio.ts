import { createTool } from '@mastra/core';
import { z } from 'zod';
import * as fs from 'fs';
import { BrowserWindow } from 'electron';

export const analyzeAudio = createTool({
  id: 'analyze-audio',
  description: 'Analyze an audio file to extract BPM, key, instruments, style, and other musical features',
  inputSchema: z.object({
    audioData: z.string().describe('Base64 encoded audio data or file path'),
    fileName: z.string().optional().describe('Original filename for reference'),
  }),
  execute: async ({ context }) => {
    const { audioData, fileName } = context;
    console.log('🎧 Analyzing audio file:', fileName || 'Unknown');
    
    try {
      // Convert base64 to ArrayBuffer if needed
      let audioBuffer: ArrayBuffer | Float32Array;
      
      if (audioData.startsWith('data:')) {
        // Extract base64 from data URL
        const base64 = audioData.split(',')[1];
        const binaryString = Buffer.from(base64, 'base64');
        audioBuffer = binaryString.buffer.slice(
          binaryString.byteOffset,
          binaryString.byteOffset + binaryString.byteLength
        );
      } else if (audioData.startsWith('/')) {
        // It's a file path, read the file
        const fileBuffer = fs.readFileSync(audioData);
        audioBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength
        );
      } else {
        // Assume it's raw base64
        const binaryString = Buffer.from(audioData, 'base64');
        audioBuffer = binaryString.buffer.slice(
          binaryString.byteOffset,
          binaryString.byteOffset + binaryString.byteLength
        );
      }
      
      // Send to renderer process for analysis
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error('No window available for audio analysis');
      }
      
      // Convert ArrayBuffer to base64 for IPC transfer
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      
      // Request analysis from renderer
      const analysis = await new Promise((resolve, reject) => {
        // Set up one-time listener for response
        const responseChannel = `audio:analysis:response:${Date.now()}`;
        
        mainWindow.webContents.once(responseChannel, (_event: any, result: any) => {
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.analysis);
          }
        });
        
        // Send analysis request
        mainWindow.webContents.send('audio:analyze', {
          audioData: base64Audio,
          fileName,
          responseChannel
        });
        
        // Timeout after 30 seconds
        setTimeout(() => reject(new Error('Audio analysis timeout')), 30000);
      });
      
      console.log('🎧 Analysis complete:', analysis);
      
      return {
        status: 'success',
        fileName,
        ...(analysis as any),
        message: `Analyzed ${fileName || 'audio'}: ${(analysis as any).bpm} BPM, ${(analysis as any).key}, ${(analysis as any).instruments?.length || 0} instruments detected`,
      };
    } catch (error) {
      console.error('Audio analysis error:', error);
      return {
        status: 'error',
        fileName,
        message: `Failed to analyze audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});