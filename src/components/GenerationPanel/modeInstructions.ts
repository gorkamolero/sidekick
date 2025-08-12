import { GenerationMode } from './ModeSelector';

export function getModeInstructions(mode: GenerationMode, message: string): string {
  const instructions = {
    default: `[SYSTEM: AUTO MODE ACTIVE]
AI will automatically determine the best generation type based on your request.
The system will analyze your prompt and choose between:
- Loop: For seamless, repeatable patterns
- Sample: For one-shots and hits
- Inspiration: For full musical ideas

User request: ${message}`,
    
    loop: `[SYSTEM: LOOP MODE ACTIVE]
Generate a 4-8 second seamless loop that can be repeated indefinitely.
- Create consistent energy throughout
- No fade in or fade out
- Ensure the end connects smoothly to the beginning
- Optimize for layering in a DAW

User request: ${message}`,
    
    sample: `[SYSTEM: SAMPLE MODE ACTIVE]
Generate a 1 second one-shot, hit, or sample.
- Focus on impact and transient
- Create a single, distinct sound
- Suitable for triggering and sampling
- Think: drum hits, vocal chops, FX, stabs

User request: ${message}`,
    
    inspiration: `[SYSTEM: INSPIRATION MODE ACTIVE]
Generate a 15-30 second musical idea or sketch.
- Include musical development and progression
- Can have intro, main section, and variation
- Allow for creative exploration
- Suitable as a song starter or arrangement reference

User request: ${message}`
  };

  return instructions[mode];
}