import { Agent, createTool } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { getMusicGenerationManager } from './music-generation/manager';
import { AudioService } from './services/audio';
import { SIDEKICK_SYSTEM_PROMPT } from './prompts';
import { analyzeAudioStreaming } from './tools/analyzeAudioStreaming';

// Load environment variables from multiple possible locations
dotenv.config({ path: '.env' });
dotenv.config({ path: '../.env' });
dotenv.config({ path: '../../.env' });
dotenv.config({ path: '../../../.env' });

// Create OpenRouter model
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Initialize services
const audioService = new AudioService();

// Define tools using Mastra format
const generateMusic = createTool({
  id: 'generate-music',
  description: 'Generate a music loop based on a text prompt. The system will automatically select the best available service.',
  inputSchema: z.object({
    prompt: z.string().describe('A detailed prompt describing the music you want to generate'),
    duration: z.number().optional().describe('Duration in seconds (defaults based on mode)'),
    mode: z.enum(['loop', 'sample', 'inspiration']).optional().describe('Generation mode: loop (4-8s), sample (1s), inspiration (15-30s)'),
    model: z.string().optional().describe('Optional: specific model to use (e.g., stereo-large, v4.5)'),
    inputAudio: z.string().optional().describe('Optional: URL or path to audio file for extension/continuation'),
    lyrics: z.string().optional().describe('Optional: lyrics for the song (if service supports it)'),
    makeInstrumental: z.boolean().optional().describe('Optional: create instrumental version'),
  }),
  execute: async ({ context }) => {
    const { prompt, duration, mode, model, inputAudio, lyrics, makeInstrumental } = context;
    console.log('🎵 MUSIC GENERATION TOOL EXECUTING!!!');
    console.log('Parameters:', { prompt, duration, mode, model, inputAudio, lyrics, makeInstrumental });
    console.log('Agent provided duration:', duration);
    
    // Debug log to see if inputAudio is being passed
    if (inputAudio) {
      console.warn('⚠️ WARNING: inputAudio was provided:', inputAudio);
      console.warn('This will extend/continue from previous audio!');
    }
    
    try {
      const musicManager = getMusicGenerationManager();
      const activeService = musicManager.getActiveService();
      console.log('🎵 Using service:', activeService);
      
      const result = await musicManager.generate({
        prompt,
        duration,
        mode,
        model,
        extendAudio: inputAudio,
        lyrics,
        makeInstrumental,
      });
      
      console.log('🎵 Generation SUCCESS!');
      console.log('Audio URL:', result.audioUrl);
      console.log('Service used:', result.metadata.service);
      
      // Download and save the audio file
      const localFilePath = await audioService.downloadAndSave(result.audioUrl, prompt);
      
      // In sidecar, we broadcast via SSE instead of BrowserWindow
      // This will be handled by the endpoint
      
      return {
        status: 'success',
        prompt,
        duration: result.duration,
        audioUrl: result.audioUrl,
        localFilePath,
        service: result.metadata.service,
        message: `Generated ${result.duration}s audio using ${result.metadata.service} and saved locally`,
      };
    } catch (error) {
      console.log('🎵 GENERATION FAILED!');
      console.error('Music generation error:', error);
      return {
        status: 'error',
        prompt,
        duration,
        message: `Failed to generate music: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

const getProjectInfo = createTool({
  id: 'get-project-info',
  description: 'Get current Ableton project information',
  inputSchema: z.object({}),
  execute: async () => {
    // TODO: Implement actual Ableton project info retrieval
    // For now, return mock data
    return {
      bpm: 120,
      key: 'C minor',
      timeSignature: '4/4',
    };
  },
});

// Create the Mastra agent with tools
export const agent = new Agent({
  id: 'sidekick-agent',
  name: 'Sidekick',
  description: 'AI assistant for music producers',
  model: openrouter('moonshotai/kimi-k2'),
  instructions: SIDEKICK_SYSTEM_PROMPT,
  tools: {
    generateMusic,
    analyzeAudio: analyzeAudioStreaming,
    getProjectInfo,
  },
});