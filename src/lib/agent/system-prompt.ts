// This file is deprecated - use the shared prompts from src/shared/prompts.ts
// Keeping for backwards compatibility and tool descriptions

import { SIDEKICK_SYSTEM_PROMPT } from '../../../shared/prompts';
export const SYSTEM_PROMPT = SIDEKICK_SYSTEM_PROMPT;

export const TOOL_DESCRIPTIONS = {
  generateMusic: 'Generate AI music loops with MusicGen',
  analyzeAudio: 'Analyze audio for BPM, key, and musical properties',
  getProjectInfo: 'Get current Ableton project context',
  saveLoop: 'Save generated loop to library',
};