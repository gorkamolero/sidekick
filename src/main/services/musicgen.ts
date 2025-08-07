import axios from 'axios';

interface GenerationParams {
  bpm?: number;
  key?: string;
  duration?: number;
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
  model_version?: 'melody' | 'large' | 'medium' | 'small';
  temperature?: number;
  top_k?: number;
  top_p?: number;
  classifier_free_guidance?: number;
  output_format?: 'wav' | 'mp3';
  multi_band_diffusion?: boolean;
  normalization_strategy?: 'loudness' | 'clip' | 'peak' | 'rms';
  seed?: number;
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
      
      // Create the prediction
      const prediction = await this.createPrediction({
        prompt: enhancedPrompt,
        duration: params.duration || 8,
        model_version: 'large',
        temperature: 1.0,
        top_k: 250,
        classifier_free_guidance: 3,
        output_format: 'wav',
        multi_band_diffusion: false,
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
      throw new Error(`Failed to generate audio: ${error.message}`);
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
      }
    );

    return response.data;
  }

  private async pollPrediction(id: string, maxAttempts = 60): Promise<ReplicatePrediction> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await axios.get(
        `${REPLICATE_API_URL}/${id}`,
        {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
          },
        }
      );

      const prediction = response.data;
      
      if (prediction.status === 'succeeded' || prediction.status === 'failed') {
        return prediction;
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Generation timed out');
  }
}