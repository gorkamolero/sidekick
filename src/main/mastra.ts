import { Agent, createTool } from '@mastra/core';
import { ipcMain, BrowserWindow } from 'electron';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { MusicGenProvider } from './services/musicgen';
import { AudioService } from './services/audio';

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
  description: 'Generate a music loop based on a text prompt using MusicGen',
  inputSchema: z.object({
    prompt: z.string().describe('A detailed, MusicGen-optimized prompt that includes BPM, key, and musical descriptions'),
    duration: z.number().default(8).describe('Duration in seconds (8 is optimal for loops, max 30)'),
  }),
  execute: async ({ context }) => {
    const { prompt, duration = 8 } = context;
    console.log('🎵 MUSICGEN TOOL EXECUTING!!!');
    console.log('Parameters:', { prompt, duration });
    
    try {
      console.log('🎵 Starting MusicGen API call...');
      const musicGenProvider = new MusicGenProvider();
      const result = await musicGenProvider.generate(prompt, { duration });
      
      console.log('🎵 MusicGen SUCCESS!');
      console.log('Audio URL:', result.audioUrl);
      
      // Download and save the audio file
      const localFilePath = await audioService.downloadAndSave(result.audioUrl, prompt);
      
      // Notify renderer with the local file path
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('audio:generated', {
          prompt,
          duration,
          audioUrl: result.audioUrl,
          localFilePath,
        });
      }
      
      return {
        status: 'success',
        prompt,
        duration,
        audioUrl: result.audioUrl,
        localFilePath,
        message: `Generated ${duration}s loop and saved locally`,
      };
    } catch (error) {
      console.log('🎵 MUSICGEN FAILED!');
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

const SYSTEM_PROMPT = `You are Sidekick, an AI assistant for music producers using Ableton Live. 

CRITICAL RULE: When a user requests music generation, you MUST call the generateMusic tool immediately with a detailed prompt. DO NOT respond with text - ONLY call the tool.

MUSICGEN PROMPT CRAFTING RULES:
1. When generating music, create a DETAILED prompt that includes:
   - Genre/style (e.g., "upbeat house", "dark techno", "lo-fi hip-hop")
   - BPM in the text (e.g., "at 120 BPM")
   - Key in the text (e.g., "in C minor")
   - Specific instruments/sounds (e.g., "punchy kick", "rolling bassline", "bright synth stabs")
   - Mood/energy (e.g., "energetic", "melancholic", "aggressive")

2. Transform user slang into technical descriptions:
   - "make it slap" → "punchy drums, compressed kick, aggressive attack"
   - "thicc" → "heavy sub bass, layered low frequencies"
   - "crispy" → "bright high frequencies, clear transients"
   - "bouncy" → "swing rhythm, syncopated percussion"
   - "spacey" → "reverb-heavy, delay effects, atmospheric"

3. Duration guidelines:
   - Default to 8 seconds for loops (MusicGen's sweet spot)
   - Maximum 30 seconds
   - For hip-hop/trap: consider 4-bar loops (around 8s at 120 BPM)
   - For house/techno: consider 8-bar loops (around 16s at 120 BPM)

4. IMPORTANT - User preference ALWAYS overrides project context:
   - If user specifies BPM/key explicitly, USE THE USER'S VALUES
   - Only use [Project Context: BPM=X, Key=Y] when user doesn't specify
   - Examples:
     * User: "Generate a loop at 140 BPM" → Use 140 BPM (ignore project context)
     * User: "Make something in D minor" → Use D minor (ignore project context) 
     * User: "Create a hip-hop beat" → Use project context BPM and key

Be concise, technical, and creative. Use music production terminology when appropriate.`;

// Create the Mastra agent with tools
const agent = new Agent({
  id: 'sidekick-agent',
  name: 'Sidekick',
  description: 'AI assistant for music producers',
  model: openrouter('moonshotai/kimi-k2'),
  instructions: SYSTEM_PROMPT,
  tools: {
    generateMusic,
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
          text: part.textDelta 
        });
      } else if (part.type === 'tool-call') {
        console.log('🎵 Tool call started:', part.toolName);
        event.sender.send('agent:streamChunk', { 
          type: 'tool-call',
          toolName: part.toolName,
          toolCallId: part.toolCallId,
          args: part.args,
          status: 'calling'
        });
      } else if (part.type === 'tool-result') {
        console.log('🔧 Tool result:', part.toolName, part.result);
        event.sender.send('agent:streamChunk', { 
          type: 'tool-result',
          toolName: part.toolName,
          toolCallId: part.toolCallId,
          result: part.result,
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