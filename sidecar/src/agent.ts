import { Agent, createTool } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { Client } from 'node-osc';
import { getMusicGenerationManager } from './music-generation/manager';
import { AudioService } from './services/audio';
import { SIDEKICK_SYSTEM_PROMPT } from './prompts';
import { analyzeAudioStreaming } from './tools/analyzeAudioStreaming';
import { abletonManual } from './tools/abletonManual';
import { abletonDocs } from './tools/abletonDocs';
import { oscExecutor } from './tools/oscExecutor';

// Load environment variables
dotenv.config({ path: '../.env', debug: true });

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
    service: z.enum(['musicgen', 'suno']).optional().describe('Music generation service to use'),
  }),
  execute: async ({ context }) => {
    const { prompt, duration, mode, service } = context;
    console.log('🎵 MUSIC GENERATION TOOL EXECUTING!!!');
    console.log('Parameters:', { prompt, duration, mode, service });
    console.log('Agent provided duration:', duration);
    
    try {
      const musicManager = getMusicGenerationManager();
      
      // Switch to requested service if provided
      if (service && (service === 'musicgen' || service === 'suno')) {
        musicManager.setActiveService(service);
        console.log('🎵 Switched to service:', service);
      }
      
      const activeService = musicManager.getActiveService();
      console.log('🎵 Using service:', activeService);
      
      const result = await musicManager.generate({
        prompt,
        duration,
        mode,
      });
      
      console.log('🎵 Generation SUCCESS!');
      console.log('Audio URL:', result.audioUrl);
      console.log('Service used:', result.metadata.service);
      
      // Download and save the audio file
      const localFilePath = await audioService.downloadAndSave(result.audioUrl, prompt);
      
      const toolResult = {
        status: 'success',
        prompt,
        duration: result.duration,
        audioUrl: result.audioUrl,
        localFilePath,
        service: result.metadata.service,
        message: `Generated ${result.duration}s audio using ${result.metadata.service} and saved locally`,
        // Add task metadata for better UI display
        taskMetadata: {
          title: `Music Generation: ${mode || 'loop'}`,
          description: `Creating ${duration || 8}s audio`,
          steps: [
            'Initializing music service',
            'Processing prompt',
            'Generating audio',
            'Downloading result'
          ]
        }
      };
      
      console.log('🎵 Returning tool result:', toolResult);
      return toolResult;
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

const testComponent = createTool({
  id: 'test-component',
  description: 'Test tool that returns a simple component for testing the UI',
  inputSchema: z.object({
    message: z.string().describe('A test message to display'),
    variant: z.enum(['success', 'error', 'info']).optional().describe('Variant of the test component'),
  }),
  execute: async ({ context }) => {
    const { message, variant = 'success' } = context;
    console.log('🧪 TEST COMPONENT TOOL EXECUTING!');
    console.log('Message:', message);
    console.log('Variant:', variant);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: variant === 'error' ? 'error' : 'success',
      message: `Test ${variant}: ${message}`,
      componentData: {
        title: 'Test Component Output',
        content: message,
        timestamp: new Date().toISOString(),
        variant,
        metadata: {
          testId: Math.random().toString(36).substring(7),
          processedAt: Date.now(),
        }
      }
    };
  },
});

const getProjectInfo = createTool({
  id: 'get-project-info',
  description: 'Get current Ableton project information including tempo, time signature, and track count',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      // Use OSC to query actual Ableton project info
      const client = new Client('127.0.0.1', 11000);
      
      // Create a promise to collect responses
      const projectInfo: any = {};
      
      // Query tempo
      await new Promise((resolve) => {
        client.send('/live/song/get/tempo', (err) => {
          if (!err) {
            // In reality, we'd need to listen for the response on port 11001
            // For now, we'll use placeholder data
            projectInfo.tempo = 120;
          }
          resolve(true);
        });
      });
      
      // Query other properties
      await new Promise((resolve) => {
        client.send('/live/song/get/signature_numerator', (err) => {
          if (!err) {
            projectInfo.signature_numerator = 4;
          }
          resolve(true);
        });
      });
      
      await new Promise((resolve) => {
        client.send('/live/song/get/signature_denominator', (err) => {
          if (!err) {
            projectInfo.signature_denominator = 4;
          }
          resolve(true);
        });
      });
      
      client.close();
      
      return {
        status: 'success',
        bpm: projectInfo.tempo || 120,
        timeSignature: `${projectInfo.signature_numerator || 4}/${projectInfo.signature_denominator || 4}`,
        message: 'Project info retrieved (Note: OSC response listening not yet implemented, using defaults)',
      };
    } catch (error) {
      console.error('Error getting project info:', error);
      return {
        status: 'error',
        bpm: 120,
        timeSignature: '4/4',
        message: 'Could not connect to Ableton Live. Ensure AbletonOSC is running.',
      };
    }
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
    testComponent,
    abletonManual,
    abletonDocs,
    oscExecutor,
  },
});