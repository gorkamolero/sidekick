import { createTool } from '@mastra/core';
import { z } from 'zod';
import { abletonDocsAgent } from '../agents/abletonDocsAgent';

/**
 * AbletonOSC Documentation Query Tool
 * Asks the documentation expert agent for specific command information
 */
export const abletonDocs = createTool({
  id: 'abletonDocs',
  description: `Query the AbletonOSC documentation expert for specific command syntax and capabilities. 
  
  Use this tool to:
  - Find the exact OSC commands needed for a task
  - Check if something is possible with AbletonOSC
  - Get command syntax and parameters
  - Understand limitations and requirements
  
  The expert will provide concise, actionable information focused on your specific need.`,
  
  inputSchema: z.object({
    query: z.string().describe('Specific question about AbletonOSC commands or capabilities (e.g., "How do I create tracks and set tempo?", "Can I load devices?", "Commands for controlling clip playback")'),
  }),
  
  execute: async ({ context }) => {
    const { query } = context;
    
    console.log('📖 Querying AbletonOSC docs expert:', query);
    
    try {
      // Ask the documentation expert agent
      const result = await abletonDocsAgent.generate(query, {
        maxTokens: 1000,  // Keep responses concise
      });
      
      console.log('📖 Docs expert response:', result.text);
      
      return {
        status: 'success',
        query,
        answer: result.text,
        message: 'Documentation query completed',
      };
    } catch (error) {
      console.error('📖 Docs query error:', error);
      return {
        status: 'error',
        query,
        message: `Error querying documentation: ${error}`,
        answer: 'Documentation query failed. Please try rephrasing your question.',
      };
    }
  },
});