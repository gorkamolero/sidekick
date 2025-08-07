// MusicGen prompt templates and transformations
export const MUSICGEN_TEMPLATES = {
  // Genre-specific templates
  genres: {
    house: '4-on-the-floor kick pattern, rolling bassline, {mood} house groove at {bpm} BPM',
    techno: 'driving techno beat, hypnotic percussion, {mood} atmosphere at {bpm} BPM',
    hiphop: 'boom-bap drums, {mood} hip-hop beat with swing, {bpm} BPM',
    trap: 'trap hi-hats, 808 bass, {mood} trap beat at {bpm} BPM',
    dnb: 'breakbeat drums, sub bass, {mood} drum and bass at {bpm} BPM',
    ambient: 'atmospheric pads, {mood} ambient soundscape, evolving textures',
    lofi: 'lo-fi hip-hop beat, vinyl crackle, {mood} nostalgic vibe, {bpm} BPM',
  },

  // Mood transformations
  moods: {
    dark: 'dark, minor key, filtered highs, deep reverb',
    uplifting: 'uplifting, major key, bright synths, energetic',
    melancholic: 'melancholic, emotional, sparse arrangement',
    aggressive: 'aggressive, distorted, compressed, intense',
    chill: 'chill, relaxed, smooth, laid-back',
    epic: 'epic, cinematic, orchestral elements, grand',
  },

  // Instrument focus
  instruments: {
    bass: 'focus on bassline, sub frequencies, groove-driven',
    drums: 'drum-focused, rhythmic patterns, percussion layers',
    synth: 'synthesizer lead, electronic textures, modulated sounds',
    piano: 'piano melody, acoustic feel, harmonic progression',
    guitar: 'guitar riffs, strummed chords, melodic lines',
  },
};

// Transform user input to MusicGen-optimized prompt
export function enhanceMusicGenPrompt(
  userPrompt: string,
  context?: {
    bpm?: number;
    key?: string;
    genre?: string;
  }
): string {
  let enhanced = userPrompt;

  // Add BPM if not specified but available
  if (context?.bpm && !userPrompt.includes('BPM')) {
    enhanced += ` at ${context.bpm} BPM`;
  }

  // Add key if available
  if (context?.key && !userPrompt.toLowerCase().includes('key')) {
    enhanced += ` in ${context.key}`;
  }

  // Enhance common producer slang
  const slangMap: Record<string, string> = {
    'make it slap': 'punchy drums, compressed kick, aggressive attack',
    'thicc': 'heavy sub bass, layered low frequencies, warm saturation',
    'crispy': 'bright high frequencies, clear transients, pristine clarity',
    'wonky': 'off-beat rhythm, syncopated groove, experimental timing',
    'bouncy': 'swing rhythm, syncopated percussion, groove-focused',
    'spacey': 'reverb-heavy, delay effects, atmospheric space',
    'gritty': 'distorted, lo-fi processing, analog warmth',
    'pumping': 'sidechain compression, rhythmic ducking, dance energy',
  };

  // Replace slang with MusicGen-friendly descriptions
  Object.entries(slangMap).forEach(([slang, description]) => {
    if (enhanced.toLowerCase().includes(slang)) {
      enhanced = enhanced.replace(new RegExp(slang, 'gi'), description);
    }
  });

  return enhanced;
}

// Generate variations of a prompt
export function generatePromptVariations(basePrompt: string): string[] {
  const variations = [
    basePrompt,
    `${basePrompt} with subtle variation`,
    `${basePrompt} but more minimal`,
    `${basePrompt} with added energy`,
    `${basePrompt} alternative take`,
  ];
  
  return variations;
}