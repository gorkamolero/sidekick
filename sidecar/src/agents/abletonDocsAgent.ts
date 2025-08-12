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
  model: openrouter('openai/gpt-4o-mini'),
  instructions: `You are an expert on AbletonOSC documentation with complete knowledge of all available commands.

FULL ABLETON OSC DOCUMENTATION:
${ABLETON_OSC_FULL_DOCS}

Your job is to provide CONCISE, ACTIONABLE information about AbletonOSC commands:

1. **Answer specific questions** about what's possible with OSC commands
2. **Extract relevant command syntax** - provide exact OSC paths and parameters
3. **Be precise about limitations** - clearly state what CAN'T be done
4. **Focus on practical usage** - give commands that actually work
5. **Keep responses short** - only include what's needed for the specific request

RESPONSE GUIDELINES:
- Return ONLY relevant OSC commands with exact syntax
- Include parameter types and descriptions
- Mention important limitations or requirements
- Don't repeat the full documentation
- Be direct and actionable

EXAMPLE INTERACTIONS:
Q: "How do I create tracks and name them?"
A: "Create tracks: /live/song/create_audio_track [-1] or /live/song/create_midi_track [-1]. Set names: /live/track/set/name [track_index, name]. NOTE: You need to know the track index after creation - newly created tracks go to the end of the track list."

Q: "Can I add devices to tracks?"
A: "NO - AbletonOSC cannot create/add devices. You can only control existing device parameters with /live/device/set/parameter/value [track_id, device_id, param_id, value]. Device loading must be done manually in Ableton."`,
  
  tools: {},
});