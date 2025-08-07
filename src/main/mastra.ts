import { Agent } from '@mastra/core';
import { ipcMain } from 'electron';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { tool } from 'ai';
import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create OpenRouter model
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Define tools using AI SDK v5 format
const generateMusic = tool({
  description: 'Generate a music loop based on a text prompt',
  parameters: z.object({
    prompt: z.string().describe('The music generation prompt'),
    duration: z.number().default(30).describe('Duration in seconds'),
    style: z.string().optional().describe('Music style or genre'),
  }),
  execute: async ({ prompt, duration = 30, style }) => {
    return {
      status: 'generating',
      prompt,
      duration,
      style,
      message: `Generating ${duration}s loop: "${prompt}"`,
    };
  },
});

const getProjectInfo = tool({
  description: 'Get current Ableton project information',
  parameters: z.object({}),
  execute: async () => {
    return {
      bpm: 120,
      key: 'C minor',
      timeSignature: '4/4',
    };
  },
});

// Create agent using Agent constructor
const agent = new Agent({
  id: 'sidekick-agent',
  name: 'Sidekick',
  description: 'AI assistant for music producers',
  model: openrouter('moonshotai/kimi-k2'),
  instructions: `You are Sidekick, an AI assistant for music producers using Ableton Live. 
You help create AI-generated music loops and provide production assistance.

Your capabilities:
- Generate music loops based on text descriptions
- Understand musical context (BPM, key, time signature)
- Provide production tips and suggestions
- Help with sound design ideas

Be concise, technical, and creative. Use music production terminology when appropriate.`,
  tools: {
    generateMusic,
    getProjectInfo,
  },
});

// IPC handlers for renderer communication
ipcMain.handle('agent:streamMessage', async (event, { messages }) => {
  try {
    console.log('Received IPC call for agent:streamMessage');
    
    // Use the stream method from agent with AI SDK v5 format
    const stream = await agent.stream(messages);
    
    // Handle AI SDK v5 streaming format
    for await (const chunk of stream.textStream) {
      event.sender.send('agent:streamChunk', { type: 'text', text: chunk });
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