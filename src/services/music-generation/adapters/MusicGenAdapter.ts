import { 
  MusicGenerationService, 
  MusicGenerationParams, 
  GeneratedMusic,
  ServiceCapabilities,
  ValidationResult,
  MusicGenConfig
} from '../types';
import { MusicGenProvider } from '../../../main/services/musicgen';

export class MusicGenAdapter implements MusicGenerationService {
  name = 'musicgen';
  private provider: MusicGenProvider;
  private config: MusicGenConfig;

  constructor(config: MusicGenConfig) {
    this.config = config;
    this.provider = new MusicGenProvider(config.apiKey);
  }

  async generateMusic(params: MusicGenerationParams): Promise<GeneratedMusic> {
    const duration = this.getDurationForMode(params.mode, params.duration);
    
    const model = this.selectModel(params);
    
    const generationParams = {
      bpm: params.bpm,
      key: params.key,
      duration,
      model: model as 'stereo-large' | 'stereo-melody-large',
      inputAudio: params.extendAudio,
    };

    const result = await this.provider.generate(params.prompt, generationParams);

    return {
      audioUrl: result.audioUrl,
      duration: result.duration,
      format: 'wav',
      metadata: {
        service: this.name,
        timestamp: Date.now(),
        parameters: params,
        model: model,
      }
    };
  }

  getSupportedParameters(): ServiceCapabilities {
    return {
      maxDuration: 30,
      minDuration: 1,
      supportedModes: ['loop', 'sample', 'inspiration'],
      supportedFormats: ['wav', 'mp3'],
      hasLyricsSupport: false,
      hasExtensionSupport: true,
      hasStemSeparation: false,
      models: ['stereo-large', 'stereo-melody-large', 'melody', 'large', 'medium', 'small']
    };
  }

  validateParameters(params: MusicGenerationParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!params.prompt || params.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    }

    if (params.prompt && params.prompt.length > 500) {
      warnings.push('Prompt is very long, consider shortening for better results');
    }

    const duration = params.duration || this.getDurationForMode(params.mode);
    if (duration < 1) {
      errors.push('Duration must be at least 1 second');
    }
    if (duration > 30) {
      errors.push('Duration cannot exceed 30 seconds');
    }

    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    if (params.model && !this.getSupportedParameters().models?.includes(params.model)) {
      errors.push(`Unsupported model: ${params.model}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      return !!this.config.apiKey || !!process.env.REPLICATE_API_TOKEN;
    } catch (error) {
      console.error('MusicGen availability check failed:', error);
      return false;
    }
  }

  private getDurationForMode(mode?: 'loop' | 'sample' | 'inspiration', customDuration?: number): number {
    if (customDuration !== undefined) return customDuration;
    
    switch (mode) {
      case 'sample':
        return 1;
      case 'loop':
        return 8;
      case 'inspiration':
        return 20;
      default:
        return this.config.defaultDuration || 8;
    }
  }

  private selectModel(params: MusicGenerationParams): string {
    if (params.model) {
      const modelMap: Record<string, string> = {
        'melody': 'stereo-melody-large',
        'large': 'stereo-large',
        'medium': 'stereo-large',
        'small': 'stereo-large',
        'stereo-large': 'stereo-large',
        'stereo-melody-large': 'stereo-melody-large'
      };
      return modelMap[params.model] || this.config.defaultModel;
    }

    if (this.isMelodicContent(params.prompt)) {
      return 'stereo-melody-large';
    }

    return this.config.defaultModel || 'stereo-large';
  }

  private isMelodicContent(prompt: string): boolean {
    const melodicKeywords = [
      'melody', 'melodic', 'lead', 'solo', 'arpeggio',
      'piano', 'guitar', 'violin', 'flute', 'saxophone',
      'synth lead', 'vocal', 'singing', 'harmonic',
      'riff', 'hook', 'topline', 'countermelody'
    ];
    
    const rhythmicKeywords = [
      'drum', 'kick', 'snare', 'hihat', 'percussion',
      'bass', 'sub', 'groove', 'rhythm', 'beat',
      'pad', 'ambient', 'noise', 'fx', 'texture'
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    const melodicScore = melodicKeywords.filter(k => lowerPrompt.includes(k)).length;
    const rhythmicScore = rhythmicKeywords.filter(k => lowerPrompt.includes(k)).length;
    
    return melodicScore > rhythmicScore;
  }
}