import axios from 'axios';

interface GenerationParams {
  bpm?: number;
  key?: string;
  duration?: number;
  model?: 'stereo-large' | 'stereo-melody-large';
  inputAudio?: string;
}

interface GenerationResult {
  audioUrl: string;
  duration: number;
}

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const MUSICGEN_VERSION = '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';

interface MusicGenInput {
  prompt: string;
  duration?: number;
  model_version?: 'stereo-large' | 'stereo-melody-large';
  temperature?: number;
  top_k?: number;
  top_p?: number;
  classifier_free_guidance?: number;
  output_format?: 'wav' | 'mp3';
  normalization_strategy?: 'loudness' | 'clip' | 'peak' | 'rms';
  seed?: number;
  input_audio?: string; // For melody continuation
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  output?: string;
  error?: string;
}

export class MusicGenProvider {
  name = 'MusicGen (Meta)';
  private apiToken: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.REPLICATE_API_TOKEN || '';
    if (!this.apiToken) {
      console.warn('MusicGen: No Replicate API token found');
    }
  }

  async generate(prompt: string, params: GenerationParams): Promise<GenerationResult> {
    try {
      // Build the enhanced prompt with context
      const enhancedPrompt = this.buildPrompt(prompt, params);
      
      // Use the model specified by the agent
      const modelVersion = params.model || 'stereo-large';
      
      console.log(`🎵 Using model: ${modelVersion} for prompt: "${enhancedPrompt}"`);
      
      // Create the prediction
      const prediction = await this.createPrediction({
        prompt: enhancedPrompt,
        duration: params.duration || 8,
        model_version: modelVersion,
        temperature: 1.0,
        top_k: 250,
        classifier_free_guidance: 3,
        output_format: 'wav',
        ...(params.inputAudio && { input_audio: params.inputAudio })
      });

      // Poll for completion
      const result = await this.pollPrediction(prediction.id);
      
      if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed');
      }

      if (!result.output) {
        throw new Error('No audio output received');
      }

      return {
        audioUrl: result.output,
        duration: params.duration || 8,
      };
    } catch (error) {
      console.error('MusicGen generation failed:', error);
      throw new Error(`Failed to generate audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildPrompt(basePrompt: string, params: GenerationParams): string {
    const parts = [basePrompt];
    
    if (params.bpm) {
      parts.push(`${params.bpm} bpm`);
    }
    
    if (params.key) {
      parts.push(`in ${params.key}`);
    }
    
    return parts.join(', ');
  }

  private isMelodicContent(prompt: string): boolean {
    // Keywords that suggest melodic content
    const melodicKeywords = [
      'melody', 'melodic', 'lead', 'solo', 'arpeggio', 'arpeggiated',
      'piano', 'guitar', 'violin', 'flute', 'saxophone', 'trumpet',
      'synth lead', 'vocal', 'singing', 'harmonic', 'chord progression',
      'riff', 'hook', 'topline', 'countermelody', 'ostinato'
    ];
    
    // Keywords that suggest rhythmic/textural content
    const rhythmicKeywords = [
      'drum', 'kick', 'snare', 'hihat', 'percussion', 'beat',
      'bass', 'sub', 'groove', 'rhythm', 'texture', 'atmosphere',
      'pad', 'ambient', 'noise', 'fx', 'sfx', 'impact'
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Count keyword matches
    const melodicScore = melodicKeywords.filter(k => lowerPrompt.includes(k)).length;
    const rhythmicScore = rhythmicKeywords.filter(k => lowerPrompt.includes(k)).length;
    
    // If explicitly melodic or more melodic keywords, use melody model
    return melodicScore > rhythmicScore;
  }

  private async createPrediction(input: MusicGenInput): Promise<ReplicatePrediction> {
    const response = await axios.post(
      REPLICATE_API_URL,
      {
        version: MUSICGEN_VERSION,
        input,
      },
      {
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout for initial request
      }
    );

    return response.data;
  }

  private async pollPrediction(id: string, maxAttempts = 90): Promise<ReplicatePrediction> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await axios.get(
        `${REPLICATE_API_URL}/${id}`,
        {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
          },
          timeout: 30000, // 30 second timeout for each poll request
        }
      );

      const prediction = response.data;
      
      if (prediction.status === 'succeeded' || prediction.status === 'failed') {
        return prediction;
      }

      // Log progress every 10 seconds
      if (attempts % 10 === 0) {
        console.log(`⏳ Generation in progress... (${attempts}s elapsed)`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Generation timed out after 90 seconds');
  }
}