import { Agent, createTool } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { SIDEKICK_SYSTEM_PROMPT } from '../../shared/prompts';

// Create OpenRouter model
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Define tools using Mastra format
const generateMusic = createTool({
  id: 'generate-music',
  description: 'Generate a music loop based on a text prompt. The system will automatically select the best available service.',
  inputSchema: z.object({
    prompt: z.string().describe('A detailed prompt describing the music you want to generate'),
    duration: z.number().optional().describe('Duration in seconds (defaults based on mode)'),
    mode: z.enum(['loop', 'sample', 'inspiration']).optional().describe('Generation mode: loop (4-8s), sample (1s), inspiration (15-30s)'),
  }),
  execute: async ({ context }) => {
    const { prompt, duration, mode } = context;
    console.log('🎵 MUSIC GENERATION TOOL EXECUTING!!!');
    console.log('Parameters:', { prompt, duration, mode });
    
    try {
      // TODO: Implement actual music generation service calls
      // For now, return mock data
      const mockDuration = duration || (mode === 'sample' ? 1 : mode === 'inspiration' ? 20 : 8);
      
      return {
        status: 'success',
        prompt,
        duration: mockDuration,
        audioUrl: 'https://example.com/generated.wav',
        localFilePath: '/tmp/sidekick-audio/generated.wav',
        service: 'mock-service',
        message: `Generated ${mockDuration}s audio using mock-service`,
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
    getProjectInfo,
  },
});

// Function to stream messages through the agent
export async function streamAgentMessage(
  messages: any[],
  metadata: any,
  onChunk: (chunk: any) => void
) {
  try {
    console.log('🤖 Mastra Agent streaming with messages:', messages);
    console.log('📝 Metadata:', metadata);
    
    // Add mode context to the agent's system message if mode is provided
    if (metadata?.mode) {
      const modeInstructions = {
        loop: `The user has selected LOOP mode. When calling generateMusic:
- Set duration to 4-8 seconds
- Ensure the prompt describes a seamless, repeatable pattern
- Focus on consistent energy and smooth loop points`,
        sample: `The user has selected SAMPLE mode. When calling generateMusic:
- Set duration to 1 second
- Focus on single hits, one-shots, or short samples
- Emphasize impact and transient design`,
        inspiration: `The user has selected INSPIRATION mode. When calling generateMusic:
- Set duration to 15-30 seconds
- Allow for musical development and progression
- Include variations and creative exploration`
      };
      
      messages.unshift({
        role: 'system',
        content: modeInstructions[metadata.mode]
      });
    }
    
    // Use the Mastra agent's stream method
    const result = await agent.stream(messages);
    
    // Stream all parts including tool calls and results
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        onChunk({ 
          type: 'text', 
          text: (part as any).textDelta || (part as any).text
        });
      } else if (part.type === 'tool-call') {
        onChunk({ 
          type: 'tool-call',
          toolName: part.toolName,
          toolCallId: (part as any).toolCallId,
          args: (part as any).args,
          status: 'calling'
        });
      } else if (part.type === 'tool-result') {
        console.log('✅ Tool result received:', part.toolName, part.output);
        onChunk({ 
          type: 'tool-result',
          toolName: part.toolName,
          toolCallId: part.toolCallId,
          result: part.output,
          status: 'complete'
        });
      } else if (part.type === 'tool-call-delta' || part.type === 'tool-call-streaming-delta') {
        console.log('🔄 Tool progress:', part);
        onChunk({ 
          type: 'tool-progress',
          toolName: part.toolName,
          toolCallId: part.toolCallId,
          delta: (part as any).delta || part,
          status: 'streaming'
        });
      } else {
        // Log any other event types we might be missing
        console.log('📦 Unknown stream event type:', part.type, part);
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
}