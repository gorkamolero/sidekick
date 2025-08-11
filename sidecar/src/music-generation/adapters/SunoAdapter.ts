import axios from 'axios';
import { 
  MusicGenerationService, 
  MusicGenerationParams, 
  GeneratedMusic,
  ServiceCapabilities,
  ValidationResult,
  SunoConfig
} from '../types';

interface SunoGenerationRequest {
  prompt: string;
  model: 'V3_5' | 'V4' | 'V4_5';
  customMode: boolean;
  instrumental: boolean;
  lyrics?: string;
  callBackUrl?: string;
}

interface SunoGenerationResponse {
  code: number;
  msg: string;
  data?: {
    taskId?: string;
    status?: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
    audioUrl?: string;
    duration?: number;
    lyrics?: string;
    creditsUsed?: number;
  };
}

export class SunoAdapter implements MusicGenerationService {
  name = 'suno';
  private config: SunoConfig;
  private axiosInstance: any;

  constructor(config: SunoConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl || 'https://api.sunoapi.org',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async generateMusic(params: MusicGenerationParams): Promise<GeneratedMusic> {
    const duration = this.getDurationForMode(params.mode, params.duration);
    const model = this.selectModel(params);
    
    const enhancedPrompt = this.enhancePromptForMode(params.prompt, params.mode);
    
    const request: SunoGenerationRequest = {
      prompt: enhancedPrompt,
      model: this.mapModelVersion(model),
      customMode: !!params.lyrics,
      instrumental: params.makeInstrumental || false,
      lyrics: params.lyrics
    };

    try {
      const taskId = await this.initiateGeneration(request);
      
      const result = await this.pollForCompletion(taskId);
      
      if (!result.data?.audioUrl) {
        throw new Error('No audio URL received from Suno');
      }

      return {
        audioUrl: result.data.audioUrl,
        duration: result.data.duration || duration,
        format: 'mp3',
        metadata: {
          service: this.name,
          timestamp: Date.now(),
          parameters: params,
          taskId: taskId,
          model: model
        }
      };
    } catch (error) {
      console.error('Suno generation failed:', error);
      throw new Error(`Suno generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getSupportedParameters(): ServiceCapabilities {
    return {
      maxDuration: 120,
      minDuration: 5,
      supportedModes: ['loop', 'sample', 'inspiration'],
      supportedFormats: ['mp3', 'wav'],
      hasLyricsSupport: true,
      hasExtensionSupport: true,
      hasStemSeparation: true,
      models: ['V3_5', 'V4', 'V4_5']
    };
  }

  validateParameters(params: MusicGenerationParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!params.prompt || params.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    }

    if (params.prompt && params.prompt.length > 1000) {
      warnings.push('Prompt is very long, consider shortening for better results');
    }

    const duration = params.duration || this.getDurationForMode(params.mode);
    if (duration < 5) {
      errors.push('Duration must be at least 5 seconds for Suno');
    }
    if (duration > 120) {
      errors.push('Duration cannot exceed 120 seconds');
    }

    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 1.5) {
        errors.push('Temperature must be between 0 and 1.5');
      }
    }

    if (params.model && !['V3_5', 'V4', 'V4_5'].includes(params.model)) {
      errors.push(`Unsupported model: ${params.model}`);
    }

    if (params.lyrics && params.makeInstrumental) {
      warnings.push('Both lyrics and instrumental mode specified, lyrics will be ignored');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await this.axiosInstance.get('/api/v1/health', {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Suno availability check failed:', error);
      return false;
    }
  }

  private async initiateGeneration(request: SunoGenerationRequest): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/api/v1/generate', request);
      
      if (response.data.code !== 200) {
        throw new Error(response.data.msg || 'Generation request failed');
      }
      
      if (!response.data.data?.taskId) {
        throw new Error('No task ID received from Suno API');
      }
      
      return response.data.data.taskId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed: Invalid API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Insufficient credits for Suno generation');
        }
      }
      throw error;
    }
  }

  private async pollForCompletion(taskId: string): Promise<SunoGenerationResponse> {
    let attempts = 0;
    const maxAttempts = this.config.maxPollingAttempts || 120;
    const interval = this.config.pollingInterval || 2000;

    while (attempts < maxAttempts) {
      try {
        const response = await this.axiosInstance.get(`/api/v1/generate/record-info?taskId=${taskId}`);
        const data: SunoGenerationResponse = response.data;

        if (data.code !== 200) {
          throw new Error(data.msg || 'Failed to get task status');
        }

        if (data.data?.status === 'SUCCESS') {
          return data;
        }

        if (data.data?.status === 'FAILED') {
          throw new Error('Generation failed');
        }

        if (attempts % 10 === 0 && attempts > 0) {
          console.log(`⏳ Suno generation in progress... (${attempts * interval / 1000}s elapsed)`);
        }

        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          throw new Error('Task not found or expired');
        }
        throw error;
      }
    }

    throw new Error(`Generation timed out after ${maxAttempts * interval / 1000} seconds`);
  }

  private getDurationForMode(mode?: 'loop' | 'sample' | 'inspiration', customDuration?: number): number {
    if (customDuration !== undefined) return customDuration;
    
    switch (mode) {
      case 'sample':
        return 5;
      case 'loop':
        return 15;
      case 'inspiration':
        return 30;
      default:
        return 20;
    }
  }

  private selectModel(params: MusicGenerationParams): string {
    if (params.model && ['V3_5', 'V4', 'V4_5'].includes(params.model)) {
      return params.model;
    }

    if (params.mode === 'sample') {
      return 'V3_5';
    }

    if (params.mode === 'inspiration') {
      return 'V4_5';
    }

    return this.config.defaultModel || 'V4';
  }

  private mapModelVersion(model: string): 'V3_5' | 'V4' | 'V4_5' {
    const mapping: Record<string, 'V3_5' | 'V4' | 'V4_5'> = {
      'v3.5': 'V3_5',
      'V3_5': 'V3_5',
      'v4': 'V4',
      'V4': 'V4',
      'v4.5': 'V4_5',
      'V4_5': 'V4_5'
    };
    return mapping[model] || 'V4';
  }

  private enhancePromptForMode(prompt: string, mode?: 'loop' | 'sample' | 'inspiration'): string {
    const modeEnhancements: Record<string, string> = {
      'loop': 'Create a seamless loop that can be repeated indefinitely. No fade in or fade out, consistent energy throughout.',
      'sample': 'Create a single, impactful sound or hit. Focus on attack and transient.',
      'inspiration': 'Create a full musical idea with progression and variation. Allow for musical development and changes.'
    };

    const enhancement = mode ? modeEnhancements[mode] : '';
    return enhancement ? `${prompt}. ${enhancement}` : prompt;
  }
}