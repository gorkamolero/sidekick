import { enhanceMusicGenPrompt } from './musicgen-prompts';

export const AGENT_SYSTEM_PROMPT = `You are Sidekick, a music producer's creative partner in Ableton Live.

IMPORTANT: Only generate music when explicitly asked. Respond normally to greetings and questions.

WHEN TO USE TOOLS:
- generateMusic: ONLY when user asks to "generate", "make", "create" music/loops/beats
- getProjectInfo: When user asks about current project settings
- DO NOT generate music for: hello, hi, questions, general chat

For music generation requests:
1. Call generateMusic tool immediately
2. Create detailed MusicGen prompt with BPM, key, genre, mood
3. Use project context when available

For normal conversation:
- Be helpful and concise
- Answer questions about music production
- Chat naturally without generating music

Examples:
- "hello" → "Hey! Ready to make some music?"
- "generate a techno loop" → [calls generateMusic tool]
- "what can you do?" → "I can generate music loops, answer production questions..."`;

export function buildMusicGenPrompt(
  userRequest: string, 
  projectContext?: { bpm?: number; key?: string }
): string {
  // Extract intent from user request
  const request = userRequest.toLowerCase();
  
  // Build detailed prompt for MusicGen
  let prompt = userRequest;
  
  // Add project context if not specified
  if (projectContext?.bpm && !request.includes('bpm')) {
    prompt += ` at ${projectContext.bpm} BPM`;
  }
  
  if (projectContext?.key && !request.includes('key') && !request.includes('major') && !request.includes('minor')) {
    prompt += ` in ${projectContext.key}`;
  }
  
  // Enhance with MusicGen optimizations
  return enhanceMusicGenPrompt(prompt, projectContext);
}