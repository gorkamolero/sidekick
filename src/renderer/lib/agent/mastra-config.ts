import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { MusicGenProvider } from '../api/musicgen';

// Initialize OpenRouter
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// System prompt for the agent
const SYSTEM_PROMPT = `You are Sidekick, an AI assistant for music producers using Ableton Live. 
You help create AI-generated music loops and provide production assistance.

Your capabilities:
- Generate music loops based on text descriptions
- Understand musical context (BPM, key, time signature)
- Provide production tips and suggestions
- Help with sound design ideas

Be concise, technical, and creative. Use music production terminology when appropriate.
Format your responses in a clear, easy-to-read manner.`;

// Define tools
export const tools = {
  generateMusic: tool({
    description: 'Generate a music loop based on a text prompt',
    parameters: z.object({
      prompt: z.string().describe('The music generation prompt'),
      duration: z.number().default(30).describe('Duration in seconds'),
      style: z.string().optional().describe('Music style or genre'),
    }),
    execute: async ({ prompt, duration = 30, style }) => {
      const provider = new MusicGenProvider();
      const result = await provider.generate(prompt, { duration });
      return {
        status: 'generating',
        prompt,
        duration,
        style,
        message: `Generating ${duration}s loop: "${prompt}"`,
        result,
      };
    },
  }),
  
  getProjectInfo: tool({
    description: 'Get current Ableton project information (BPM, key, etc)',
    parameters: z.object({}),
    execute: async () => {
      const info = await window.electron.getProjectInfo();
      return {
        bpm: info.bpm,
        key: info.key,
        timeSignature: info.timeSignature,
      };
    },
  }),
};

// Create streaming agent function
export async function* streamAgentResponse(messages: any[]) {
  const result = await streamText({
    model: openrouter('moonshotai/kimi-k2'),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,
  });

  for await (const chunk of result.textStream) {
    yield { type: 'text', content: chunk };
  }

  // Handle tool results in AI SDK v5 format
  const toolResults = await result.toolResults;
  if (toolResults) {
    for (const toolResult of toolResults) {
      yield { type: 'tool', result: toolResult };
    }
  }
}