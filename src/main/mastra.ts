import { Agent, createTool } from '@mastra/core';
import { ipcMain, BrowserWindow } from 'electron';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { getMusicGenerationManager } from '../services/music-generation/manager';
import { AudioService } from './services/audio';
import { SIDEKICK_SYSTEM_PROMPT } from '../shared/prompts';
import { analyzeAudio } from './tools/analyzeAudio';

// Load environment variables
dotenv.config();

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
    console.log('Parameters:', { prompt, duration, mode, model });
    
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
      
      // Notify renderer with the local file path
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('audio:generated', {
          prompt,
          duration: result.duration,
          audioUrl: result.audioUrl,
          localFilePath,
          service: result.metadata.service,
        });
      }
      
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
const agent = new Agent({
  id: 'sidekick-agent',
  name: 'Sidekick',
  description: 'AI assistant for music producers',
  model: openrouter('moonshotai/kimi-k2'),
  instructions: SIDEKICK_SYSTEM_PROMPT,
  tools: {
    generateMusic,
    analyzeAudio,
    getProjectInfo,
  },
});

// IPC handlers for renderer communication
ipcMain.handle('agent:streamMessage', async (event, { messages }) => {
  try {
    console.log('🤖 Mastra Agent streaming with messages:', messages);
    
    // Use the Mastra agent's stream method
    const result = await agent.stream(messages);
    
    // Stream all parts including tool calls and results
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        event.sender.send('agent:streamChunk', { 
          type: 'text', 
          text: (part as any).textDelta || (part as any).text
        });
      } else if (part.type === 'tool-call') {
        event.sender.send('agent:streamChunk', { 
          type: 'tool-call',
          toolName: part.toolName,
          toolCallId: (part as any).toolCallId,
          args: (part as any).args,
          status: 'calling'
        });
      } else if (part.type === 'tool-result') {
        console.log('✅ Tool result received:', part.toolName, part.output);
        event.sender.send('agent:streamChunk', { 
          type: 'tool-result',
          toolName: part.toolName,
          toolCallId: part.toolCallId,
          result: part.output,
          status: 'complete'
        });
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Agent error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

// IPC handler for direct music generation  
ipcMain.handle('musicgen:generate', async (event, { prompt, duration }) => {
  try {
    console.log('MusicGen generation request:', { prompt, duration });
    
    // This will be handled by the renderer's MusicGen provider
    // Just return success to indicate the request was received
    return { 
      success: true, 
      message: 'Generation request received' 
    };
  } catch (error) {
    console.error('MusicGen IPC error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

// IPC handler for Vercel AI SDK chat streaming
ipcMain.handle('chat:streamMessage', async (event, { messages }) => {
  try {
    console.log('📨 Chat stream request received with messages:', messages.length);
    
    // Use the MASTRA AGENT, not direct AI SDK!
    const result = await agent.stream(messages);
    
    // Convert Mastra stream to AI SDK data stream format
    const encoder = new TextEncoder();
    
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        // Format as AI SDK text chunk
        const text = (part as any).textDelta || (part as any).text || '';
        const chunk = encoder.encode(`0:"${text.replace(/"/g, '\\"')}"\n`);
        event.sender.send('chat:streamChunk', chunk);
      } else if (part.type === 'tool-call') {
        console.log('🔧 Tool call initiated:', part.toolName);
        // Format as AI SDK tool call chunk
        const chunk = encoder.encode(`9:${JSON.stringify({
          toolCallId: part.toolCallId,
          toolName: (part as any).toolName,
          args: (part as any).args
        })}\n`);
        event.sender.send('chat:streamChunk', chunk);
      } else if (part.type === 'tool-result') {
        console.log('✅ Tool result received:', part.toolName, part.output);
        // Format as AI SDK tool result chunk
        const chunk = encoder.encode(`a:${JSON.stringify({
          toolCallId: part.toolCallId,
          result: part.output
        })}\n`);
        event.sender.send('chat:streamChunk', chunk);
      }
    }
    
    // Send finish chunk
    const finishChunk = encoder.encode(`e:{}\n`);
    event.sender.send('chat:streamChunk', finishChunk);
    
    return { success: true };
  } catch (error) {
    console.error('Chat streaming error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

// IPC handler for changing music service
ipcMain.on('music:setService', (event, serviceId) => {
  try {
    console.log('Switching music service to:', serviceId);
    const manager = getMusicGenerationManager();
    manager.setActiveService(serviceId);
    event.reply('music:serviceChanged', { service: serviceId, success: true });
  } catch (error) {
    console.error('Failed to change music service:', error);
    event.reply('music:serviceChanged', { 
      service: serviceId, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});