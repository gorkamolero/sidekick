import { Agent } from '@mastra/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env', debug: true });

// Create OpenRouter model
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Load the full AbletonOSC documentation
const docsPath = path.join(process.cwd(), '../../docs', 'AbletonOSC-README.md');
let ABLETON_OSC_FULL_DOCS = '';
try {
  ABLETON_OSC_FULL_DOCS = fs.readFileSync(docsPath, 'utf-8');
  console.log('✅ Successfully loaded AbletonOSC documentation for docs agent');
} catch (error) {
  console.error('Failed to load AbletonOSC documentation from:', docsPath);
  console.error('Error:', error);
  ABLETON_OSC_FULL_DOCS = 'Documentation not found. Please ensure AbletonOSC-README.md exists in the docs folder.';
}

// Create the AbletonOSC documentation expert agent
export const abletonDocsAgent = new Agent({
  id: 'ableton-docs-agent',
  name: 'AbletonOSC Documentation Expert',
  description: 'Expert agent that knows the complete AbletonOSC API and provides concise, actionable command information',
  model: openrouter('moonshotai/kimi-k2'),
  instructions: `You are an expert on AbletonOSC documentation with complete knowledge of all available commands.

FULL ABLETON OSC DOCUMENTATION:
${ABLETON_OSC_FULL_DOCS}

Your job is to answer questions about AbletonOSC commands based on the documentation above.

Be concise and provide exact OSC command syntax when asked.`,
  
  tools: {},
});