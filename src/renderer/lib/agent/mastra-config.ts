import { Mastra } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Initialize OpenRouter model
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Create Mastra instance
export const mastra = new Mastra({
  engine: {
    provider: 'OPEN_ROUTER',
    model: 'moonshotai/kimi-k2',
  },
  tools: {},
});

// Define the music generation tool
export const musicGenerationTool = {
  name: 'generate_music',
  description: 'Generate a music loop based on a text prompt',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The music generation prompt',
      },
      duration: {
        type: 'number',
        description: 'Duration in seconds (default: 30)',
        default: 30,
      },
      style: {
        type: 'string',
        description: 'Music style or genre',
      },
    },
    required: ['prompt'],
  },
  execute: async ({ prompt, duration = 30, style }: any) => {
    // This will be connected to the actual music generation
    return {
      status: 'generating',
      prompt,
      duration,
      style,
      message: `Generating ${duration}s loop: "${prompt}"`,
    };
  },
};

// Define the project info tool
export const projectInfoTool = {
  name: 'get_project_info',
  description: 'Get current Ableton project information (BPM, key, etc)',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const info = await window.electron.getProjectInfo();
    return {
      bpm: info.bpm,
      key: info.key,
      timeSignature: info.timeSignature,
    };
  },
};

// Create the agent with tools
export const createSidekickAgent = () => {
  return mastra.createAgent({
    name: 'Sidekick',
    instructions: `You are Sidekick, an AI assistant for music producers using Ableton Live. 
You help create AI-generated music loops and provide production assistance.

Your capabilities:
- Generate music loops based on text descriptions
- Understand musical context (BPM, key, time signature)
- Provide production tips and suggestions
- Help with sound design ideas

Be concise, technical, and creative. Use music production terminology when appropriate.
Format your responses in a clear, easy-to-read manner.`,
    model: {
      provider: 'OPEN_ROUTER',
      name: 'moonshotai/kimi-k2',
      toolChoice: 'auto',
    },
    tools: {
      musicGenerationTool,
      projectInfoTool,
    },
  });
};