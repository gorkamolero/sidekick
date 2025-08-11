import { createTool } from '@mastra/core';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import { buildAudioAnalysisPrompt } from '../../shared/audio-analysis-prompts';
import { audioUploadService } from '../services/audioUploadService';
import { essentiaService } from '../services/essentiaService';

dotenv.config();

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export const analyzeAudio = createTool({
  id: 'analyze-audio',
  description: 'Analyze an audio file to extract BPM, key, instruments, style, and other musical features',
  inputSchema: z.object({
    audioData: z.string().describe('Base64 encoded audio data or file path'),
    fileName: z.string().optional().describe('Original filename for reference'),
  }),
  execute: async ({ context, onProgress }) => {
    const { audioData, fileName } = context;
    console.log('🎧 Analyzing audio file:', fileName || 'Unknown');
    
    try {
      // Convert input to Buffer for Essentia processing
      let audioBuffer: Buffer;
      
      if (audioData.startsWith('data:')) {
        // Extract base64 from data URL
        const base64 = audioData.split(',')[1];
        audioBuffer = Buffer.from(base64, 'base64');
      } else if (audioData.startsWith('/')) {
        // It's a file path, read the file
        audioBuffer = fs.readFileSync(audioData);
      } else {
        // Assume it's raw base64
        audioBuffer = Buffer.from(audioData, 'base64');
      }
      
      // Run Essentia analysis directly in main process
      console.log('🎧 Running Essentia analysis...');
      
      // Stream progress update
      if (onProgress) {
        onProgress({
          message: '🎵 Starting technical analysis...'
        });
      }
      
      const analysis = await essentiaService.analyzeAudio(audioBuffer);
      
      console.log('🎧 Technical analysis complete:', {
        bpm: analysis.bpm,
        key: analysis.key,
        scale: analysis.scale,
        energy: analysis.energy
      });
      
      // Stream technical analysis results
      if (onProgress) {
        onProgress({
          message: `✅ Technical Analysis Complete:\n• BPM: ${analysis.bpm?.toFixed(1)}\n• Key: ${analysis.key} ${analysis.scale}\n• Energy: ${analysis.energy > 100000 ? 'High' : analysis.energy > 50000 ? 'Medium' : 'Low'}`
        });
      }


      // Get creative analysis from Gemini with actual audio
      console.log('🎨 Getting creative analysis from Gemini...');
      
      let audioUrl: string | null = null;
      let uploadedFile = false;
      
      // Try to upload audio for Gemini to actually listen to it
      try {
        // Check if we have a file path to upload
        if (audioData.startsWith('/') && fs.existsSync(audioData)) {
          console.log('📤 Uploading audio for Gemini analysis...');
          
          if (onProgress) {
            onProgress({
              message: '📤 Uploading audio file...'
            });
          }
          
          const uploadResult = await audioUploadService.uploadTemporary(audioData, '1h');
          audioUrl = uploadResult.url;
          uploadedFile = true;
          console.log('✅ Audio uploaded for analysis');
          
          if (onProgress) {
            onProgress({
              message: '✅ Upload complete!'
            });
          }
        }
      } catch (uploadError) {
        console.warn('⚠️ Could not upload audio, using technical analysis only:', uploadError);
      }
      
      // Build the prompt with audio URL if available
      const technicalPrompt = buildAudioAnalysisPrompt(analysis as any);
      
      // Create the message content based on whether we have audio URL
      const messageContent = audioUrl ? 
        `Audio: ${audioUrl}\n\n${technicalPrompt}` : 
        technicalPrompt;

      try {
        if (onProgress) {
          onProgress({
            message: '🎨 Starting creative analysis with AI...'
          });
        }
        
        const creativeAnalysis = await generateText({
          model: openrouter('google/gemini-2.5-pro'),
          messages: [
            {
              role: 'user',
              content: messageContent
            }
          ],
          temperature: 0.7,
          maxTokens: 1500,
        });

        console.log('🎨 Creative analysis complete');
        
        if (onProgress) {
          onProgress({
            message: '✨ Creative analysis complete!'
          });
        }

        const finalResult = {
          status: 'success',
          fileName,
          technical: analysis,
          creative: creativeAnalysis.text,
          message: `**Complete Analysis: ${fileName}**

**Technical Analysis:**
• **Tempo**: ${analysis.bpm?.toFixed(1)} BPM (${analysis.tempo})
• **Key**: ${analysis.key} ${analysis.scale}  
• **Duration**: ${analysis.duration?.toFixed(1)} seconds
• **Energy**: ${analysis.energy?.toFixed(0)} (${analysis.energy > 100000 ? 'High' : analysis.energy > 50000 ? 'Medium' : 'Low'})
• **Danceability**: ${(analysis.danceability * 100)?.toFixed(0)}%
• **Loudness**: ${analysis.loudness?.toFixed(1)} dB
• **Spectral Centroid**: ${analysis.spectralCentroid?.toFixed(0)} Hz (brightness)
• **Spectral Rolloff**: ${analysis.spectralRolloff?.toFixed(0)} Hz  
• **Zero Crossing Rate**: ${(analysis.zeroCrossingRate * 1000)?.toFixed(1)} (texture)
• **Onset Rate**: ${analysis.onsetRate?.toFixed(2)} events/sec${analysis.chords && analysis.chords.length > 0 ? `
• **Chord Progression**: ${analysis.chords.map(c => c.chord).join(' → ')}
• **Chord Changes**: ${analysis.chords.length} changes detected` : ''}

**Creative Analysis:**
${creativeAnalysis.text}`,
        };

        // Final result will be returned, no need for additional callback

        return finalResult;
      } catch (geminiError) {
        console.error('Gemini analysis error:', geminiError);
        // Fall back to just technical analysis if Gemini fails
        const fallbackResult = {
          status: 'success',
          fileName,
          technical: analysis,
          message: `**Technical Analysis: ${fileName}**

**Audio Characteristics:**
• **Tempo**: ${analysis.bpm?.toFixed(1)} BPM (${analysis.tempo})
• **Key**: ${analysis.key} ${analysis.scale}
• **Duration**: ${analysis.duration?.toFixed(1)} seconds  
• **Energy**: ${analysis.energy?.toFixed(0)} (${analysis.energy > 100000 ? 'High' : analysis.energy > 50000 ? 'Medium' : 'Low'})
• **Danceability**: ${(analysis.danceability * 100)?.toFixed(0)}%
• **Loudness**: ${analysis.loudness?.toFixed(1)} dB
• **Spectral Centroid**: ${analysis.spectralCentroid?.toFixed(0)} Hz (brightness)
• **Spectral Rolloff**: ${analysis.spectralRolloff?.toFixed(0)} Hz
• **Zero Crossing Rate**: ${(analysis.zeroCrossingRate * 1000)?.toFixed(1)} (texture)
• **Onset Rate**: ${analysis.onsetRate?.toFixed(2)} events/sec${analysis.chords && analysis.chords.length > 0 ? `
• **Chord Progression**: ${analysis.chords.map(c => c.chord).join(' → ')}
• **Chord Changes**: ${analysis.chords.length} changes detected` : ''}

Creative analysis unavailable - using technical data only.`,
        };

        // Fallback result will be returned

        return fallbackResult;
      }
    } catch (error) {
      console.error('Audio analysis error:', error);
      const errorResult = {
        status: 'error',
        fileName,
        message: `Failed to analyze audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };

      // Error result will be returned

      return errorResult;
    }
  },
});